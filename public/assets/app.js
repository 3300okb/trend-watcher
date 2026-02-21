const trendList = document.getElementById('trendList');
const sortFilter = document.getElementById('sortFilter');
const keywordFilter = document.getElementById('keywordFilter');
const metaText = document.getElementById('metaText');
const template = document.getElementById('trendItemTemplate');
const topicList = document.getElementById('topicList');
const topicInput = document.getElementById('topicInput');
const topicAddButton = document.getElementById('topicAddButton');
const recollectButton = document.getElementById('recollectButton');
const collectStatus = document.getElementById('collectStatus');

const TOPIC_STORAGE_KEY = 'trendWatcherTopics';
const DEFAULT_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'claude', 'codex', 'gemini', 'frontend'];
const MAX_ITEMS_PER_TOPIC = 30;

let allItems = [];
let topics = [];
let currentGeneratedAt = new Date().toISOString();

function normalizeTopic(value) {
  return (value || '').trim();
}

function loadTopics() {
  try {
    const raw = localStorage.getItem(TOPIC_STORAGE_KEY);
    if (!raw) return [...DEFAULT_TOPICS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_TOPICS];

    const cleaned = parsed.map(normalizeTopic).filter(Boolean);
    return cleaned.length > 0 ? [...new Set(cleaned)] : [...DEFAULT_TOPICS];
  } catch {
    return [...DEFAULT_TOPICS];
  }
}

function saveTopics() {
  localStorage.setItem(TOPIC_STORAGE_KEY, JSON.stringify(topics));
}

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('ja-JP');
}

function decodeHtml(text) {
  const el = document.createElement('textarea');
  el.innerHTML = text || '';
  return el.value;
}

function escapeXml(text) {
  return (text || '').replace(/[<>&"']/g, (m) => {
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '&') return '&amp;';
    if (m === '"') return '&quot;';
    return '&#39;';
  });
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

function scoreArticle(article, topicCount) {
  const now = Date.now();
  const published = new Date(article.publishedAt).getTime();
  const ageHours = Number.isNaN(published) ? 24 : Math.max(0, (now - published) / (1000 * 60 * 60));
  const freshnessScore = Math.max(0, 60 - ageHours * 2);
  const topicBoost = Math.min(20, topicCount * 5);
  return Number((freshnessScore + topicBoost).toFixed(2));
}

function detectTagsFromTopics(item, activeTopics) {
  const text = `${item.titleJa || ''} ${item.summaryJa || ''} ${item.title || ''} ${item.summary || ''}`.toLowerCase();
  const matched = activeTopics.filter((topic) => text.includes(topic.toLowerCase()));
  return [...new Set(matched)];
}

function applyTopicTags(items, activeTopics) {
  return items.map((item) => {
    const existing = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];
    const tags = existing.length > 0 ? [...new Set(existing)] : detectTagsFromTopics(item, activeTopics);
    return { ...item, tags };
  });
}

function render(items, generatedAt) {
  trendList.innerHTML = '';

  if (items.length === 0) {
    trendList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">該当する記事がありません。条件を変更してください。</li>';
    metaText.textContent = `件数: 0 / 更新: ${formatDate(generatedAt)}`;
    return;
  }

  for (const item of items) {
    const node = template.content.cloneNode(true);
    const title = node.querySelector('.trend-title');
    const summary = node.querySelector('.trend-summary');
    const category = node.querySelector('.category');
    const source = node.querySelector('.source');
    const published = node.querySelector('.published');
    const score = node.querySelector('.score');

    title.textContent = item.titleJa || item.title;
    title.href = item.canonicalUrl || item.url;
    summary.textContent = item.summaryJa || item.summary || 'summary unavailable';
    category.textContent = (item.tags || []).join(', ') || 'unmatched';
    source.textContent = item.sourceName || 'Google News';
    published.textContent = formatDate(item.publishedAt);
    score.textContent = `score: ${item.score?.scoreTotal ?? '-'}`;
    trendList.appendChild(node);
  }

  metaText.textContent = `件数: ${items.length} / 更新: ${formatDate(generatedAt)}`;
}

function applyFilters(generatedAt = currentGeneratedAt) {
  let items = [...allItems];
  const keyword = keywordFilter.value.trim().toLowerCase();

  if (keyword) {
    items = items.filter((x) =>
      `${x.titleJa || ''} ${x.summaryJa || ''} ${x.title || ''} ${x.summary || ''} ${(x.tags || []).join(' ')}`
        .toLowerCase()
        .includes(keyword)
    );
  }

  if (topics.length > 0) {
    items = items.filter((x) => {
      const text = `${x.titleJa || ''} ${x.summaryJa || ''} ${x.title || ''} ${x.summary || ''}`.toLowerCase();
      return topics.some((topic) => text.includes(topic.toLowerCase()));
    });
  }

  if (sortFilter.value === 'latest') {
    items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  } else {
    items.sort((a, b) => (b.score?.scoreTotal ?? 0) - (a.score?.scoreTotal ?? 0));
  }

  render(items.slice(0, 120), generatedAt);
}

function renderTopics(generatedAt = currentGeneratedAt) {
  topicList.innerHTML = '';
  for (const topic of topics) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.topic = topic;
    chip.className =
      'rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-brand transition hover:bg-cyan-100';
    chip.textContent = `${topic} ×`;
    topicList.appendChild(chip);
  }
  applyFilters(generatedAt);
}

