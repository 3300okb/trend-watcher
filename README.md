# Trend Watcher

共有レンタルサーバの制約（Node常駐不可）を前提にした、静的配信 + cron バッチ更新のトレンド集約アプリです。
GitHub Actions を使う場合は、1日2回の自動収集 + GitHub Pages への自動デプロイでも運用できます。

## 主要コマンド
- `npm run job:fetch`: RSS収集 + スコア計算 + タイトル/要約の日本語化 + `public/data/*.json` 更新
- `npm run build`: `public/` を `out/` に出力（静的配信用）
- `npm run dev`: `public/` をローカルで確認（http://localhost:8080）

## ディレクトリ
- `config/sources.json`: 収集対象ソース
- `scripts/fetch-trends.mjs`: cron から呼ぶバッチ
- `public/index.html`: Tailwind（CDN）で構築した静的UI（テーマキーワードの追加/削除UIを含む）
- `public/data/trends.json`: 表示用データ（titleJa/summaryJa を含む）
- `public/data/translation-cache.json`: 翻訳キャッシュ
- 収集ソースには `Google News Search (24h)`（`when:1d`）を含む

## cron 例（15分）
```cron
*/15 * * * * cd /home/user/trend-watcher && /usr/bin/node scripts/fetch-trends.mjs >> /home/user/logs/trend-fetch.log 2>&1
```

## 運用のポイント
- バッチは短時間で終わる設計（常駐しない）
- JSONは atomic rename で差し替え
- 失敗時は前回正常データを維持

## GitHub Actions 運用
- ワークフロー: `.github/workflows/research-and-deploy.yml`
- 実行タイミング: 毎日 2 回（UTC 00:00 / 12:00 = JST 09:00 / 21:00）
- 処理内容:
  1. `npm run job:fetch` で `public/data/*.json` 更新
  2. 変更があれば自動コミットして `main` へ push
  3. `npm run build` で `out/` 生成
  4. GitHub Pages へデプロイ

## GitHub での初期設定
1. このリポジトリを GitHub に push
2. GitHub の `Settings > Pages` で `Build and deployment` を `GitHub Actions` に設定
3. `Actions` タブから `Research And Deploy` を手動実行して初回デプロイ確認

## テーマキーワード管理
- 初期値は `Anthropic`, `OpenAI`, `Google`, `claude`, `codex`, `gemini`, `frontend`
- 画面上で `Add` で追加、チップの `×` で削除
- 状態は `localStorage`（キー: `trendWatcherTopics`）に保存

## キーワード連動の再収集
- テーマキーワードは表示フィルタだけでなく、再収集時の収集クエリにも使われます。
- `再収集` ボタンを押すと、現在のキーワードで Google News（24時間以内）を再取得し、表示を更新します。
- 収集結果のタグは `tech/ai/web` 固定ではなく、現在のキーワード（複数可）になります。
