# AGENTS.md

このファイルは Codex CLI がこのリポジトリで作業する際のエントリーポイントです。

## プロジェクト概要

Trend Watcher は、RSS 由来のトレンド記事を定期収集し、日本語化して静的サイトとして配信するアプリです。`public/data/*.json` をバッチで更新し、GitHub Pages へデプロイします。

技術スタック: Node.js 20, npm scripts, ESM (`.mjs`), Tailwind CSS (CLI), 静的 HTML/CSS/JavaScript, GitHub Actions

---

## ドキュメント参照

タスクに応じて以下のファイルを参照してください。**必要なときだけ読み込んでください**（常に全部読む必要はありません）：

| ファイル | 読むタイミング |
| --- | --- |
| `.codex/workflow.md` | 作業開始時・タスクの進め方を確認するとき |
| `.codex/coding-standards.md` | コードを書く・修正する前 |
| `.codex/testing.md` | テストを書く・実行するとき |
| `.codex/git.md` | コミット・ブランチ操作を行う前 |
| `.codex/environment.md` | 環境セットアップ・環境変数を扱うとき |

---

## クイックリファレンス

よく使うコマンド（詳細は `.codex/workflow.md` 参照）：

```bash
npm run dev
npm run sync:config
npm run job:fetch
npm run build
npm run dispatch:research
```

---

## ディレクトリ構成

```text
.
├── .github/workflows/research-and-deploy.yml
├── config/
│   ├── keywords.json
│   └── sources.json
├── public/
│   ├── assets/
│   ├── data/
│   └── index.html
├── scripts/
│   ├── lib/runtime-config.mjs
│   ├── fetch-trends.mjs
│   ├── sync-runtime-config.mjs
│   ├── build-static.mjs
│   └── dispatch-workflow.mjs
├── src/styles/tailwind.css
├── package.json
└── README.md
```

### 主要ディレクトリ
- `config/`: 収集キーワード・ソース設定
- `scripts/`: バッチ処理・ビルド処理・ワークフロー dispatch スクリプト
- `public/`: 配信用静的ファイル本体（UI とデータ JSON）
- `src/styles/`: Tailwind の入力 CSS
- `.github/workflows/`: 定期収集と GitHub Pages デプロイの CI
