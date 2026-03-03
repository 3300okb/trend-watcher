# environment.md — 環境設定

## 必須環境変数
- `.env.example` は未確認
- ただし実装・README から以下の利用を確認:
  - `TREND_TOPICS`（`config/keywords.json` の topics を上書き）
  - `TREND_EXCLUDE_PATTERNS`（`config/keywords.json` の excludePatterns を上書き）

## ローカル開発環境のセットアップ
```bash
npm ci
npm run sync:config
npm run dev
```

## 本番/CI 実行で使うコマンド
```bash
npm run job:fetch
npm run build
```
