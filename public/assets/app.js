const trendList = document.getElementById('trendList');
const keywordFilter = document.getElementById('keywordFilter');
const metaText = document.getElementById('metaText');
const template = document.getElementById('trendItemTemplate');
const topicList = document.getElementById('topicList');

const FALLBACK_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'Apple', 'claude', 'codex', 'gemini', 'frontend', 'html', 'css', 'typescript', 'vue'];

let allItems = [];
let configuredTopics = [...FALLBACK_TOPICS];
let currentGeneratedAt = new Date().toISOString();
let selectedTopic = null;

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('en-US');
}

function detectTagsFromTopics(item, topics) {
  const text = `${item.titleJa || ''} ${item.summaryJa || ''} ${item.title || ''} ${item.summary || ''}`.toLowerCase();
  const matched = topics.filter((topic) => text.includes(topic.toLowerCase()));
  return [...new Set(matched)];
}

function applyTopicTags(items, topics) {
  return items.map((item) => {
    const existing = Array.isArray(item.tags) ? item.tags.filter(Boolean) : [];
    const tags = existing.length > 0 ? [...new Set(existing)] : detectTagsFromTopics(item, topics);
    return { ...item, tags };
  });
}

function renderTopicList() {
  topicList.innerHTML = '';
  for (const topic of configuredTopics) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.dataset.topic = topic;
    const isActive = selectedTopic === topic;
    chip.className = isActive
      ? 'rounded-full border border-brand bg-brand px-3 py-1 text-xs text-cyan-700 text-white font-seed'
      : 'rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-700 text-brand font-seed';
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    chip.textContent = topic;
    topicList.appendChild(chip);
  }
}

function render(items, generatedAt) {
  trendList.innerHTML = '';

  if (items.length === 0) {
    trendList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No matching articles. Try different filters.</li>';
    metaText.textContent = `Items: 0 / Updated: ${formatDate(generatedAt)}`;
    return;
  }

  for (const item of items) {
    const node = template.content.cloneNode(true);
    const title = node.querySelector('.trend-title');
    const summary = node.querySelector('.trend-summary');
    const category = node.querySelector('.category');
    const source = node.querySelector('.source');
    const published = node.querySelector('.published');

    title.textContent = item.titleJa || item.title;
    title.href = item.canonicalUrl || item.url;
    summary.textContent = item.summaryJa || item.summary || 'summary unavailable';
    category.textContent = (item.tags || []).join(', ') || '-';
    source.textContent = item.sourceName || '-';
    published.textContent = formatDate(item.publishedAt);
    trendList.appendChild(node);
  }

  metaText.textContent = `Items: ${items.length} / Updated: ${formatDate(generatedAt)}`;
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

  if (selectedTopic) {
    items = items.filter((x) => (x.tags || []).includes(selectedTopic));
  }

  items.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

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

    keywordFilter.addEventListener('input', () => applyFilters(currentGeneratedAt));
    topicList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-topic]');
      if (!button) return;
      const topic = button.dataset.topic;
      selectedTopic = selectedTopic === topic ? null : topic;
      renderTopicList();
      applyFilters(currentGeneratedAt);
    });

    renderTopicList();
    applyFilters(currentGeneratedAt);
  } catch (error) {
    metaText.textContent = `Failed to load data: ${error.message}`;
  }
}

boot();
