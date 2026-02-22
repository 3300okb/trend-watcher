# DATA_FLOW.md — データ取得・処理・出力の詳細フロー

---

## 全体フロー

```
.env
  │
  ▼
scripts/lib/runtime-config.mjs   ← 設定値のロード・正規化
  │
  ├─ getConfiguredTopics()        → TREND_TOPICS をカンマ区切りで配列化
  └─ getConfiguredExcludePatterns() → TREND_EXCLUDE_PATTERNS を配列化
        │
        ▼
config/sources.json              ← 25 ソースの RSS/Atom フィード定義
  │
  ▼
fetch-trends.mjs main()
  │
  ├─ [各ソースを逐次処理]
  │   ├─ resolveSourceFeedUrl()   ← __GOOGLE_NEWS_TOPICS_EN__ 等を実 URL に展開
  │   ├─ fetchWithTimeout()       ← HTTP GET（タイムアウト 20 秒）
  │   ├─ parseFeed()              ← RSS または Atom を自動判定してパース
  │   ├─ 記事ごとに:
  │   │   ├─ normalizeUrl()       ← UTM パラメータ除去・末尾スラッシュ正規化
  │   │   ├─ shouldExcludeArticle() ← 除外パターンマッチ
  │   │   ├─ matchTopics()        ← トピックマッチング（0 件なら破棄）
  │   │   └─ deduped Map に挿入   ← canonicalUrl でユニーク化
  │   └─ ログ記録
  │
  ├─ [翻訳フェーズ]
  │   └─ translateToJapanese()
  │       ├─ 日本語テキストはスキップ（isJapaneseText()）
  │       ├─ キャッシュヒット → キャッシュ値を返す
  │       └─ Google Translate API  ← https://translate.googleapis.com/translate_a/single
  │
  └─ [アトミック書き込み]
      ├─ public/data/trends.json        ← 全記事
      ├─ public/data/latest.json        ← 新着上位 200 件
      ├─ public/data/fetch-logs.json    ← 直近 500 件のフェッチログ
      └─ public/data/translation-cache.json ← 翻訳キャッシュ（追記）
```

---

## 設定値の読み込み優先順位

`scripts/lib/runtime-config.mjs` が以下の順でトピックを解決する:

1. `process.env.TREND_TOPICS`（CI 環境・環境変数直接指定）
2. `.env` ファイルの `TREND_TOPICS`（ローカル開発）
3. `DEFAULT_TOPICS`（フォールバック）

```javascript
// DEFAULT_TOPICS (runtime-config.mjs:4)
['Anthropic', 'OpenAI', 'Google', 'claude', 'codex', 'gemini', 'frontend']

// .env の実際の値
TREND_TOPICS=Anthropic,OpenAI,Google,Apple,claude,codex,gemini,frontend,html,css,typescript,vue
TREND_EXCLUDE_PATTERNS=Mrs. GREEN APPLE
```

---

## RSS ソース定義（config/sources.json）

25 ソースが定義されている。各エントリの構造:

```json
{
  "name": "OpenAI News",
  "url": "https://openai.com/news",
  "feedUrl": "https://openai.com/news/rss.xml",
  "weight": 1.3
}
```

| フィールド | 説明 |
|---|---|
| `name` | 表示名（`article.sourceName` に入る） |
| `url` | サイトのトップページ（参照用のみ） |
| `feedUrl` | 実際に取得する RSS/Atom URL、または特殊トークン |
| `weight` | 将来のランキング用（現在は未使用） |

### 特殊トークン

| トークン | 展開後 URL |
|---|---|
| `__GOOGLE_NEWS_TOPICS_EN__` | Google News RSS (英語・設定済みトピック) |
| `__GOOGLE_NEWS_TOPICS_JA__` | Google News RSS (日本語・設定済みトピック) |

展開ロジック（`runtime-config.mjs:79-87`）:
```javascript
// 例: topics = ['Anthropic', 'OpenAI', 'claude']
// → query = "(Anthropic OR OpenAI OR claude) when:1d"
// → https://news.google.com/rss/search?q=...&hl=en-US&gl=US&ceid=US:en
```

---

## フィードパース

`parseFeed()` は RSS と Atom の両方を自動判定する:

- `<item>` タグが存在 → RSS としてパース（`parseRssItems`）
- 存在しない → Atom としてパース（`parseAtomEntries`）