function addTopic(value, generatedAt = currentGeneratedAt) {
  const topic = normalizeTopic(value);
  if (!topic) return;

  const lowerSet = new Set(topics.map((x) => x.toLowerCase()));
  if (lowerSet.has(topic.toLowerCase())) return;

  topics.push(topic);
  saveTopics();
  allItems = applyTopicTags(allItems, topics);
  renderTopics(generatedAt);
}

function removeTopic(value, generatedAt = currentGeneratedAt) {
  topics = topics.filter((x) => x.toLowerCase() !== value.toLowerCase());
  if (topics.length === 0) {
    topics = [...DEFAULT_TOPICS];
  }
  saveTopics();
  allItems = applyTopicTags(allItems, topics);
  renderTopics(generatedAt);
}

function toGoogleNewsFeedUrl(topic) {
  const query = `${topic} when:1d`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

async function fetchFeedXml(topic) {
  const feedUrl = toGoogleNewsFeedUrl(topic);

  try {
    const direct = await fetch(feedUrl, { cache: 'no-store' });
    if (direct.ok) return await direct.text();
  } catch {
    // fallback below
  }

  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
  const proxy = await fetch(proxyUrl, { cache: 'no-store' });
  if (!proxy.ok) {
    throw new Error(`feed fetch failed: ${topic} (HTTP ${proxy.status})`);
  }
  return await proxy.text();
}

function parseFeedItems(xml, topic) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = [...doc.querySelectorAll('item')].slice(0, MAX_ITEMS_PER_TOPIC);

  return items
    .map((item) => {
      const title = decodeHtml(item.querySelector('title')?.textContent || '');
      const url = decodeHtml(item.querySelector('link')?.textContent || '');
      const summary = decodeHtml(item.querySelector('description')?.textContent || '');
      const publishedRaw = item.querySelector('pubDate')?.textContent || '';
      const published = new Date(publishedRaw);
      if (!title || !url || Number.isNaN(published.getTime())) return null;

      const canonicalUrl = normalizeUrl(url);
      return {
        id: canonicalUrl || url,
        sourceName: 'Google News',
        sourceUrl: 'https://news.google.com/',
        sourceFeedUrl: toGoogleNewsFeedUrl(topic),
        title,
        titleJa: title,
        summary: summary ? summary.replace(/\s+/g, ' ').trim() : '',
        summaryJa: summary ? summary.replace(/\s+/g, ' ').trim() : '',
        url,
        canonicalUrl,
        publishedAt: published.toISOString(),
        tags: [topic]
      };
    })
    .filter(Boolean);
}

async function recollectByTopics() {
  if (topics.length === 0) return;

  recollectButton.disabled = true;
  recollectButton.classList.add('opacity-60', 'cursor-not-allowed');
  collectStatus.textContent = '再収集中...';

  const deduped = new Map();
  const errors = [];

  for (const topic of topics) {
    try {
      const xml = await fetchFeedXml(topic);
      const entries = parseFeedItems(xml, topic);

      for (const entry of entries) {
        const key = entry.canonicalUrl || entry.url;
        if (!deduped.has(key)) {
          deduped.set(key, entry);
          continue;
        }

        const current = deduped.get(key);
        const tags = new Set([...(current.tags || []), ...(entry.tags || [])]);
        deduped.set(key, { ...current, tags: [...tags] });
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const recollected = [...deduped.values()]
    .map((item) => ({
      ...item,
      score: {
        scoreTotal: scoreArticle(item, (item.tags || []).length)
      }
    }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  allItems = recollected;
  currentGeneratedAt = new Date().toISOString();
  applyFilters(currentGeneratedAt);

  if (errors.length > 0) {
    collectStatus.textContent = `再収集完了（${recollected.length}件）。一部失敗: ${errors.length}件`;
  } else {
    collectStatus.textContent = `再収集完了（${recollected.length}件）`;
  }

  recollectButton.disabled = false;
  recollectButton.classList.remove('opacity-60', 'cursor-not-allowed');
}

async function boot() {
  try {
    const response = await fetch('./data/trends.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allItems = data.items || [];
    currentGeneratedAt = data.generatedAt || new Date().toISOString();
    topics = loadTopics();
    allItems = applyTopicTags(allItems, topics);

    sortFilter.addEventListener('change', () => applyFilters(currentGeneratedAt));
    keywordFilter.addEventListener('input', () => applyFilters(currentGeneratedAt));
    topicAddButton.addEventListener('click', () => {
      addTopic(topicInput.value, currentGeneratedAt);
      topicInput.value = '';
    });
    topicInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addTopic(topicInput.value, currentGeneratedAt);
      topicInput.value = '';
    });
    topicList.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-topic]');
      if (!btn) return;
      removeTopic(btn.dataset.topic, currentGeneratedAt);
    });
    recollectButton.addEventListener('click', recollectByTopics);

    renderTopics(currentGeneratedAt);
    collectStatus.textContent = '再収集ボタンで現在のキーワードを使って24時間ニュースを取得できます。';
  } catch (error) {
    metaText.textContent = `データ取得に失敗しました: ${error.message}`;
  }
}

boot();
