const trendList = document.getElementById('trendList');
const metaText = document.getElementById('metaText');
const template = document.getElementById('trendItemTemplate');
const topicList = document.getElementById('topicList');
const savedSection = document.getElementById('savedSection');
const savedList = document.getElementById('savedList');
const savedCount = document.getElementById('savedCount');
const clearSavedBtn = document.getElementById('clearSavedBtn');
const syncSavedBtn = document.getElementById('syncSavedBtn');

const STORAGE_KEY = 'trend-watcher-saved';

// ============================================================
// Supabase 認証 & 同期
// ============================================================
let sbClient = null;
let currentUser = null;

function initSupabase() {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg?.url || !cfg?.anonKey || typeof window.supabase === 'undefined') return;
  // データリクエスト（/rest/v1/）のみ cache: 'no-store' を適用（iOS Safari キャッシュ対策）
  // 認証リクエスト（/auth/v1/）は除外（CORS プリフライトの誤作動を防ぐため）
  sbClient = window.supabase.createClient(cfg.url, cfg.anonKey, {
    global: {
      fetch: (url, init) =>
        url.includes('/auth/v1/')
          ? fetch(url, init)
          : fetch(url, { ...init, cache: 'no-store' }),
    },
  });

  // INITIAL_SESSION（ページ読み込み時の既存セッション）と
  // SIGNED_IN（OAuth リダイレクト後）の両方を !prevUser で一元管理し、
  // 重複同期を防ぐ
  sbClient.auth.onAuthStateChange(async (event, session) => {
    const prevUser = currentUser;
    currentUser = session?.user ?? null;
    updateAuthUI();
    if (currentUser && !prevUser) {
      await syncWithSupabase();
    }
  });
}

async function signInWithGoogle() {
  if (!sbClient) return;
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await sbClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  if (error) alert(`Sign in failed: ${error.message}`);
}

function signOut() {
  // Clear all Supabase session keys from localStorage directly (signOut API may hang)
  Object.keys(localStorage)
    .filter((k) => k.startsWith('sb-'))
    .forEach((k) => localStorage.removeItem(k));
  // Fire signOut in background without awaiting
  if (sbClient) {
    sbClient.auth.signOut({ scope: 'local' }).catch(() => {});
  }
  currentUser = null;
  updateAuthUI();
}

function updateAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  const authUser = document.getElementById('auth-user');
  const authEmail = document.getElementById('auth-email');
  if (currentUser) {
    if (authBtn) authBtn.style.display = 'none';
    if (authUser) {
      authUser.style.display = 'flex';
      if (authEmail) authEmail.textContent = currentUser.email ?? '';
    }
    if (syncSavedBtn) syncSavedBtn.style.display = '';
  } else {
    if (authBtn) authBtn.style.display = '';
    if (authUser) authUser.style.display = 'none';
    if (syncSavedBtn) syncSavedBtn.style.display = 'none';
  }
}

async function syncWithSupabase() {
  if (!sbClient || !currentUser) return false;

  try {
    // 10秒でタイムアウト（認証トークンリフレッシュ含むリクエストのハング対策）
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );
    const fetchPromise = sbClient
      .from('saved_articles')
      .select('url, item_data')
      .eq('user_id', currentUser.id)
      .then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
    const data = await Promise.race([fetchPromise, timeoutPromise]);

    // Supabase を SOT としてlocalStorageを上書き（ダウンロードのみ）
    // localStorageの内容は再アップロードしない（削除済みアイテムの復活を防ぐため）
    const remoteItems = data.map((r) => ({ ...r.item_data, _synced: true }));
    persistSaved(remoteItems);

    renderSavedList();
    updateSaveBtnStates();
    return true;
  } catch (_) {
    // 失敗・タイムアウト時は localStorage のデータをそのまま使い続ける
    return false;
  }
}

async function addToSupabase(item) {
  if (!sbClient || !currentUser || !item?.url) return;
  try {
    await sbClient.from('saved_articles').upsert(
      { user_id: currentUser.id, url: item.url, item_data: item },
      { onConflict: 'user_id,url' },
    );
    // 同期済みとしてマーク（他デバイスで削除された場合に再アップロードしないため）
    const saved = loadSaved();
    persistSaved(saved.map((s) => (s.url === item.url ? { ...s, _synced: true } : s)));
  } catch (_) {}
}

