# AGENTS.md

このファイルは、Codex が `trend-watcher` で作業するときのリポジトリ固有ハーネスです。
グローバルの `~/.codex/AGENTS.md` を前提に、このリポジトリで守る文脈、変更境界、検証条件を定義します。

## プロジェクト概要

Trend Watcher は、RSS フィードから技術系トレンド記事を収集し、日本語翻訳・重複除去を行って `public/data/*.json` を更新する静的配信アプリです。
収集とデプロイは GitHub Actions（毎時 05 分 UTC）で自動実行され、`out/` を GitHub Pages に配信します。

技術スタック: Node.js (ESM), JavaScript, Tailwind CSS (CLI), Vanilla JS, GitHub Actions, GitHub Pages, Supabase Auth/DB

## 作業開始ハーネス

- 変更前に、対象が収集、正規化、保存、UI、認証、デプロイのどれかを切り分ける
- 外部 API、RSS、GitHub Actions、Supabase に触れる変更は、失敗時の挙動と秘密情報の扱いを先に確認する
- `public/data/` と `out/` は生成物を含むため、手動編集の必要性を明確にする
- RSS 取得や翻訳の実行はネットワーク・API 制限・キャッシュ影響を考慮する
- 既存の自動実行スケジュールを壊さないことを優先する

## ドキュメント参照

必要なときだけ読み込むこと。常に全部読む必要はありません。

| ファイル | 読むタイミング |
| --- | --- |
| `.codex/project-baseline.md` | 品質・セキュリティ基準を確認するとき |
| `.codex/workflow.md` | 作業手順や報告形式を確認するとき |
| `.codex/coding-standards.md` | Node.js/フロントエンドを修正する前 |
| `.codex/testing.md` | テスト・検証方針を決めるとき |
| `.codex/git.md` | ブランチ・コミット・PR を扱うとき |
| `.codex/environment.md` | 環境変数・認証情報・外部 API を扱うとき |
| `.codex/agents/*.toml` | サブエージェント設定を変更・追加するとき |

## 主要コマンド

```bash
npm run sync:config
npm run job:fetch
npm run build
npm run dev
npm run dispatch:research
```

## 変更境界

- RSS ソースやキーワードは `config/` を中心に変更する
- バッチ処理は `scripts/` と `scripts/lib/` を中心に変更する
- 静的 UI は `public/` と `src/styles/` を中心に変更する
- `public/assets/tailwind.css` は生成物として扱い、直接編集しない
- `public/data/*.json` はバッチ生成データとして扱い、手動編集を避ける
- `out/` は GitHub Pages 向けのビルド成果物として扱う
- Supabase 設定や API キーは環境変数または公開可能な設定のみを扱い、秘密情報をコミットしない

## パイプラインハーネス

データ処理は以下の責務に分けて考える。

1. 収集: RSS や外部ソースから記事候補を取得する
2. 正規化: タイトル、URL、日付、本文、出典を揃える
3. 重複除去: 同一 URL、同一記事、既存データとの重複を除く
4. 翻訳・補助処理: キャッシュと失敗時の扱いを確認する
5. 保存: `public/data/` の JSON を壊さず更新する
6. 配信: `out/` を生成し GitHub Pages に載せる

各責務を混ぜず、変更箇所を最小限にする。

## 検証ハーネス

変更内容に応じて、以下を実行して完了を判断します。

```bash
npm run build
```

追加条件:

- 設定変更の場合: `npm run sync:config`
- 収集処理変更の場合: mock、dry-run、または限定データで `npm run job:fetch` 相当の経路を確認
- UI/CSS 変更の場合: `npm run build` 後に表示を確認
- GitHub Actions 変更の場合: workflow のトリガー、権限、生成物の流れを確認
- Supabase 連携変更の場合: 公開可能な設定と秘密情報の境界を確認

## 完了条件

- 変更意図と差分が一致している
- `npm run build` が成功している
- 収集・保存・配信の最小経路を壊していない
- 生成物に差分が出た場合、その必要性を説明できる
- 外部 API を実行しない場合は、代替検証の内容を報告する
- 秘密情報やローカル環境依存ファイルを含めていない

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

## 主要ディレクトリ

- `config/`: キーワード・除外語・RSS ソース定義
- `scripts/`: バッチ処理とビルド処理（Node.js ESM）
- `scripts/lib/`: バッチ共通ロジック
- `src/styles/`: Tailwind のソース CSS
- `public/`: 静的配信ルート（HTML/JS/生成データ）
- `out/`: 静的ビルド成果物（GitHub Pages デプロイ対象、生成物）
