# CLAUDE.md

このファイルは Claude（AI）がこのリポジトリで作業する際の行動指針です。

## プロジェクト概要

**Trend Watcher** - 静的配信 + バッチ更新のトレンド集約アプリ。

GitHub Actions で RSS フィード収集・Google 翻訳・GitHub Pages デプロイを 1 時間ごとに自動実行する。
キーワードにマッチしたテクノロジー系ニュースを日本語化して静的サイトで表示する。

**技術スタック:**
- Node.js v20 (ESM / `.mjs`) — バッチスクリプト
- TailwindCSS v3 (CLI ビルド) — フロントエンドスタイル
- バニラ JavaScript — フロントエンドロジック
- GitHub Actions — CI/CD・定期バッチ実行
- GitHub Pages — 静的サイト配信
- Python3 — ローカル開発サーバー（`http.server`）

---

## エージェント構成

このリポジトリには `.claude/agents/` に4つのサブエージェントが定義されています。
タスクの性質に応じて自律的に適切なエージェントを選択・連携させてください。

| エージェント | 役割 | 主な起動条件 |
|------------|------|------------|
| **researcher** | 調査・解析 | 情報不足・原因不明・影響範囲の把握 |
| **planner** | 設計・計画 | 実装方針の決定・ステップ分解 |
| **coder** | 実装 | コードの作成・修正・テスト |
| **reviewer** | レビュー | 実装完了後の品質確認 |

### 標準フロー
```
タスク受信
  → researcher（調査）
  → planner（計画）
  → coder（実装）
  → reviewer（レビュー）
  → 完了 or 差し戻し → coder（修正）
```

シンプルなタスク（明確な1行修正など）は researcher/planner を省略して coder から開始してよい。

---

## クイックリファレンス

よく使うコマンド（詳細は `.claude/docs/COMMANDS.md` を参照）：

```bash
# ローカル開発サーバー起動（http://localhost:8080）
npm run dev

# トレンドデータ収集（RSS フェッチ + 翻訳 + JSON 更新）
npm run job:fetch

# 静的サイトビルド（out/ に出力）
npm run build

# CSS のみビルド
npm run build:css

# .env → public/data/runtime-config.json 同期
npm run sync:config
```

---

## 重要なファイルと役割

| ファイル | 役割 |
|---------|------|
| `scripts/fetch-trends.mjs` | メインバッチ: RSS取得・翻訳・JSON 書き込み |
| `scripts/lib/runtime-config.mjs` | キーワード・除外パターンの共通管理 |
| `config/sources.json` | RSS フィードソース定義 |
| `.env` | `TREND_TOPICS` / `TREND_EXCLUDE_PATTERNS` 設定 |
| `public/index.html` | フロントエンド HTML |
| `public/assets/app.js` | フロントエンド JS（フィルタリング・レンダリング） |
| `public/data/trends.json` | バッチ生成のメインデータ（GitHub Actions が管理） |
| `.github/workflows/research-and-deploy.yml` | CI/CD パイプライン |

---

## 作業前チェックリスト
- [ ] タスクの要件を正確に把握したか
- [ ] 影響範囲を確認したか（researcher）
- [ ] 実装方針を決めたか（planner）
- [ ] `scripts/lib/runtime-config.mjs` の既存関数で対応できないか確認したか
- [ ] JSON 書き込みに atomic rename パターンを使っているか
- [ ] `npm run build` が通ることを確認したか（テスト・Lint は今後整備予定）

---

## 禁止事項
- `console.log` などのデバッグ出力を残したままコミットしない
- `public/data/` 以下の JSON を直接 `writeFile` で書き込まない（atomic rename パターンを使う）
- `out/` ディレクトリをコミットしない（`.gitignore` 対象）
- `require()` を使わない（ESM プロジェクト）
- レビューなしで `main` ブランチに直接プッシュしない

> テスト・Lint は今後導入予定。詳細は `.claude/docs/TESTING.md` を参照。

---

## ドキュメント配置

| ファイル | 用途 |
|---------|------|
| `CLAUDE.md` | Claude の行動指針・全体概要（このファイル） |
| `.claude/agents/researcher.md` | 調査・解析エージェントの定義と行動原則 |
| `.claude/agents/planner.md` | プランニングエージェントの定義と行動原則 |
| `.claude/agents/coder.md` | コーディングエージェントの定義と行動原則 |
| `.claude/agents/reviewer.md` | レビューエージェントの定義と行動原則 |
| `.claude/docs/COMMANDS.md` | ビルド・テスト・開発サーバーなど実コマンド一覧 |
| `.claude/docs/ARCHITECTURE.md` | ディレクトリ構成・モジュール・データフロー |
| `.claude/docs/CODING_STANDARDS.md` | 命名規則・コードスタイル・禁止事項 |
| `.claude/docs/TESTING.md` | テスト方針・フレームワーク・実行方法 |
| `.claude/docs/GIT_WORKFLOW.md` | ブランチ戦略・コミット規則・CI/CD |
| `.claude/docs/ENVIRONMENT.md` | 環境変数・ローカルセットアップ・Docker |
