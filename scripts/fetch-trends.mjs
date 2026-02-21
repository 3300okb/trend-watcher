import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const SOURCES_FILE = resolve(ROOT, 'config/sources.json');
const DATA_DIR = resolve(ROOT, 'public/data');
const TRENDS_FILE = resolve(DATA_DIR, 'trends.json');
const LATEST_FILE = resolve(DATA_DIR, 'latest.json');
const LOG_FILE = resolve(DATA_DIR, 'fetch-logs.json');
const TRANSLATION_CACHE_FILE = resolve(DATA_DIR, 'translation-cache.json');
const REQUEST_TIMEOUT_MS = 20000;
const MAX_ITEMS_PER_SOURCE = 30;
const MAX_TRANSLATION_TEXT_LENGTH = 450;

const now = new Date();

const CATEGORY_KEYWORDS = {
  ai: ['ai', 'llm', 'gpt', 'model', 'inference', 'agent'],
  web: ['browser', 'css', 'javascript', 'typescript', 'web', 'frontend', 'api'],
  tech: ['cloud', 'chip', 'startup', 'security', 'infrastructure', 'data', 'device']
};

function decodeXml(input) {
  return (input || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function textBetween(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(re);
  return match ? decodeXml(match[1]) : '';
}

function normalizeUrl(raw) {
  if (!raw) return '';
  try {
    const url = new URL(raw.trim());
    const keys = [...url.searchParams.keys()];
    for (const key of keys) {
      if (key.startsWith('utm_') || key === 'fbclid' || key === 'gclid') {
        url.searchParams.delete(key);
      }
    }
    url.hash = '';
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.toString();
  } catch {
    return raw.trim();
  }
}

function titleHash(title) {
  return createHash('sha1').update((title || '').toLowerCase().trim()).digest('hex');
}

function textHash(text) {
  return createHash('sha1').update((text || '').trim()).digest('hex');
}

function isJapaneseText(text) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text || '');
}

function parseDate(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseRssItems(xml) {
  const items = [];
  const itemMatches = xml.matchAll(/<item[\s\S]*?<\/item>/gi);
  for (const match of itemMatches) {
    const block = match[0];
    const title = textBetween(block, 'title');
    const link = textBetween(block, 'link');
    const publishedRaw = textBetween(block, 'pubDate') || textBetween(block, 'dc:date');
    const summary = textBetween(block, 'description');

    if (!title || !link) continue;
    items.push({
      title,
      url: link,
      summary,
      publishedAt: parseDate(publishedRaw)
    });
  }
  return items;
}

function parseAtomEntries(xml) {
  const entries = [];
  const entryMatches = xml.matchAll(/<entry[\s\S]*?<\/entry>/gi);
  for (const match of entryMatches) {
    const block = match[0];
    const title = textBetween(block, 'title');
    const summary = textBetween(block, 'summary') || textBetween(block, 'content');
    const publishedRaw =
      textBetween(block, 'updated') || textBetween(block, 'published') || textBetween(block, 'dc:date');

    const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
    const link = linkMatch ? decodeXml(linkMatch[1]) : '';

    if (!title || !link) continue;
    entries.push({
      title,
      url: link,
      summary,
      publishedAt: parseDate(publishedRaw)
    });
  }
  return entries;
}

function parseFeed(xml) {
  const rssItems = parseRssItems(xml);
  if (rssItems.length > 0) return rssItems;
  return parseAtomEntries(xml);
}

function scoreArticle(article, sourceWeight) {
  const ageHours = Math.max(0, (now.getTime() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60));
  const freshnessScore = Math.max(0, 60 - ageHours * 2);

  const text = `${article.title} ${article.summary || ''}`.toLowerCase();
  const keywords = CATEGORY_KEYWORDS[article.category] || [];
  const keywordHits = keywords.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
  const keywordBoost = Math.min(15, keywordHits * 3);

  const sourceWeightScore = sourceWeight * 20;
  const scoreTotal = freshnessScore + sourceWeightScore + keywordBoost;

  return {
    freshnessScore: Number(freshnessScore.toFixed(2)),
    sourceWeightScore: Number(sourceWeightScore.toFixed(2)),
    keywordBoostScore: Number(keywordBoost.toFixed(2)),
    scoreTotal: Number(scoreTotal.toFixed(2))
  };
}

async function fetchWithTimeout(url) {
  if (typeof fetch !== 'function') {
    return fetchWithNodeHttp(url, REQUEST_TIMEOUT_MS);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'trend-watcher-bot/0.1 (+https://example.invalid)'
      }
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function fetchWithNodeHttp(url, timeoutMs) {
  return new Promise((resolveFetch, rejectFetch) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;

    const req = transport.request(
      parsed,
      {
        method: 'GET',
        headers: {
          'user-agent': 'trend-watcher-bot/0.1 (+https://example.invalid)'
        }
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolveFetch({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode || 0,
            text: async () => body
          });
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });
    req.on('error', rejectFetch);
    req.end();
  });
}

async function fetchJsonWithTimeout(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  return JSON.parse(text);
}

async function atomicWriteJson(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, file);
}

