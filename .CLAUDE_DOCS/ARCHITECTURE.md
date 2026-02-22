# ARCHITECTURE.md — 構成・技術スタック・設計方針

---

## ディレクトリ構成

```
trend-watcher/
├── public/                     # 静的配信ルート（本番・dev サーバー共通）
│   ├── index.html              # SPA エントリポイント（97 行）
│   ├── assets/
│   │   ├── app.js              # フロントエンドロジック（168 行、ES Module）
│   │   ├── tailwind.css        # ビルド済み CSS（自動生成、コミット対象）
│   │   ├── LINESeedJP_OTF_Rg.woff2   # LINE Seed JP フォント（Regular）
│   │   └── LINESeedJP_OTF_Bd.woff2   # LINE Seed JP フォント（Bold）
│   └── data/                   # 実行時生成ファイル（一部 .gitignore 対象）
│       ├── trends.json         # 全記事データ（自動生成）
│       ├── latest.json         # 上位 200 件（自動生成）
│       ├── runtime-config.json # トピック/除外パターン（.gitignore 対象）
│       ├── translation-cache.json  # 翻訳キャッシュ（永続、コミット対象）
│       └── fetch-logs.json     # フェッチログ（永続、コミット対象）
│
├── scripts/                    # Node.js バッチスクリプト
│   ├── fetch-trends.mjs        # メインパイプライン（393 行）
│   ├── sync-runtime-config.mjs # .env → runtime-config.json（33 行）
│   ├── build-static.mjs        # public/ → out/ コピー（14 行）
│   ├── dispatch-workflow.mjs   # GitHub Actions 手動トリガー（34 行）
│   └── lib/
│       └── runtime-config.mjs  # 設定読み取りユーティリティ（93 行）
│
├── src/
│   └── styles/
│       └── tailwind.css        # Tailwind ディレクティブ（ソース）
│
├── config/
│   └── sources.json            # RSS/Atom フィード定義（25 ソース）
│
├── .github/
│   └── workflows/
│       └── research-and-deploy.yml  # CI/CD ワークフロー
│
├── docs/                       # 参考設計ドキュメント（実装とは別）
│   ├── deployment-rental-server.md
│   ├── implementation-plan.md
│   ├── wireframes.md
│   └── ...
│
├── out/                        # ビルド成果物（.gitignore 対象）
├── .env                        # 環境変数（トピック設定）
├── package.json                # npm スクリプト & devDependencies
└── tailwind.config.cjs         # Tailwind 設定
```

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---|---|---|
| フロントエンド | HTML5 + Vanilla JS (ES Modules) | — |
| スタイリング | Tailwind CSS + PostCSS + Autoprefixer | ^3.4.17 |
| フォント | LINE Seed JP (woff2) | — |
| バッチ処理 | Node.js (native API のみ、追加依存ゼロ) | 20 |
| デプロイ | GitHub Actions + GitHub Pages | — |
| 代替デプロイ | 静的ファイル + cron | — |

---

## フロントエンド設計（`public/assets/app.js`）

### 起動フロー（`boot()` 関数）

```
1. loadRuntimeConfig()
   └── fetch('./data/runtime-config.json')
       → configuredTopics, configuredExcludePatterns を更新
       → 失敗時はフォールバック値を使用

2. fetch('./data/trends.json')
   └── applyTopicTags(items, topics)
       → 除外パターンでフィルタ
       → タグ検出（タイトル/サマリへのトピックマッチ）

3. イベントリスナー登録
   - keywordFilter: input イベント → applyFilters()
   - topicList: click イベント（トグル） → applyFilters()

4. renderTopicList() + applyFilters()
   └── render(items.slice(0, 120), generatedAt)
```

### フォールバック値

`app.js` はサーバーなしで動作するため、`runtime-config.json` が存在しない場合に備えて
ハードコードされたフォールバック値を持つ（`FALLBACK_TOPICS`, `FALLBACK_EXCLUDE_PATTERNS`）。
これらは `.env` の値と一致させること。

### レンダリング

`<template id="trendItemTemplate">` を `cloneNode(true)` して DOM に追加する方式。
innerHTML への文字列直接代入はしていない（XSS 対策）。

表示件数は最大 120 件（`items.slice(0, 120)`）。

---

## Tailwind 設定（`tailwind.config.cjs`）

```javascript
content: ['./public/**/*.html', './public/assets/**/*.js']
```

スキャン対象は `public/` 以下の HTML と JS のみ。
`src/` 配下は Tailwind のソースファイル置き場であり、スキャン対象ではない。

**カスタムカラー:**
| 名前 | 値 | 用途 |
|---|---|---|
| `ink` | `#0f172a` | 本文テキスト |
| `paper` | `#f8fafc` | 背景 |
| `mist` | `#e2e8f0` | ボーダー |
| `brand` | `#0f766e` | アクティブ状態 |
| `accent` | `#1d4ed8` | リンク |

---

## 設計方針

### 静的ファイル優先

Node.js サーバーは不要。`public/` をそのまま HTTP サーバーに置けば動作する。
データ更新はバッチ（cron または GitHub Actions）で JSON を差し替えるだけ。

### 依存ゼロのバッチ処理

`scripts/fetch-trends.mjs` は Node.js 組み込みの `fetch`, `fs`, `crypto`, `http/https` のみを使用。
`npm ci` 後に `node_modules` に追加されるのは Tailwind 系のみで、バッチ処理自体は依存ゼロ。

### アトミック書き込み

`trends.json` 等は `.tmp` ファイルに書き込んでから `rename()` で差し替える。
処理途中でプロセスが死んでも既存ファイルが壊れない。

```javascript
// fetch-trends.mjs の書き込みパターン
const tmpFile = TRENDS_FILE + '.tmp';
await writeFile(tmpFile, JSON.stringify(data), 'utf8');
await rename(tmpFile, TRENDS_FILE);
```

### フォールバック継続

1 つのフィードが失敗しても残りの処理は継続。失敗フィードは `fetch-logs.json` に記録される。

### 翻訳キャッシュ

`translation-cache.json` は同一 URL の翻訳を永続化する。
Google Translate API のレート制限・コスト削減のため、既訳は再取得しない。
