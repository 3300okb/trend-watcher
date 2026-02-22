# COMMANDS

## 要約
- 日常作業は `npm run job:fetch` / `npm run build` / `npm run dev` を中心に使う。
- 検証は「変更対象に対応する最小コマンドのみ」を実行する。

## セットアップ
- 依存関係インストール: `npm ci`

## 主要コマンド
- 設定同期のみ: `npm run sync:config`
: `.env` から `public/data/runtime-config.json` を生成
- データ取得ジョブ: `npm run job:fetch`
: 設定同期 + トレンド取得 + 翻訳 + `public/data/*.json` 更新
- CSSビルドのみ: `npm run build:css`
: `public/assets/tailwind.css` を更新
- 静的出力ビルド: `npm run build`
: 設定同期 + CSSビルド + `out/` 生成
- ローカル確認: `npm run dev`
: `http://localhost:8080` で `public/` を配信
- 調査ワークフロー起動: `npm run dispatch:research`

## タスク別の最小実行
- データ取得ロジック変更時: `npm run job:fetch`
- UI/CSS変更時: `npm run build:css`（必要なら `npm run dev`）
- 配備前確認時: `npm run build`
- `.env` / キーワード更新時: `npm run sync:config`（必要なら続けて `npm run job:fetch`）

## 運用メモ
- 本番cronの実体は `scripts/fetch-trends.mjs` 呼び出し（詳細は `README.md` と `docs/deployment-rental-server.md`）。
- ログ確認が必要な運用では `trend-fetch.log` を確認する。

## 参照先
- `package.json`
- `README.md`
- `docs/deployment-rental-server.md`
