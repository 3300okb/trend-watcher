# Trend Watcher

静的配信 + バッチ更新のトレンド集約アプリです。
GitHub Actions で収集とデプロイを実行し、定期起動は外部 cron から `workflow_dispatch` で行います。

## キーワード管理（.env）
- キーワードは `.env` の `TREND_TOPICS` で管理します（カンマ区切り）。
- 例: `TREND_TOPICS=Anthropic,OpenAI,Google,Apple,claude,codex,gemini,frontend,html,css,typescript,vue`
- サンプル: `.env.example`
- GitHub Actions は `.env` を読み込んで実行します（workflow の `Load .env` ステップ）。

## 主要コマンド
- `npm run sync:config`: `.env` から `public/data/runtime-config.json` を生成
- `npm run job:fetch`: 設定同期 + RSS収集（TREND_TOPICSヒットのみ） + タイトル/要約の日本語化 + `public/data/*.json` 更新
- `npm run dispatch:research`: GitHub Actions の `Research And Deploy` を API で手動起動
- `npm run build`: 設定同期 + `public/` を `out/` に出力（静的配信用）
- `npm run dev`: `public/` をローカルで確認（http://localhost:8080）

## ディレクトリ
- `config/sources.json`: 収集対象ソース
- `scripts/fetch-trends.mjs`: cron から呼ぶバッチ
- `scripts/lib/runtime-config.mjs`: `.env` からキーワードを読み込む共通処理
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
  1. `workflow_dispatch`（外部cronからAPI実行）
  2. `main` への push（`public/data/**` だけのpushは除外）
- 処理内容:
  1. `npm run job:fetch` で `public/data/*.json` 更新
  2. 変更があれば自動コミットして `main` へ push
  3. `npm run build` で `out/` 生成
  4. GitHub Pages へデプロイ

## 外部 cron で毎時05分に固定実行する
1. GitHub で Personal Access Token を作成（`repo` 権限）
2. 外部実行環境に環境変数を設定
   - `GH_TOKEN` (必須)
   - `GH_OWNER` (省略時: `3300okb`)
   - `GH_REPO` (省略時: `trend-watcher`)
   - `GH_WORKFLOW` (省略時: `research-and-deploy.yml`)
   - `GH_REF` (省略時: `main`)
3. 外部 cron で毎時05分に以下を実行

```cron
5 * * * * cd /path/to/trend-watcher && GH_TOKEN=*** npm run dispatch:research >> /path/to/logs/dispatch.log 2>&1
```

## GitHub での初期設定
1. このリポジトリを GitHub に push
2. GitHub の `Settings > Pages` で `Build and deployment` を `GitHub Actions` に設定
3. `Actions` タブから `Research And Deploy` を手動実行して初回デプロイ確認
