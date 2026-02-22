# DATA_FLOW

## 要約
- 入力は `config/sources.json` と `.env`、出力は `public/data/*.json` と `out/`。
- `npm run job:fetch` がデータJSONを更新し、`npm run build` が静的配信用 `out/` を生成する。

## 入力
- ソース定義: `config/sources.json`
- ランタイム設定元: `.env`（`scripts/lib/runtime-config.mjs` で解釈）
- 既存キャッシュ/ログ: `public/data/translation-cache.json` / `public/data/fetch-logs.json`

## 処理フロー
1. `npm run sync:config`
: `scripts/sync-runtime-config.mjs` が `.env` からトピック/除外語を読み取り、`public/data/runtime-config.json` を生成
2. `npm run job:fetch`
: `scripts/fetch-trends.mjs` がRSS/Atomを取得し、トピック一致・除外判定・重複排除・日本語化を実行
3. `npm run build`
: `scripts/build-static.mjs` が `public/` を `out/` にコピーし静的配信物を作成

## 出力ファイル
- `public/data/runtime-config.json`
: 画面表示用のトピック・除外語設定
- `public/data/trends.json`
: 全件データ（`items` + `generatedAt` + `total`）
- `public/data/latest.json`
: 新着データ（先頭200件）
- `public/data/fetch-logs.json`
: 取得ログ（直近500件）
- `public/data/translation-cache.json`
: 翻訳キャッシュ
- `out/`
: デプロイ対象の静的ファイル一式

## 注意
- `scripts/fetch-trends.mjs` は `public/data/*.json` を上書き更新する（原子的な tmp -> rename 書き込み）。
- `scripts/build-static.mjs` は `out/` を毎回削除して再生成する。
- データのみ更新したい場合は `npm run job:fetch` まで、配備物が必要な時だけ `npm run build` を実行する。
