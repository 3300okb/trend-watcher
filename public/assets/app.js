const trendList = document.getElementById('trendList');
const sortFilter = document.getElementById('sortFilter');
const keywordFilter = document.getElementById('keywordFilter');
const metaText = document.getElementById('metaText');
const template = document.getElementById('trendItemTemplate');
const topicList = document.getElementById('topicList');

const FALLBACK_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'claude', 'codex', 'gemini', 'frontend'];

let allItems = [];
let configuredTopics = [...FALLBACK_TOPICS];
let currentGeneratedAt = new Date().toISOString();

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('ja-JP');
}

function detectTagsFromTopics(item, topics) {
  const text = `${item.titleJa || ''} ${item.summaryJa || ''} ${item.title || ''} ${item.summary || ''}`.toLowerCase();
  const matched = topics.filter((topic) => text.includes(topic.toLowerCase()));
  return [...new Set(matched)];
}

function applyTopicTags(items, topics) {
  return items.map((item) => {
    const tags = detectTagsFromTopics(item, topics);
    return { ...item, tags };
  });
}

function renderTopicList() {
  topicList.innerHTML = '';
  for (const topic of configuredTopics) {
    const chip = document.createElement('span');
    chip.className =
      'rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-brand';
    chip.textContent = topic;
    topicList.appendChild(chip);
  }
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
    category.textContent = (item.tags || []).join(', ') || item.category || '-';
    source.textContent = item.sourceName || '-';
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

  if (sortFilter.value === 'latest') {
    items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  } else {
    items.sort((a, b) => (b.score?.scoreTotal ?? 0) - (a.score?.scoreTotal ?? 0));
  }

  render(items.slice(0, 120), generatedAt);
}

async function loadRuntimeConfig() {
  try {
    const response = await fetch('./data/runtime-config.json', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    if (Array.isArray(data?.topics) && data.topics.length > 0) {
      configuredTopics = data.topics.map((x) => String(x).trim()).filter(Boolean);
    }
  } catch {
    // fallback topics are used
  }
}

async function boot() {
  try {
    await loadRuntimeConfig();

    const response = await fetch('./data/trends.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allItems = applyTopicTags(data.items || [], configuredTopics);
    currentGeneratedAt = data.generatedAt || new Date().toISOString();

    sortFilter.addEventListener('change', () => applyFilters(currentGeneratedAt));
    keywordFilter.addEventListener('input', () => applyFilters(currentGeneratedAt));

    renderTopicList();
    applyFilters(currentGeneratedAt);
  } catch (error) {
    metaText.textContent = `データ取得に失敗しました: ${error.message}`;
  }
}

boot();
