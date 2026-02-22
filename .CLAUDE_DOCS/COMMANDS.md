# COMMANDS.md — npm スクリプト詳細

`package.json` に定義された全コマンドの用途・実行内容・注意点を記載します。

---

## コマンド一覧

### `npm run sync:config`

```bash
node scripts/sync-runtime-config.mjs
```

**用途:** `.env` の設定値を読み取り、フロントエンドが参照する JSON を生成する

**入力:** `.env`（`TREND_TOPICS`, `TREND_EXCLUDE_PATTERNS`）
**出力:** `public/data/runtime-config.json`

```json
{
  "generatedAt": "2025-01-01T00:00:00.000Z",
  "topics": ["Anthropic", "OpenAI", ...],
  "excludePatterns": ["Mrs. GREEN APPLE"]
}
```

**注意:** このファイルは `.gitignore` 対象。CI では `.env` を `GITHUB_ENV` に読み込んで生成する。

---

### `npm run build:css`

```bash
tailwindcss -i ./src/styles/tailwind.css -o ./public/assets/tailwind.css --minify
```

**用途:** `src/styles/tailwind.css` を minify して `public/assets/tailwind.css` に出力する

**入力:** `src/styles/tailwind.css`（`@tailwind base/components/utilities` のみ）
**出力:** `public/assets/tailwind.css`（minify 済み）

**注意:** `tailwind.config.cjs` で `public/**/*.html` と `public/assets/**/*.js` をスキャン対象としているため、
HTML/JS にクラスを追加したら必ずこのコマンドを再実行すること。

---

### `npm run job:fetch`

```bash
npm run sync:config && node scripts/fetch-trends.mjs
```

**用途:** RSS フィード取得 → フィルタ → 翻訳 → JSON 書き込みの完全パイプライン

**実行順序:**
1. `sync:config` — `runtime-config.json` を最新化
2. `fetch-trends.mjs` — 25+ フィードを並列取得・処理

**出力ファイル:**
| ファイル | 内容 |
|---|---|
| `public/data/trends.json` | 全記事（`items`, `generatedAt`, `total`） |
| `public/data/latest.json` | 上位 200 件のみ |
| `public/data/translation-cache.json` | 翻訳キャッシュ（永続） |
| `public/data/fetch-logs.json` | 直近 500 件のフェッチログ |

**注意:**
- 書き込みはアトミック（`.tmp` ファイル経由 → `rename()`）なので、途中でプロセスが死んでも既存 JSON は壊れない
- 失敗フィードがあっても処理は継続し、成功分だけ更新される
- Google Translate API はネットワーク必須（ローカルオフラインでは翻訳スキップ）

---

### `npm run build`

```bash
npm run sync:config && npm run build:css && node scripts/build-static.mjs
```

**用途:** デプロイ用の静的ファイルセットを `out/` に生成する

**実行順序:**
1. `sync:config` — `runtime-config.json` 最新化
2. `build:css` — Tailwind CSS コンパイル
3. `build-static.mjs` — `public/` を `out/` にコピー + `.nojekyll` 追加

**出力:** `out/`（GitHub Pages にそのままアップロードされるディレクトリ）

**注意:** `out/` は `.gitignore` 対象。CI 上でのみ生成・デプロイされる。

---

### `npm run dev`

```bash
npm run build:css && python3 -m http.server 8080 --directory public
```

**用途:** ローカル開発サーバーを起動する

**アクセス:** `http://localhost:8080`

**注意:**
- CSS をビルドしてからサーバーを起動するため、スタイル変更のたびに `Ctrl+C` → 再起動が必要
- データは `public/data/*.json` を直接参照する。事前に `npm run job:fetch` でデータを生成しておくこと
- Python 3 が必要（`python3 --version` で確認）

---

### `npm run dispatch:research`

```bash
node scripts/dispatch-workflow.mjs
```

**用途:** GitHub Actions の `research-and-deploy.yml` を手動トリガーする

**必要な環境変数:**
| 変数 | 必須 | デフォルト値 | 説明 |
|---|---|---|---|
| `GH_TOKEN` | ✅ | — | GitHub Personal Access Token（`workflow` スコープ必要） |
| `GH_OWNER` | — | `3300okb` | リポジトリオーナー |
| `GH_REPO` | — | `trend-watcher` | リポジトリ名 |
| `GH_WORKFLOW` | — | `research-and-deploy.yml` | ワークフローファイル名 |
| `GH_REF` | — | `main` | トリガー対象ブランチ |

```bash
# 実行例
GH_TOKEN=ghp_xxxx npm run dispatch:research
```

---

## 典型的な作業フロー

### ローカルでデータ更新を確認する

```bash
npm ci                  # 初回のみ
npm run job:fetch       # データ更新
npm run dev             # ブラウザで確認
```

### CSS・フロントエンドの変更を確認する

```bash
npm run build:css       # スタイル再ビルド
npm run dev             # ブラウザで確認（CSS は既にビルド済み）
```

### 本番相当のビルドを確認する

```bash
npm run build           # out/ を生成
# out/ をブラウザで直接開くか、別途サーバーで確認
```
