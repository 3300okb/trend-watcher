# レンタルサーバ設置ガイド（ロリポップ標準対応）

## 1. 前提
- Node.js 常駐実行は不可
- cron で短時間バッチ実行は可能
- 本番構成は「静的配信 + cron 更新」

## 2. 配置物
- 静的サイト: `dist/`（または `out/`）
- データ: `public/data/*.json`
- バッチ: `scripts/fetch-trends.mjs`

## 3. デプロイ手順
1. ローカルでビルド
```bash
npm ci
npm run build
```
2. 静的ファイルをアップロード
```bash
rsync -av ./out/ user@server:/home/user/public_html/
```
3. バッチスクリプトをアップロード
```bash
rsync -av ./scripts/ user@server:/home/user/trend-watcher/scripts/
```
4. cron 登録（15分）
```bash
*/15 * * * * cd /home/user/trend-watcher && /usr/bin/node scripts/fetch-trends.mjs >> /home/user/logs/trend-fetch.log 2>&1
```

## 4. 実装上の注意
- バッチは数十秒〜数分で終わる設計にする
- 1回で重すぎる場合はカテゴリ別に cron を分割
- 出力JSONはテンポラリ作成後に atomic rename で差し替える
- `.env` は公開ディレクトリ外に置く

## 5. 障害時
1. `trend-fetch.log` を確認
2. 直近正常 JSON を残して表示継続
3. 取得失敗ソースのみ次回リトライ
