# environment.md — 環境設定

## 必須環境変数
- 通常のローカル開発（`npm run build`, `npm run dev`）では必須なし
- 以下は機能に応じて利用:
  - `TREND_TOPICS`（任意、カンマ区切り。`config/keywords.json` より優先）
  - `TREND_EXCLUDE_PATTERNS`（任意、カンマ区切り。`config/keywords.json` より優先）
  - `GH_TOKEN`（`npm run dispatch:research` 実行時に必須）
  - `GH_OWNER`（任意、既定: `3300okb`）
  - `GH_REPO`（任意、既定: `trend-watcher`）
  - `GH_WORKFLOW`（任意、既定: `research-and-deploy.yml`）
  - `GH_REF`（任意、既定: `main`）

## ローカル開発環境のセットアップ
```bash
npm ci
npm run sync:config
npm run build
npm run dev
```
