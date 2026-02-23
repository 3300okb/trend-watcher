# Git ワークフロー

## ブランチ戦略
- **`main`**: 本番ブランチ。GitHub Pages へのデプロイはここを起点にする
- **`dev/YYYYMMDDHHMI-<description>`**: 機能開発・修正用ブランチ（例: `dev/202602232354-setup-claude`）
- 直接 `main` へのコミットは避ける（GitHub Actions が自動コミットする `public/data/` の更新を除く）

## コミットメッセージ規則
Conventional Commits スタイルを使用する。

```
<type>(<scope>): <subject>

[body]
```

### type
| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `chore` | ビルド・設定・依存更新など |
| `refactor` | 動作変更なしのリファクタリング |
| `docs` | ドキュメントのみの変更 |
| `ci` | CI/CD 設定の変更 |

### 実際のコミット例
```
feat(fetch): Google ニュース日本語フィードを追加
fix(translate): 翻訳キャッシュミス時のフォールバックを修正
chore(data): update trends [skip ci]   ← GitHub Actions 自動コミット
ci(workflow): スケジュール実行を毎時05分に変更
```

### `[skip ci]` フラグ
`public/data/` の自動更新コミットには `[skip ci]` を付けて CI を抑制する（無限ループ防止）。
これは GitHub Actions が自動付与する（手動で付ける必要はない）。

## PR / MR のルール
- `dev/*` → `main` への PR を作成して マージする
- PR 説明には変更の背景・テスト方法を記載する
- `public/data/**` だけの変更は GitHub Actions の自動コミットのため PR 不要

## CI/CD パイプライン
### ワークフロー: `research-and-deploy`
ファイル: `.github/workflows/research-and-deploy.yml`

**トリガー:**
1. **schedule**: 毎時05分（UTC）= 日本時間 毎時14分
2. **workflow_dispatch**: 手動実行
3. **push to main**: `public/data/**` の変更を除く push

**実行ステップ:**
```
1. Checkout
2. Load .env（GITHUB_ENV に変数を展開）
3. Setup Node.js v20（npm キャッシュ有効）
4. npm ci
5. npm run job:fetch（RSS 取得・翻訳・JSON 更新）
6. git add public/data + git commit（変更ありの場合のみ）+ git push
7. npm run build（out/ 生成）
8. GitHub Pages へデプロイ（actions/deploy-pages）
```

**権限:**
- `contents: write`: 自動コミット用
- `pages: write`: GitHub Pages デプロイ用
- `id-token: write`: OIDC 認証用

**concurrency:**
- グループ: `pages`（同時実行防止）
- `cancel-in-progress: false`（進行中のデプロイを中断しない）

## .gitignore で除外されているもの
```
node_modules/    # npm パッケージ
out/             # 静的ビルド出力（CI が生成）
.DS_Store        # macOS メタデータ
public/data/runtime-config.json  # .env から生成されるため
```

## 注意事項
- `.env` は**リポジトリにコミットする**。GitHub Actions の `Load .env` ステップがリポジトリ内の `.env` を直接読み込むため、push が必要
- `.env` には API キー等の機密情報は含まれない（キーワードリストのみ）。機密情報を追加する場合は GitHub Secrets を使うこと
- `public/data/` 以下のデータファイル（trends.json 等）は GitHub Actions が管理するため、手動で編集・コミットしない
