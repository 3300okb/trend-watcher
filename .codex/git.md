# git.md — Git ワークフロー

## ブランチ戦略
- `main`: デプロイ基準ブランチ（GitHub Actions / GitHub Pages）
- 機能開発・修正は `dev/*` や `fix/*` などの作業ブランチで実施してから統合する
- `public/data/**` は CI が自動更新・自動コミットする運用

## コミットメッセージ規則
- 既存履歴に合わせて Conventional Commits 形式を推奨
- 例:
  - `feat(scope): ...`
  - `fix(scope): ...`
  - `chore(data): update trends [skip ci]`（CI 自動コミット）

## PR / MR のルール
- `dev/*` / `fix/*` から `main` への PR で統合する
- 変更内容・検証内容（ビルド/テスト/lint）を PR 説明に明記する
- `public/data/**` のみの自動更新コミットについては通常の機能 PR と分離して扱う