async function readJsonSafe(file, fallback) {
  try {
    const text = await readFile(file, 'utf8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function translateToJapanese(text, cache) {
  const raw = (text || '').trim();
  if (!raw) return '';
  if (isJapaneseText(raw)) return raw;

  const key = textHash(raw);
  if (cache[key]) return cache[key];

  const short = raw.length > MAX_TRANSLATION_TEXT_LENGTH ? `${raw.slice(0, MAX_TRANSLATION_TEXT_LENGTH)}...` : raw;
  const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(short)}`;

  try {
    const payload = await fetchJsonWithTimeout(endpoint);
    const translated = Array.isArray(payload?.[0]) ? payload[0].map((part) => part?.[0] || '').join('') : '';
    const normalized = translated.trim() || short;
    cache[key] = normalized;
    return normalized;
  } catch {
    cache[key] = short;
    return short;
  }
}

async function main() {
  const sources = JSON.parse(await readFile(SOURCES_FILE, 'utf8'));
  const logs = [];
  const deduped = new Map();
  const translationCache = await readJsonSafe(TRANSLATION_CACHE_FILE, {});

  for (const source of sources) {
    const startedAt = Date.now();
    let fetchedCount = 0;
    let insertedCount = 0;
    let status = 'success';
    let httpStatus = null;
    let errorMessage = null;

    try {
      const response = await fetchWithTimeout(source.feedUrl);
      httpStatus = response.status;
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      const items = parseFeed(xml).slice(0, MAX_ITEMS_PER_SOURCE);
      fetchedCount = items.length;

      for (const item of items) {
        if (!item.publishedAt) continue;
        const canonicalUrl = normalizeUrl(item.url);
        if (!canonicalUrl) continue;

        const article = {
          id: createHash('sha1').update(canonicalUrl).digest('hex'),
          sourceName: source.name,
          sourceUrl: source.url,
          sourceFeedUrl: source.feedUrl,
          category: source.category,
          title: item.title,
          summary: item.summary,
          url: item.url,
          canonicalUrl,
          publishedAt: item.publishedAt.toISOString(),
          hashTitle: titleHash(item.title)
        };

        const key = article.canonicalUrl;
        if (deduped.has(key)) {
          continue;
        }

        const score = scoreArticle(article, source.weight ?? 1.0);
        deduped.set(key, {
          ...article,
          score,
          scoredAt: now.toISOString()
        });
        insertedCount += 1;
      }
    } catch (error) {
      status = 'failed';
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    logs.push({
      sourceName: source.name,
      sourceFeedUrl: source.feedUrl,
      status,
      httpStatus,
      fetchedCount,
      insertedCount,
      errorMessage,
      durationMs: Date.now() - startedAt,
      fetchedAt: new Date().toISOString()
    });
  }

  const articles = [...deduped.values()].sort((a, b) => {
    if (b.score.scoreTotal !== a.score.scoreTotal) return b.score.scoreTotal - a.score.scoreTotal;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  for (const article of articles) {
    article.titleJa = await translateToJapanese(article.title, translationCache);
    article.summaryJa = await translateToJapanese(article.summary || '', translationCache);
  }

  const latest = [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const previousLogs = await readJsonSafe(LOG_FILE, []);
  const mergedLogs = [...previousLogs, ...logs].slice(-500);

  await atomicWriteJson(TRENDS_FILE, {
    generatedAt: now.toISOString(),
    total: articles.length,
    items: articles
  });

  await atomicWriteJson(LATEST_FILE, {
    generatedAt: now.toISOString(),
    total: latest.length,
    items: latest.slice(0, 200)
  });

  await atomicWriteJson(LOG_FILE, mergedLogs);
  await atomicWriteJson(TRANSLATION_CACHE_FILE, translationCache);

  console.log(`[trend-watcher] generated ${articles.length} articles at ${now.toISOString()}`);
}

main().catch((error) => {
  console.error('[trend-watcher] fetch failed', error);
  process.exitCode = 1;
});
