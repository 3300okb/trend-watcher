# PROJECT_OVERVIEW

## 要約
- Trend Watcher は「バッチで収集した JSON を静的UIで表示」する構成。
- 標準運用は GitHub Actions でデータ更新とデプロイを自動実行する。

## 主な構成
- `config/sources.json`
: 収集対象RSS/Atomソース定義
- `scripts/sync-runtime-config.mjs`
: `.env` から `public/data/runtime-config.json` を生成
- `scripts/fetch-trends.mjs`
: 収集・フィルタ・翻訳・重複排除を実行し `public/data/*.json` を更新
- `scripts/build-static.mjs`
: `public/` を `out/` にコピーして静的配備物を生成
- `public/index.html`
: 表示UI本体
- `public/data/*.json`
: UIが参照するランタイムデータ
- `.github/workflows/research-and-deploy.yml`
: 定期実行と GitHub Pages デプロイ
- `docs/`
: 設計・運用・デプロイ補足資料
- `db/`
: 将来拡張用マイグレーション

## 実行経路（最小）
1. `npm run sync:config`
2. `npm run job:fetch`
3. `npm run build`（配備物が必要な時のみ）

## 更新対象の目安
- データ取得仕様を変える: `scripts/fetch-trends.mjs`, `config/sources.json`
- キーワード反映仕様を変える: `scripts/lib/runtime-config.mjs`, `.env`
- UIを変える: `public/index.html`, `src/styles/tailwind.css`
- 配備挙動を変える: `.github/workflows/research-and-deploy.yml`, `scripts/build-static.mjs`
