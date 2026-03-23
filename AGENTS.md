# AGENTS.md

このファイルは Codex CLI がこのリポジトリで作業する際のエントリーポイントです。

## プロジェクト概要

Trend Watcher は、RSS フィードから技術系トレンド記事を収集し、日本語翻訳・重複除去を行って `public/data/*.json` を更新する静的配信アプリです。収集とデプロイは GitHub Actions（毎時 05 分 UTC）で自動実行され、`out/` を GitHub Pages に配信します。

技術スタック: Node.js (ESM), JavaScript, Tailwind CSS (CLI), Vanilla JS, GitHub Actions, GitHub Pages, Supabase Auth/DB

---

## ドキュメント参照

タスクに応じて以下のファイルを参照してください。**必要なときだけ読み込んでください**（常に全部読む必要はありません）：

| ファイル | 読むタイミング |
| --- | --- |
| `.codex/project-baseline.md` | 共通品質・セキュリティ基準を確認するとき |
| `.codex/workflow.md` | 作業開始時・タスクの進め方を確認するとき |
| `.codex/coding-standards.md` | コードを書く・修正する前 |
| `.codex/testing.md` | テストを書く・実行するとき |
| `.codex/git.md` | コミット・ブランチ操作を行う前 |
| `.codex/environment.md` | 環境セットアップ・環境変数を扱うとき |
| `.codex/agents/*.toml` | サブエージェントの設定を変更・追加するとき |

---

## クイックリファレンス

よく使うコマンド（詳細は `.codex/workflow.md` 参照）：

```bash
npm run sync:config
npm run job:fetch
npm run build
npm run dev
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
├── scripts/
│   ├── AGENTS.md
│   ├── build-static.mjs
│   ├── dispatch-workflow.mjs
│   ├── fetch-trends.mjs
│   ├── sync-runtime-config.mjs
│   └── lib/runtime-config.mjs
├── src/styles/tailwind.css
├── public/
│   ├── AGENTS.md
│   ├── index.html
│   ├── assets/
│   └── data/
├── out/
├── package.json
└── README.md
```

### 主要ディレクトリ
- `config/`: キーワード・除外語・RSS ソース定義
- `scripts/`: バッチ処理とビルド処理（Node.js ESM）
- `scripts/lib/`: バッチ共通ロジック
- `src/styles/`: Tailwind のソース CSS
- `public/`: 静的配信ルート（HTML/JS/生成データ）
- `out/`: 静的ビルド成果物（GitHub Pages デプロイ対象、生成物）
