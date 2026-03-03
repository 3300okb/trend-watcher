# git.md — Git ワークフロー

## ブランチ戦略
- デフォルトブランチは `main`
- GitHub Actions は `main` への push をトリガーに実行される
- `public/data/**` のみの変更は CI の push トリガー対象外（`paths-ignore`）

## コミットメッセージ規則
- 既存履歴では `chore(data): ...` 形式が多く使われている
- データ自動更新コミットは `chore(data): update trends [skip ci]` を使用
- 機能・修正コミットは Conventional Commits 準拠（`feat:`, `fix:`, `refactor:` など）を推奨

## PR / MR のルール
- 未確認 - 要記入（テンプレート・必須レビュールールはリポジトリ内で未検出）
