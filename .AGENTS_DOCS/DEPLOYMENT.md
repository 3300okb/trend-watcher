# DEPLOYMENT

## 要約
- このプロジェクトの配備は `GitHub Actions + GitHub Pages` が基本。
- レンタルサーバ運用時は `out/` の静的配信 + cron バッチ更新を採用する。

## 配備前の最小確認
- 依存関係: `npm ci`
- データ更新確認: `npm run job:fetch`
- 配備物生成確認: `npm run build`
- 差分確認: `public/data/*.json` と `out/` の更新内容を確認

## 標準運用（GitHub Actions / Pages）
1. `main` へ push（`public/data/**` のみ変更pushは除外設定あり）
2. ワークフロー `.github/workflows/research-and-deploy.yml` が実行
3. `npm run job:fetch` -> 変更あれば自動コミット
4. `npm run build` で `out/` 生成
5. GitHub Pages へデプロイ

## レンタルサーバ運用（必要時）
1. ローカルビルド
: `npm ci && npm run build`
2. 静的ファイル配置
: `rsync -av ./out/ user@server:/home/user/public_html/`
3. バッチ配置
: `rsync -av ./scripts/ user@server:/home/user/trend-watcher/scripts/`
4. cron設定（例）
: `0 * * * * cd /home/user/trend-watcher && /usr/bin/node scripts/sync-runtime-config.mjs && /usr/bin/node scripts/fetch-trends.mjs >> /home/user/logs/trend-fetch.log 2>&1`

## 反映後確認
- 画面表示確認: 最新データが反映されているか
- ログ確認: `trend-fetch.log` に異常がないか
- フォールバック確認: 失敗時も前回正常JSONで表示継続できるか

## ルール
- 本番反映前に、差分ファイルと生成物の妥当性を確認する。
- `out/` は毎回再生成される前提で扱う。
- 手順に不明点がある場合は、推測実行せず確認を優先する。

## 参照先
- `docs/deployment-rental-server.md`
- `README.md`
- `.github/workflows/research-and-deploy.yml`
