const trendList = document.getElementById('trendList');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const keywordFilter = document.getElementById('keywordFilter');
const metaText = document.getElementById('metaText');
const template = document.getElementById('trendItemTemplate');

let allItems = [];

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
  const category = categoryFilter.value;
  const keyword = keywordFilter.value.trim().toLowerCase();

  if (category !== 'all') {
    items = items.filter((x) => x.category === category);
  }

  if (keyword) {
    items = items.filter((x) =>
      `${x.titleJa || ''} ${x.summaryJa || ''} ${x.title || ''} ${x.summary || ''}`.toLowerCase().includes(keyword)
    );
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

    categoryFilter.addEventListener('change', () => applyFilters(data.generatedAt));
    sortFilter.addEventListener('change', () => applyFilters(data.generatedAt));
    keywordFilter.addEventListener('input', () => applyFilters(data.generatedAt));

    applyFilters(data.generatedAt);
  } catch (error) {
    metaText.textContent = `データ取得に失敗しました: ${error.message}`;
  }
}

boot();
