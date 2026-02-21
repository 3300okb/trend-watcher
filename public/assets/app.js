const trendList = document.getElementById('trendList');
const sortFilter = document.getElementById('sortFilter');
const keywordFilter = document.getElementById('keywordFilter');
const metaText = document.getElementById('metaText');
const template = document.getElementById('trendItemTemplate');
const topicList = document.getElementById('topicList');
const topicInput = document.getElementById('topicInput');
const topicAddButton = document.getElementById('topicAddButton');

const TOPIC_STORAGE_KEY = 'trendWatcherTopics';
const DEFAULT_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'claude', 'codex', 'gemini', 'frontend'];
let allItems = [];
let topics = [];

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

function renderTopics(generatedAt) {
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

function addTopic(value, generatedAt) {
  const topic = normalizeTopic(value);
  if (!topic) return;

  const lowerSet = new Set(topics.map((x) => x.toLowerCase()));
  if (lowerSet.has(topic.toLowerCase())) return;

  topics.push(topic);
  saveTopics();
  renderTopics(generatedAt);
}

function removeTopic(value, generatedAt) {
  topics = topics.filter((x) => x.toLowerCase() !== value.toLowerCase());
  if (topics.length === 0) {
    topics = [...DEFAULT_TOPICS];
  }
  saveTopics();
  renderTopics(generatedAt);
}

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('ja-JP');
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
    category.textContent = item.category;
    source.textContent = item.sourceName;
    published.textContent = formatDate(item.publishedAt);
    score.textContent = `score: ${item.score?.scoreTotal ?? '-'}`;
    trendList.appendChild(node);
  }

  metaText.textContent = `件数: ${items.length} / 更新: ${formatDate(generatedAt)}`;
}

function applyFilters(generatedAt) {
  let items = [...allItems];
  const keyword = keywordFilter.value.trim().toLowerCase();

  if (keyword) {
    items = items.filter((x) =>
      `${x.titleJa || ''} ${x.summaryJa || ''} ${x.title || ''} ${x.summary || ''}`.toLowerCase().includes(keyword)
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

async function boot() {
  try {
    const response = await fetch('./data/trends.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allItems = data.items || [];
    topics = loadTopics();

    sortFilter.addEventListener('change', () => applyFilters(data.generatedAt));
    keywordFilter.addEventListener('input', () => applyFilters(data.generatedAt));
    topicAddButton.addEventListener('click', () => {
      addTopic(topicInput.value, data.generatedAt);
      topicInput.value = '';
    });
    topicInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addTopic(topicInput.value, data.generatedAt);
      topicInput.value = '';
    });
    topicList.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-topic]');
      if (!btn) return;
      removeTopic(btn.dataset.topic, data.generatedAt);
    });

    renderTopics(data.generatedAt);
  } catch (error) {
    metaText.textContent = `データ取得に失敗しました: ${error.message}`;
  }
}

boot();
