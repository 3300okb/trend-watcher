# AGENTS.md

このファイルは Codex CLI がこのリポジトリで作業する際のエントリーポイントです。
詳細は `.codex/` / `.agents/` 配下の個別ファイルに委譲しています。**必要なときだけ読み込んでください。**

## プロジェクト概要

**Trend Watcher** — 静的配信 + バッチ更新のトレンド集約アプリ。
GitHub Actions で RSS 収集・Google 翻訳・GitHub Pages デプロイを 3 時間ごとに自動実行する。

技術スタック:
- Node.js v20（ESM / `.mjs`）— バッチスクリプト
- TailwindCSS v3（CLI ビルド）— フロントエンドスタイル
- バニラ JavaScript — フロントエンドロジック（フレームワークなし）
- GitHub Actions — CI/CD・定期バッチ
- GitHub Pages — 静的サイト配信
- Python3 — ローカル開発サーバー（`http.server`）
- Supabase — 認証（Google OAuth）・saved 記事の永続化

---

## ドキュメント参照

タスクに応じて以下を参照する。**必要なときだけ読み込むこと**：

| ファイル | 読むタイミング |
| --- | --- |
| `.codex/project-baseline.md` | 共通品質・セキュリティ基準を確認するとき |
| `.codex/workflow.md` | 作業開始時・タスクの進め方・報告フォーマットを確認するとき |
| `.codex/coding-standards.md` | コードを書く・修正する前 |
| `.codex/testing.md` | テスト・品質チェックを行うとき |
| `.codex/git.md` | コミット・ブランチ操作を行う前 |
| `.codex/environment.md` | 環境セットアップ・キーワード設定・Supabase を扱うとき |

ディレクトリ固有の規約は各ディレクトリの `AGENTS.md`（`scripts/AGENTS.md` / `public/AGENTS.md`）に置いてある。
Codex はルートから作業ディレクトリまでのパス上の AGENTS.md を自動で読み込む。

---

## クイックリファレンス

よく使うコマンド（詳細は `.codex/workflow.md` / `.codex/testing.md`）：

```bash
npm run dev          # ローカルサーバー http://localhost:8080（CSS ビルド後に起動）
npm run build        # 静的サイトビルド（sync:config + build:css + out/ 生成）
npm run build:css    # Tailwind を public/assets/tailwind.css へ minify 出力
npm run sync:config  # config/keywords.json → public/data/runtime-config.json
npm run job:fetch    # RSS 取得 + 翻訳 + JSON 更新（外部 API を叩く・手動実行のみ）
```

---

## ディレクトリ構成

```
trend-watcher/
├── .github/workflows/research-and-deploy.yml  # CI/CD（3時間ごと + push トリガー）
├── config/
│   ├── keywords.json      # TREND_TOPICS / TREND_EXCLUDE_PATTERNS
│   └── sources.json       # RSS フィードソース定義
├── scripts/               # バッチスクリプト（ESM / .mjs）※scripts/AGENTS.md 参照
│   ├── fetch-trends.mjs        # メインバッチ: RSS取得→翻訳→JSON出力
│   ├── build-static.mjs        # public/ → out/ コピー
│   ├── sync-runtime-config.mjs # keywords.json → runtime-config.json
│   ├── dispatch-workflow.mjs   # GitHub Actions 手動ディスパッチ
│   └── lib/runtime-config.mjs  # キーワード・除外パターンの共通ロジック
├── src/styles/tailwind.css     # Tailwind ソース（ビルド入力）
├── public/                # 静的配信ルート（git 管理）※public/AGENTS.md 参照
│   ├── index.html
│   ├── assets/            # app.js / supabase-config.js / tailwind.css(生成物) / fonts
│   └── data/              # バッチ生成データ（GitHub Actions が自動コミット）
├── out/                   # 静的ビルド出力（.gitignore・コミット禁止）
├── package.json
└── tailwind.config.cjs
```

### 主要ディレクトリ
- `scripts/`: バッチスクリプト（エントリポイント）。`scripts/lib/` は共通関数。
- `config/`: 静的設定 JSON（キーワード・RSS ソース）。
- `public/`: 静的配信ファイル（git 管理）。`public/data/` はバッチ生成データ。
- `out/`: ビルド出力（コミットしない）。

---

## 制御手段の所在

- 手続き（ビルド・収集・レビュー）: `.agents/skills/`
- コマンド単位の許可 / 禁止: `.codex/rules/project.rules`
- 機械的な強制（危険コマンドのブロック）: `.codex/config.toml` の hooks + `.codex/hooks/guard.sh`
- サブエージェント: `.codex/agents/`
- ディレクトリ限定の規約: `scripts/AGENTS.md` / `public/AGENTS.md`

## 禁止事項

- `.env` をコミット・ステージングしない
- `console.log` などのデバッグ出力を残してコミットしない
- `public/data/` 以下の JSON をシェルから直接書かない（コード内で atomic rename を使う）
- `out/` をコミット・force-add しない
- `require()` を使わない（ESM プロジェクト）
- レビューなしで `main` に直接プッシュしない

> 散文の禁止は確率的にしか守られないため、一覧はここに残しつつ、
> 強制そのものは rules（`.codex/rules/`）と hooks（`.codex/hooks/guard.sh`）で決定論的に行う。
