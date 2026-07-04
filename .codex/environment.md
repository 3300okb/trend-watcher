# environment.md — 環境設定

## 前提条件
- Node.js v20 以上 / Python3（ローカル開発サーバー用）/ npm

## ローカル開発環境のセットアップ
```bash
npm ci                # 依存インストール
npm run sync:config   # config/keywords.json → public/data/runtime-config.json 生成
npm run job:fetch     # データ取得（外部 API を叩く。初回は時間がかかる場合あり）
npm run dev           # http://localhost:8080 で確認
```

## キーワード設定
キーワード・除外パターンは `config/keywords.json`（git 管理対象）で管理する。

```json
{ "topics": ["Anthropic", "OpenAI"], "excludePatterns": ["Mrs. GREEN APPLE"] }
```

| フィールド | 説明 |
|-----------|------|
| `topics` | 収集・表示対象キーワード（JSON 配列） |
| `excludePatterns` | 除外するキーワードパターン（JSON 配列） |

- `process.env.TREND_TOPICS` / `process.env.TREND_EXCLUDE_PATTERNS`（カンマ区切り）が設定されていればそちらが優先される。
- 読み込み失敗時のデフォルトは `scripts/lib/runtime-config.mjs`（`DEFAULT_TOPICS = ['Apple']` / `DEFAULT_EXCLUDE_PATTERNS = ['Mrs. GREEN APPLE']`）。

## 必須環境変数
- `.env` は現状 `.gitignore` 対象（将来のシークレット管理用）。必須の環境変数は現時点でなし。
- `npm run dispatch:research`（GitHub Actions 手動ディスパッチ）を使う場合のみ `GITHUB_TOKEN` が必要。

## Supabase 設定
| 項目 | 値 |
|------|-----|
| プロジェクト ID | `kiaqxehlkhrdcwfxradi` |
| リージョン | `ap-northeast-1`（東京） |
| URL | `https://kiaqxehlkhrdcwfxradi.supabase.co` |

- テーブル `saved_articles`（`id` / `user_id` / `url` / `item_data` jsonb / `saved_at`）。UNIQUE 制約 `(user_id, url)`。RLS 有効（ユーザーは自分のレコードのみ操作可）。
- 認証: Google OAuth（Supabase Auth 経由）。設定は `public/assets/supabase-config.js`（`window.SUPABASE_CONFIG` に公開）。anon key はフロントエンド公開用で RLS により保護。

## 環境ごとの差異
| | ローカル開発 | GitHub Actions (CI/CD) |
|---|---|---|
| `runtime-config.json` | `npm run sync:config` で手動生成 | `npm run job:fetch` の冒頭で自動生成 |
| データ更新後の git push | 手動（または不要） | 自動コミット + push |
| デプロイ | なし（ローカル確認のみ） | GitHub Pages へ自動デプロイ |

## Docker / コンテナ
- Dockerfile / docker-compose.yml は存在しない。コンテナ化は未対応。
