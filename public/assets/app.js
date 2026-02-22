const trendList = document.getElementById('trendList');
const keywordFilter = document.getElementById('keywordFilter');
const metaText = document.getElementById('metaText');
const template = document.getElementById('trendItemTemplate');
const topicList = document.getElementById('topicList');
const savedSection = document.getElementById('savedSection');
const savedList = document.getElementById('savedList');
const savedCount = document.getElementById('savedCount');
const clearSavedBtn = document.getElementById('clearSavedBtn');

const STORAGE_KEY = 'trend-watcher-saved';

const FALLBACK_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'Apple', 'claude', 'codex', 'gemini', 'frontend', 'html', 'css', 'typescript', 'vue'];
const FALLBACK_EXCLUDE_PATTERNS = ['Mrs. GREEN APPLE'];

let allItems = [];
let configuredTopics = [...FALLBACK_TOPICS];
let configuredExcludePatterns = [...FALLBACK_EXCLUDE_PATTERNS];
let currentGeneratedAt = new Date().toISOString();
let selectedTopic = null;

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('en-US');
}

// --- localStorage helpers ---

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persistSaved(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function saveItem(item) {
  const saved = loadSaved();
  if (!saved.some((s) => s.id === item.id)) {
    saved.unshift({
      id: item.id,
      url: item.canonicalUrl || item.url,
      title: item.titleJa || item.title,
      sourceName: item.sourceName,
      publishedAt: item.publishedAt,
    });
    persistSaved(saved);
  }
  renderSavedList();
  updateSaveBtnStates();
}

function removeItem(id) {
  persistSaved(loadSaved().filter((s) => s.id !== id));
  renderSavedList();
  updateSaveBtnStates();
}

function setSaveBtnState(btn, saved) {
  if (saved) {
    btn.textContent = 'Saved';
    btn.classList.add('border-cyan-300', 'bg-cyan-50', 'text-cyan-700');
    btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-500');
  } else {
    btn.textContent = 'Save';
    btn.classList.remove('border-cyan-300', 'bg-cyan-50', 'text-cyan-700');
    btn.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-500');
  }
}

function updateSaveBtnStates() {
  const savedIds = new Set(loadSaved().map((s) => s.id));
  document.querySelectorAll('.trend-item[data-item-id]').forEach((li) => {
    const btn = li.querySelector('.save-btn');
    if (!btn) return;
    setSaveBtnState(btn, savedIds.has(li.dataset.itemId));
  });
}

function renderSavedList() {
  const saved = loadSaved();
  savedList.innerHTML = '';

  if (saved.length === 0) {
    savedSection.classList.add('hidden');
    return;
  }

  savedSection.classList.remove('hidden');
  savedCount.textContent = saved.length;

  for (const item of saved) {
    const li = document.createElement('li');
    li.className = 'flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3';
    li.dataset.savedId = item.id;

    const info = document.createElement('div');
    info.className = 'flex-1 min-w-0';

    const link = document.createElement('a');
    link.className = 'text-sm font-semibold text-blue-700 hover:underline leading-5 font-seed';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.title;

    const meta = document.createElement('p');
    meta.className = 'mt-1 text-xs text-slate-500 font-seed';
    meta.textContent = `${item.sourceName || '-'} · ${formatDate(item.publishedAt)}`;

    info.appendChild(link);
    info.appendChild(meta);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className =
      'shrink-0 self-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition font-seed';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeItem(item.id));

    li.appendChild(info);
    li.appendChild(removeBtn);
    savedList.appendChild(li);
  }
}

// --- Existing functions ---

function isTopicFalsePositive(topic, text) {
  if ((topic || '').toLowerCase() !== 'apple') return false;
  return /mrs\.?\s*green\s*apple/i.test(text);
}

function detectTagsFromTopics(item, topics) {
  const rawText = `${item.titleJa || ''} ${item.summaryJa || ''} ${item.title || ''} ${item.summary || ''}`;
  const text = rawText.toLowerCase();
  const matched = topics.filter((topic) => {
    const normalized = (topic || '').toLowerCase();
    if (!text.includes(normalized)) return false;
    if (isTopicFalsePositive(topic, rawText)) return false;
    return true;
  });
  return [...new Set(matched)];
}

function shouldExcludeItem(item, excludePatterns) {
  if (!Array.isArray(excludePatterns) || excludePatterns.length === 0) return false;
  const text = `${item.titleJa || ''} ${item.summaryJa || ''} ${item.title || ''} ${item.summary || ''}`.toLowerCase();
  return excludePatterns.some((pattern) => {
    const normalized = String(pattern || '').trim().toLowerCase();
    return normalized ? text.includes(normalized) : false;
  });
}

function applyTopicTags(items, topics) {
  return items
    .filter((item) => !shouldExcludeItem(item, configuredExcludePatterns))
    .map((item) => {
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
  const savedIds = new Set(loadSaved().map((s) => s.id));

  if (items.length === 0) {
    trendList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No matching articles. Try different filters.</li>';
    metaText.textContent = `Items: 0 / Updated: ${formatDate(generatedAt)}`;
    return;
  }

  for (const item of items) {
    const node = template.content.cloneNode(true);
    const li = node.querySelector('.trend-item');
    const title = node.querySelector('.trend-title');
    const summary = node.querySelector('.trend-summary');
    const category = node.querySelector('.category');
    const source = node.querySelector('.source');
    const published = node.querySelector('.published');
    const saveBtn = node.querySelector('.save-btn');

    li.dataset.itemId = item.id;

    title.textContent = item.titleJa || item.title;
    title.href = item.canonicalUrl || item.url;
    summary.textContent = item.summaryJa || item.summary || 'summary unavailable';
    category.textContent = (item.tags || []).join(', ') || '-';
    source.textContent = item.sourceName || '-';
    published.textContent = formatDate(item.publishedAt);

    setSaveBtnState(saveBtn, savedIds.has(item.id));
    saveBtn.addEventListener('click', () => {
      const isCurrentlySaved = loadSaved().some((s) => s.id === item.id);
      if (isCurrentlySaved) {
        removeItem(item.id);
      } else {
        saveItem(item);
      }
    });

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
    if (Array.isArray(data?.excludePatterns) && data.excludePatterns.length > 0) {
      configuredExcludePatterns = data.excludePatterns.map((x) => String(x).trim()).filter(Boolean);
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

    clearSavedBtn.addEventListener('click', () => {
      persistSaved([]);
      renderSavedList();
      updateSaveBtnStates();
    });

    renderTopicList();
    renderSavedList();
    applyFilters(currentGeneratedAt);
  } catch (error) {
    metaText.textContent = `Failed to load data: ${error.message}`;
  }
}

boot();