**抽出フィールド:**
- `title` — `<title>` タグ（CDATA 展開・HTML タグ除去済み）
- `url` — `<link>` タグ（RSS）または `<link href="...">` 属性（Atom）
- `summary` — `<description>`（RSS）または `<summary>`/`<content>`（Atom）
- `publishedAt` — `<pubDate>`/`<dc:date>`（RSS）または `<updated>`/`<published>`（Atom）

**制限:** 1 ソースあたり最大 30 件（`MAX_ITEMS_PER_SOURCE = 30`）

---

## 重複排除

`canonicalUrl`（UTM パラメータ除去済み URL）をキーにした Map で管理。
同一 URL が複数ソースから取得された場合、タグをマージして 1 件にまとめる:

```javascript
// fetch-trends.mjs:327-332
const key = article.canonicalUrl;
if (deduped.has(key)) {
  const prev = deduped.get(key);
  const mergedTags = [...new Set([...(prev.tags || []), ...article.tags])];
  deduped.set(key, { ...prev, tags: mergedTags });
  continue;
}
```

---

## フィルタリング

### 除外パターン（`shouldExcludeArticle`）

```javascript
// タイトル + サマリを連結してパターンマッチ（大文字小文字無視）
const text = `${article.title} ${article.summary}`.toLowerCase();
return excludePatterns.some(pattern => text.includes(pattern.toLowerCase()));
```

### トピックマッチ（`matchTopics`）

```javascript
// トピックが本文に含まれるか確認
const matched = configuredTopics.filter(topic => text.includes(topic.toLowerCase()));
// matchedTopics が空の記事は収集しない
if (matchedTopics.length === 0) continue;
```

**特殊ケース:** `apple` トピックは `Mrs. GREEN APPLE` を誤検知しないよう正規表現でガード。

---

## 翻訳処理

使用 API: `https://translate.googleapis.com/translate_a/single`（gtx クライアント）

```javascript
// 翻訳対象の判定
if (isJapaneseText(raw)) return raw;  // 既に日本語はスキップ
if (cache[textHash(raw)]) return cache[textHash(raw)];  // キャッシュヒット

// テキスト長制限: 450 文字（MAX_TRANSLATION_TEXT_LENGTH）
const short = raw.length > 450 ? raw.slice(0, 450) + '...' : raw;
```

翻訳キャッシュのキーは `sha1(originalText)`。
失敗時はフォールバックとして元テキストをキャッシュに保存し、次回リクエストを省略する。

---

## 出力ファイル構造

### `public/data/trends.json`

```json
{
  "generatedAt": "2025-01-01T00:05:00.000Z",
  "total": 123,
  "items": [
    {
      "id": "<sha1 of canonicalUrl>",
      "sourceName": "OpenAI News",
      "sourceUrl": "https://openai.com/news",
      "sourceFeedUrl": "https://openai.com/news/rss.xml",
      "title": "Original title",
      "titleJa": "日本語タイトル",
      "summary": "Original summary",
      "summaryJa": "日本語サマリ",
      "url": "https://...",
      "canonicalUrl": "https://...（UTM 除去済み）",
      "publishedAt": "2025-01-01T00:00:00.000Z",
      "hashTitle": "<sha1 of title>",
      "tags": ["OpenAI", "claude"],
      "scoredAt": "2025-01-01T00:05:00.000Z"
    }
  ]
}
```

### `public/data/fetch-logs.json`

```json
[
  {
    "sourceName": "OpenAI News",
    "sourceFeedUrl": "https://openai.com/news/rss.xml",
    "status": "success",
    "httpStatus": 200,
    "fetchedCount": 20,
    "insertedCount": 5,
    "errorMessage": null,
    "durationMs": 342,
    "fetchedAt": "2025-01-01T00:05:00.000Z"
  }
]
```

---

## RSS ソースの追加・変更方法

`config/sources.json` を直接編集する。

```json
{
  "name": "新しいブログ",
  "url": "https://example.com/blog",
  "feedUrl": "https://example.com/blog/feed.xml",
  "weight": 1.0
}
```

- `feedUrl` が RSS（`<item>`）か Atom（`<entry>`）かは自動判定される
- 追加後は `npm run job:fetch` で動作確認すること
- `fetch-logs.json` の当該ソース行で `status: "success"` を確認する
