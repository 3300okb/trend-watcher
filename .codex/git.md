# git.md — Git ワークフロー

## ブランチ戦略
- **`main`**: 本番ブランチ。GitHub Pages デプロイの起点。直接コミットは避ける（GitHub Actions が自動コミットする `public/data/` の更新を除く）。
- **`dev/YYYYMMDDHHMM-<description>`**: 機能開発・修正用ブランチ（例: `dev/202602232354-setup-claude`）。

## コミットメッセージ規則
Conventional Commits スタイルを使う。

```
<type>(<scope>): <subject>
```

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `chore` | ビルド・設定・依存更新など |
| `refactor` | 動作変更なしのリファクタリング |
| `docs` | ドキュメントのみの変更 |
| `ci` | CI/CD 設定の変更 |

例:
```
feat(fetch): Google ニュース日本語フィードを追加
fix(translate): 翻訳キャッシュミス時のフォールバックを修正
chore(data): update trends [skip ci]   ← GitHub Actions の自動コミット
```

- `public/data/` の自動更新コミットには `[skip ci]` が付く（無限ループ防止・GitHub Actions が自動付与）。手動で付ける必要はない。

## PR / MR のルール
- `dev/*` → `main` への PR を作成してマージする。レビューなしで `main` に直接プッシュしない。
- PR 説明には変更の背景・テスト方法を記載する。
- `public/data/**` だけの変更は GitHub Actions の自動コミットのため PR 不要。

## 注意事項
- `.env` はコミットしない（`.gitignore` 対象）。シークレットは GitHub Secrets を使う。
- `out/` はコミットしない（`.gitignore` 対象、CI が生成）。
- `public/data/` 以下のデータファイルは GitHub Actions が管理する。手動で編集・コミットしない。
- キーワード設定（`config/keywords.json`）は git 管理対象。push すれば GitHub Actions に反映される。

> `.env` のステージング・`out/` の force-add は `.codex/hooks/guard.sh` が機械的にブロックする。
