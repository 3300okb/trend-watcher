# git.md — Git ワークフロー

## ブランチ戦略

- `main`: 本番ブランチ。GitHub Pages のデプロイ元
- `dev/{YYYYMMDDHHMM}-{name}`: 開発ブランチ。`main` からチェックアウトして作業する
- レビューなしで `main` ブランチに直接プッシュしない

## コミットメッセージ規則

既存のコミット履歴に合わせた Conventional Commits スタイル：

- `chore(data): update trends [skip ci]` — 自動データ更新（GitHub Actions）
- `feat: ...` — 新機能
- `fix: ...` — バグ修正
- `chore: ...` — 雑務・設定変更
- `refactor: ...` — リファクタリング
- `docs: ...` — ドキュメント更新

## PR / MR のルール

- 開発ブランチから `main` への PR を作成する
- PR タイトルは 70 文字以内
- PR 本文には Summary（変更概要）と Test plan（テスト計画）を記載する

## CI/CD

- `.github/workflows/research-and-deploy.yml` が以下を自動実行：
  - 毎時 5 分（`cron: "5 * * * *"`）にバッチ実行
  - `main` への push 時にビルド + デプロイ（`public/data/**` の変更は除外）
  - データ変更があればボットが自動コミット（`[skip ci]` 付き）