async function removeFromSupabase(url) {
  if (!sbClient || !currentUser || !url) return;
  try {
    await sbClient.from('saved_articles').delete().eq('user_id', currentUser.id).eq('url', url);
  } catch (_) {}
}

async function clearAllFromSupabase() {
  if (!sbClient || !currentUser) return;
  try {
    await sbClient.from('saved_articles').delete().eq('user_id', currentUser.id);
  } catch (_) {}
}

const FALLBACK_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'Apple', 'claude', 'codex', 'gemini', 'frontend', 'html', 'css', 'typescript', 'vue'];
const FALLBACK_EXCLUDE_PATTERNS = ['Mrs. GREEN APPLE'];

let allItems = [];
let configuredTopics = [...FALLBACK_TOPICS];
let configuredExcludePatterns = [...FALLBACK_EXCLUDE_PATTERNS];
let currentGeneratedAt = new Date().toISOString();
let selectedTopic = null;

function renderSkeleton() {
  const chipWidths = [64, 80, 56, 96, 72, 68];
  topicList.innerHTML = chipWidths
    .map((w) => `<div class="skeleton rounded-full" style="width:${w}px;height:28px"></div>`)
    .join('');

  const card = `<li class="rounded-2xl border border-slate-200 bg-white p-4">
    <div class="flex items-start justify-between gap-2">
      <div class="skeleton rounded-full" style="width:70%;height:20px"></div>
      <div class="skeleton rounded-full" style="width:52px;height:24px;flex-shrink:0"></div>
    </div>
    <div class="mt-2" style="display:flex;flex-direction:column;gap:8px">
      <div class="skeleton rounded-full" style="width:100%;height:16px"></div>
      <div class="skeleton rounded-full" style="width:80%;height:16px"></div>
    </div>
    <div class="mt-3 flex gap-2">
      <div class="skeleton rounded-full" style="width:60px;height:24px"></div>
      <div class="skeleton rounded-full" style="width:76px;height:24px"></div>
      <div class="skeleton rounded-full" style="width:92px;height:24px"></div>
    </div>
  </li>`;
  trendList.innerHTML = Array.from({ length: 8 }, () => card).join('');
}

function formatDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('en-US');
}

function sanitizeUrl(url) {
  if (!url) return '#';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {}
  return '#';
}

