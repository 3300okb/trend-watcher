# Trend Watcher

静的配信 + バッチ更新のトレンド集約アプリです。
GitHub Actions で収集とデプロイを実行し、1hに1回定期更新します。

## キーワード管理（config/keywords.json）
- キーワードは `config/keywords.json` の `topics` で管理します（JSON 配列）。
- 除外語は `config/keywords.json` の `excludePatterns` で管理します（JSON 配列）。
- このファイルは git で管理され、GitHub Actions でそのまま使用されます。
- `process.env.TREND_TOPICS` / `process.env.TREND_EXCLUDE_PATTERNS` による上書きも可能です。

## 主要コマンド
- `npm run sync:config`: `config/keywords.json` から `public/data/runtime-config.json` を生成
- `npm run job:fetch`: 設定同期 + RSS収集（TREND_TOPICSヒットのみ） + タイトル/要約の日本語化 + `public/data/*.json` 更新
- `npm run build`: 設定同期 + `public/` を `out/` に出力（静的配信用）
- `npm run dev`: `public/` をローカルで確認（http://localhost:8080）

## ディレクトリ
- `config/sources.json`: 収集対象ソース
- `scripts/fetch-trends.mjs`: cron から呼ぶバッチ
- `scripts/lib/runtime-config.mjs`: `config/keywords.json` からキーワードを読み込む共通処理
- `public/index.html`: Tailwind（CLIビルド）で構築した静的UI（固定キーワード表示、topicクリック絞り込み）
- `public/data/runtime-config.json`: 画面表示用のキーワード設定
- `public/data/trends.json`: 表示用データ（titleJa/summaryJa を含む）
- `public/data/translation-cache.json`: 翻訳キャッシュ

## cron 例（1時間）
```cron
0 * * * * cd /home/user/trend-watcher && /usr/bin/node scripts/sync-runtime-config.mjs && /usr/bin/node scripts/fetch-trends.mjs >> /home/user/logs/trend-fetch.log 2>&1
```

## 運用のポイント
- バッチは短時間で終わる設計（常駐しない）
- JSONは atomic rename で差し替え
- 失敗時は前回正常データを維持

## GitHub Actions 運用
- ワークフロー: `.github/workflows/research-and-deploy.yml`
- 実行トリガー:
  1. `schedule`: 毎時05分（`5 * * * *` / UTC基準）
  2. `workflow_dispatch`: 手動実行
  3. `main` への push（`public/data/**` だけのpushは除外）
- 処理内容:
  1. `npm run job:fetch` で `public/data/*.json` 更新
  2. 変更があれば自動コミットして `main` へ push
  3. `npm run build` で `out/` 生成
  4. GitHub Pages へデプロイ

## GitHub での初期設定
1. このリポジトリを GitHub に push
2. GitHub の `Settings > Pages` で `Build and deployment` を `GitHub Actions` に設定
3. `Actions` タブから `Research And Deploy` を手動実行して初回デプロイ確認
