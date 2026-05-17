# CLAUDE.md

## プロジェクト概要

**Trend Watcher** — 静的配信 + バッチ更新のトレンド集約アプリ。
GitHub Actions で RSS 収集・Google 翻訳・GitHub Pages デプロイを 1 時間ごとに実行する。

**技術スタック:**
- Node.js v20 (ESM / `.mjs`) — バッチスクリプト
- TailwindCSS v3 (CLI ビルド) — フロントエンドスタイル
- バニラ JavaScript — フロントエンドロジック
- GitHub Actions — CI/CD・定期バッチ
- GitHub Pages — 静的サイト配信
- Python3 — ローカル開発サーバー（`http.server`）

---

## エージェント構成

| エージェント   | 役割       | 主な起動条件                       |
| -------------- | ---------- | ---------------------------------- |
| **researcher** | 調査・解析 | 情報不足・原因不明・影響範囲の把握 |
| **planner**    | 設計・計画 | 実装方針の決定・ステップ分解       |
| **coder**      | 実装       | コードの作成・修正                 |
| **reviewer**   | レビュー   | 実装完了後の品質確認               |

標準フロー: researcher → planner → coder → reviewer
単純な 1 行修正は researcher/planner を省略可。

---

## クイックリファレンス

```bash
npm run dev          # ローカルサーバー http://localhost:8080
npm run job:fetch    # RSS 取得 + 翻訳 + JSON 更新
npm run build        # 静的サイトビルド（out/）
npm run build:css    # CSS のみビルド
npm run sync:config  # config/keywords.json → public/data/runtime-config.json
```

---

## スラッシュコマンド

- `/fetch` — トレンドデータ収集の動作確認（ローカル実行）
- `/build` — sync:config → build:css → build を順に実行

---

## 重要ファイル

| ファイル | 役割 |
|---------|------|
| `scripts/fetch-trends.mjs` | メインバッチ: RSS取得・翻訳・JSON 書き込み |
| `scripts/lib/runtime-config.mjs` | キーワード・除外パターンの共通管理 |
| `config/sources.json` | RSS フィードソース定義 |
| `config/keywords.json` | `TREND_TOPICS` / `TREND_EXCLUDE_PATTERNS` 設定 |
| `public/index.html` | フロントエンド HTML |
| `public/assets/app.js` | フロントエンド JS |
| `public/data/trends.json` | バッチ生成データ（GitHub Actions 管理） |
| `.github/workflows/research-and-deploy.yml` | CI/CD パイプライン |

---

## 詳細ドキュメント（必要時に読み込む）

- @.claude/docs/ARCHITECTURE.md
- @.claude/docs/CODING_STANDARDS.md
- @.claude/docs/COMMANDS.md
- @.claude/docs/TESTING.md
- @.claude/docs/GIT_WORKFLOW.md
- @.claude/docs/ENVIRONMENT.md

---

## 作業前チェックリスト

- [ ] 影響範囲を確認したか（researcher）
- [ ] `scripts/lib/runtime-config.mjs` の既存関数で対応できないか確認したか
- [ ] JSON 書き込みに atomic rename パターンを使っているか
- [ ] `npm run build` が通ることを確認したか

---

## 禁止事項

- `.env` をコミットしない
- `console.log` などのデバッグ出力を残してコミットしない
- `public/data/` 以下の JSON を直接 `writeFile` で書かない（atomic rename を使う）
- `out/` をコミットしない
- `require()` を使わない（ESM プロジェクト）
- レビューなしで `main` に直接プッシュしない

> 機械的な強制は `.claude/hooks/guard.sh` で実施。