// --- localStorage helpers ---

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function persistSaved(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function createSavedItemElement(item) {
  const li = document.createElement('li');
  li.className = 'flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3';
  li.dataset.savedId = item.id;

  const info = document.createElement('div');
  info.className = 'flex-1 min-w-0';

  const link = document.createElement('a');
  link.className = 'text-sm font-semibold text-blue-700 hover:underline leading-5 font-seed';
  link.href = sanitizeUrl(item.url);
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
  removeBtn.addEventListener('click', () => {
    removeBtn.blur();
    const saved = loadSaved();
    const target = saved.find((s) => s.id === item.id);
    persistSaved(saved.filter((s) => s.id !== item.id));
    if (target?.url) removeFromSupabase(target.url);
    li.remove();
    updateSavedSectionVisibility();
    const trendItem = document.querySelector(`.trend-item[data-item-id="${item.id}"]`);
    if (trendItem) {
      const btn = trendItem.querySelector('.save-btn');
      if (btn) setSaveBtnState(btn, false);
    }
  });

  li.appendChild(info);
  li.appendChild(removeBtn);
  return li;
}

function updateSavedSectionVisibility() {
  const count = loadSaved().length;
  if (count === 0) {
    savedSection.classList.add('hidden');
  } else {
    savedSection.classList.remove('hidden');
  }
  savedCount.textContent = count;
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
    savedList.appendChild(createSavedItemElement(item));
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
  trendList.setAttribute('aria-busy', 'true');
  trendList.innerHTML = '';
  const savedIds = new Set(loadSaved().map((s) => s.id));

  if (items.length === 0) {
    trendList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">No matching articles. Try different filters.</li>';
    metaText.textContent = `Items: 0 / Updated: ${formatDate(generatedAt)}`;
    trendList.setAttribute('aria-busy', 'false');
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
    title.href = sanitizeUrl(item.canonicalUrl || item.url);
    title.target = '_blank';
    title.rel = 'noopener noreferrer';
    summary.textContent = item.summaryJa || item.summary || 'summary unavailable';
    category.textContent = (item.tags || []).join(', ') || '-';
    source.textContent = item.sourceName || '-';
    published.textContent = formatDate(item.publishedAt);

    setSaveBtnState(saveBtn, savedIds.has(item.id));
    saveBtn.addEventListener('click', () => {
      saveBtn.blur();
      const saved = loadSaved();
      const isCurrentlySaved = saved.some((s) => s.id === item.id);

      // Capture layout state before DOM changes
      const scrollY = window.scrollY;
      const savedHeight = savedSection.offsetHeight;

      if (isCurrentlySaved) {
        // Data: remove from storage + Supabase
        const target = saved.find((s) => s.id === item.id);
        persistSaved(saved.filter((s) => s.id !== item.id));
        if (target?.url) removeFromSupabase(target.url);
        // DOM: targeted updates only
        setSaveBtnState(saveBtn, false);
        const savedLi = savedList.querySelector(`[data-saved-id="${item.id}"]`);
        if (savedLi) savedLi.remove();
        updateSavedSectionVisibility();
      } else {
        // Data: add to storage + Supabase
        const url = item.canonicalUrl || item.url;
        const entry = {
          id: item.id,
          url,
          title: item.titleJa || item.title,
          sourceName: item.sourceName,
          publishedAt: item.publishedAt,
        };
        saved.unshift(entry);
        persistSaved(saved);
        addToSupabase(entry);
        // DOM: targeted updates only
        setSaveBtnState(saveBtn, true);
        savedList.prepend(createSavedItemElement(entry));
        updateSavedSectionVisibility();
      }

      // Synchronous scroll correction — no rAF delay, prevents visible layout shift
      const heightDelta = savedSection.offsetHeight - savedHeight;
      if (heightDelta !== 0) {
        window.scrollTo(0, scrollY + heightDelta);
      }
    });

    trendList.appendChild(node);
  }

  metaText.textContent = `Items: ${items.length} / Updated: ${formatDate(generatedAt)}`;
  trendList.setAttribute('aria-busy', 'false');
}

function applyFilters(generatedAt = currentGeneratedAt) {
  let items = [...allItems];

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
  renderSkeleton();
  try {
    await loadRuntimeConfig();

    const response = await fetch('./data/trends.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allItems = applyTopicTags(data.items || [], configuredTopics);
    currentGeneratedAt = data.generatedAt || new Date().toISOString();

    topicList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-topic]');
      if (!button) return;
      const topic = button.dataset.topic;
      selectedTopic = selectedTopic === topic ? null : topic;
      renderTopicList();
      applyFilters(currentGeneratedAt);
    });

    syncSavedBtn?.addEventListener('click', async () => {
      if (!sbClient || !currentUser) return;
      syncSavedBtn.disabled = true;
      syncSavedBtn.innerHTML = '<svg class="inline-block animate-spin h-3 w-3 mr-1 align-[-2px]" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Syncing…';
      const ok = await syncWithSupabase();
      syncSavedBtn.textContent = ok ? 'Done' : 'Error';
      setTimeout(() => {
        if (syncSavedBtn) {
          syncSavedBtn.textContent = 'Refresh';
          syncSavedBtn.disabled = false;
        }
      }, 1500);
    });

    clearSavedBtn.addEventListener('click', () => {
      persistSaved([]);
      clearAllFromSupabase();
      renderSavedList();
      updateSaveBtnStates();
    });

    document.getElementById('auth-btn')?.addEventListener('click', signInWithGoogle);
    document.getElementById('auth-logout-btn')?.addEventListener('click', signOut);

    renderTopicList();
    renderSavedList();
    applyFilters(currentGeneratedAt);
    initSupabase();
    // ページロード時に既存セッションがあれば必ず同期
    // onAuthStateChange(INITIAL_SESSION) との競合で !currentUser ガードが機能しないケースがあるため、
    // getSession() で明示的にセッションを確認し、常に syncWithSupabase() を実行する
    if (sbClient) {
      try {
        const { data: { session } } = await sbClient.auth.getSession();
        if (session?.user) {
          currentUser = session.user;
          updateAuthUI();
          await syncWithSupabase();
        }
      } catch (_) {}
    }
  } catch (error) {
    trendList.innerHTML =
      '<li class="rounded-2xl border border-dashed border-red-200 bg-red-50 p-6 text-sm text-red-500">Failed to load articles. Please reload the page.</li>';
    topicList.innerHTML = '';
    metaText.textContent = `Failed to load data: ${error.message}`;
  }
}

boot();
