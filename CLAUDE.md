# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業するときの**最初の読み物**です。
詳細は必要になったときに .CLAUDE_DOCS/ の各ファイルを参照してください。

---

## プロジェクト概要

**Trend Watcher** — RSS/Atom フィードから技術トレンドを収集・日本語翻訳して
GitHub Pages で静的配信するバッチ駆動の Web アプリ。

- フロントエンド: HTML + Vanilla JS (ES Modules) + Tailwind CSS
- バッチ処理: Node.js 20 (依存ゼロ、Node 組み込み API のみ)
- デプロイ: GitHub Actions → GitHub Pages（毎時 05 分自動更新）
- 代替環境: レンタルサーバー + cron

---

## ドキュメント配置

詳細調査が必要になった際に、該当ファイルだけを開いてください。
**全ファイルを一括で読まないこと。**

| ファイル | 用途 |
|---|---|
| `.CLAUDE_DOCS/COMMANDS.md` | `package.json` の全 `npm run` コマンドの実行内容・入出力・注意点・典型的な作業フロー |
| `.CLAUDE_DOCS/ARCHITECTURE.md` | ディレクトリ構成・技術スタック・フロントエンド起動フロー・Tailwind 設定・設計方針（静的優先/依存ゼロ/アトミック書き込み） |
| `.CLAUDE_DOCS/DATA_FLOW.md` | `fetch-trends.mjs` の処理フロー全体図・25 RSS ソース定義・フィルタ/重複排除/翻訳の実装詳細・出力 JSON スキーマ |
| `.CLAUDE_DOCS/CODING_RULES.md` | 禁止事項（`innerHTML` 直接代入/データファイル手書き/ハードコード設定）・アトミック書き込みの維持・動作検証の手順・よくある落とし穴 |
| `.CLAUDE_DOCS/DEPLOYMENT.md` | GitHub Actions ワークフロー（トリガー/ステップ/自動コミット仕組み）・手動トリガー手順・レンタルサーバー代替構成・トラブルシューティング |

---

## クイックスタート

```bash
# 依存インストール
npm ci

# ローカル開発（データ更新 → CSS ビルド → 確認サーバー起動）
npm run sync:config   # .env → public/data/runtime-config.json
npm run job:fetch     # RSS 取得 → 翻訳 → JSON 生成
npm run build:css     # Tailwind コンパイル
npm run dev           # http://localhost:8080
```

コマンドの詳細 → `.CLAUDE_DOCS/COMMANDS.md`

---

## 重要ルール（必読）

1. **データファイルは自動生成物** — `public/data/*.json` を手書き編集しない
2. **アトミック書き込みを壊さない** — `fetch-trends.mjs` の `.tmp` ファイル → `rename()` パターンを維持
3. **不要なリファクタリングをしない** — 依頼外のコードを変更しない
4. **テストは目視確認** — `public/data/*.json` の差分と画面表示で検証

詳細 → `.CLAUDE_DOCS/CODING_RULES.md`

---

## タスク別の参照先

| やりたいこと | 読むべきファイル |
|---|---|
| コマンドを実行したい | `.CLAUDE_DOCS/COMMANDS.md` |
| データフローを把握したい | `.CLAUDE_DOCS/DATA_FLOW.md` |
| RSS ソースを追加・変更したい | `.CLAUDE_DOCS/DATA_FLOW.md` → `config/sources.json` |
| フロントエンドを変更したい | `.CLAUDE_DOCS/ARCHITECTURE.md` |
| GitHub Actions を変更したい | `.CLAUDE_DOCS/DEPLOYMENT.md` |
| コーディング規約を確認したい | `.CLAUDE_DOCS/CODING_RULES.md` |
