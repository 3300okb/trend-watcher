# AGENTS.md

このファイルは Codex CLI がこのリポジトリで作業する際のエントリーポイントです。

## プロジェクト概要

**Trend Watcher** — 静的配信 + バッチ更新のトレンド集約アプリ。

GitHub Actions で RSS フィード収集・Google 翻訳・GitHub Pages デプロイを 1 時間ごとに自動実行する。
キーワードにマッチしたテクノロジー系ニュースを日本語化して静的サイトで表示する。

技術スタック: Node.js v20 (ESM / `.mjs`) / TailwindCSS v3 / バニラ JavaScript / GitHub Actions / GitHub Pages / Supabase (Auth + DB) / Python3 (ローカル開発サーバー)

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
| `.codex/agents/*.toml` | サブエージェントの設定を変更・追加するとき |

---

## クイックリファレンス

よく使うコマンド（詳細は `.codex/workflow.md` 参照）：

```bash
# ローカル開発サーバー起動（http://localhost:8080）
npm run dev

# トレンドデータ収集（RSS フェッチ + 翻訳 + JSON 更新）
npm run job:fetch

# 静的サイトビルド（out/ に出力）
npm run build

# CSS のみビルド
npm run build:css

# config/keywords.json → public/data/runtime-config.json 同期
npm run sync:config
```

---

## ディレクトリ構成

```
trend-watcher/
├── .codex/                  # Codex CLI 設定・ルールファイル
│   ├── agents/              # カスタムサブエージェント定義
│   ├── workflow.md
│   ├── coding-standards.md
│   ├── testing.md
│   ├── git.md
│   └── environment.md
├── .github/workflows/       # CI/CD パイプライン
│   └── research-and-deploy.yml
├── config/                  # 設定ファイル
│   ├── keywords.json        # キーワード・除外パターン定義
│   └── sources.json         # RSS フィードソース定義
├── public/                  # 静的サイト（GitHub Pages 配信対象）
│   ├── assets/              # JS・CSS・フォント
│   │   ├── app.js           # フロントエンド JS（ES module）
│   │   ├── supabase-config.js # Supabase 設定
│   │   └── tailwind.css     # ビルド済み CSS
│   ├── data/                # バッチ生成 JSON データ
│   │   ├── trends.json      # メインデータ
│   │   ├── latest.json      # 最新データ
│   │   ├── fetch-logs.json  # フェッチログ
│   │   └── translation-cache.json
│   └── index.html           # フロントエンド HTML
├── scripts/                 # バッチスクリプト（ESM）
│   ├── fetch-trends.mjs     # メインバッチ: RSS 取得・翻訳・JSON 書き込み
│   ├── build-static.mjs     # 静的サイトビルド
│   ├── dispatch-workflow.mjs
│   ├── sync-runtime-config.mjs
│   └── lib/
│       └── runtime-config.mjs # キーワード・除外パターンの共通管理
├── src/
│   └── styles/
│       └── tailwind.css     # TailwindCSS ソース
├── package.json
├── tailwind.config.cjs
├── AGENTS.md                # Codex CLI エントリーポイント（このファイル）
└── CLAUDE.md                # Claude Code 用行動指針
```

### 主要ディレクトリ

- `scripts/`: Node.js バッチスクリプト（ESM `.mjs`）。RSS フェッチ・翻訳・データ更新
- `public/`: 静的サイト本体。GitHub Pages で配信される
- `public/data/`: バッチ生成 JSON。GitHub Actions が自動更新（直接編集しない）
- `config/`: フィードソース・キーワード設定
- `src/styles/`: TailwindCSS ソースファイル
- `.github/workflows/`: CI/CD（1 時間ごとのバッチ実行 + GitHub Pages デプロイ）
