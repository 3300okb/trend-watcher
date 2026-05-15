import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const ARTICLE_FETCH_TIMEOUT_MS = 12000;
const ARTICLE_FETCH_USER_AGENT =
  'Mozilla/5.0 (compatible; trend-watcher-bot/0.2; +https://example.invalid)';
const MAX_BODY_CHARS = 8000;
const MIN_BODY_CHARS_FOR_FULL = 300;
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_TIMEOUT_MS = 20000;
const OPENAI_MODEL = process.env.OPENAI_SUMMARY_MODEL || 'gpt-5-nano';

const SYSTEM_PROMPT =
  '与えられた記事のタイトルと本文から、日本語で2〜3文・150〜200字程度の要約を作成してください。' +
  '本文に書かれた事実のみを使い、推測・補完・誇張は禁止です。' +
  '不明な固有名詞は省略し、無理に訳さないでください。出力は要約文のみで、前置きや見出しは付けないでください。';

const FALLBACK_SYSTEM_PROMPT =
  '与えられた記事タイトルと簡易説明文から、日本語で1〜2文・100〜150字程度の要約を作成してください。' +
  '与えられた情報のみで構成し、推測や情報の追加は禁止です。出力は要約文のみで、前置きや見出しは付けないでください。';

function detectCharset(contentType, buffer) {
  const headerMatch = /charset=["']?([\w-]+)/i.exec(contentType || '');
  if (headerMatch) return headerMatch[1].toLowerCase();
  const head = Buffer.from(buffer.slice(0, 2048)).toString('latin1');
  const metaCharset = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head);
  if (metaCharset) return metaCharset[1].toLowerCase();
  const metaHttpEquiv = /<meta[^>]+http-equiv=["']?content-type["']?[^>]+charset=([\w-]+)/i.exec(head);
  if (metaHttpEquiv) return metaHttpEquiv[1].toLowerCase();
  return 'utf-8';
}

async function fetchArticleHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ARTICLE_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': ARTICLE_FETCH_USER_AGENT,
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ja,en;q=0.8'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('xml')) {
      throw new Error(`unsupported content-type: ${contentType}`);
    }
    const buffer = await response.arrayBuffer();
    const charset = detectCharset(contentType, buffer);
    try {
      return new TextDecoder(charset, { fatal: false }).decode(buffer);
    } catch {
      return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function extractArticleText(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const parsed = reader.parse();
  if (!parsed || !parsed.textContent) return '';
  const text = parsed.textContent.replace(/\s+/g, ' ').trim();
  if (text.length > MAX_BODY_CHARS) {
    return text.slice(0, MAX_BODY_CHARS);
  }
  return text;
}

export async function extractArticleBody(url) {
  try {
    const html = await fetchArticleHtml(url);
    const text = extractArticleText(html, url);
    return text || null;
  } catch {
    return null;
  }
}

async function callOpenAi({ apiKey, systemPrompt, userContent }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ]
      })
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenAI HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }
    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content || '';
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

export async function summarizeArticle({ apiKey, title, body }) {
  if (!apiKey) return null;
  const trimmedBody = (body || '').trim();
  if (trimmedBody.length < MIN_BODY_CHARS_FOR_FULL) return null;
  const userContent = `タイトル: ${title}\n\n本文:\n${trimmedBody}`;
  try {
    const summary = await callOpenAi({
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      userContent
    });
    return summary || null;
  } catch (error) {
    console.warn(`[summarize] failed for "${title}": ${error.message}`);
    return null;
  }
}

export async function summarizeFromTitleAndDescription({ apiKey, title, description }) {
  if (!apiKey) return null;
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) return null;
  const userContent = `タイトル: ${trimmedTitle}\n\n説明: ${(description || '').trim() || '(なし)'}`;
  try {
    const summary = await callOpenAi({
      apiKey,
      systemPrompt: FALLBACK_SYSTEM_PROMPT,
      userContent
    });
    return summary || null;
  } catch (error) {
    console.warn(`[summarize-fallback] failed for "${title}": ${error.message}`);
    return null;
  }
}
