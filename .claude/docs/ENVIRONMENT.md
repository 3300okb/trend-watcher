# 環境設定

## 必須環境変数

`.env` ファイルに以下を定義する（GitHub Actions は `Load .env` ステップで読み込む）。

| 変数名 | 必須 | 説明 | 例 |
|-------|------|------|---|
| `TREND_TOPICS` | 推奨 | 収集・表示対象キーワード（カンマ区切り） | `Anthropic,OpenAI,Google,claude` |
| `TREND_EXCLUDE_PATTERNS` | 任意 | 除外するキーワードパターン（カンマ区切り） | `Mrs. GREEN APPLE` |

### デフォルト値（.env 未設定時）
`scripts/lib/runtime-config.mjs` に定義されたデフォルト値が使われる：
```javascript
DEFAULT_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'claude', 'codex', 'gemini', 'frontend']
DEFAULT_EXCLUDE_PATTERNS = ['Mrs. GREEN APPLE']
```

### 現在の設定（.env）
```
TREND_TOPICS=Anthropic,OpenAI,Google,Apple,claude,codex,gemini,frontend,html,css,typescript,vue
TREND_EXCLUDE_PATTERNS=Mrs. GREEN APPLE
```

## ローカル開発環境のセットアップ

### 前提条件
- Node.js v20 以上
- Python3（ローカル開発サーバー用）
- npm

### セットアップ手順
```bash
# 1. リポジトリをクローン
git clone https://github.com/<owner>/trend-watcher.git
cd trend-watcher

# 2. 依存パッケージのインストール
npm ci

# 3. .env を編集（必要に応じてキーワードをカスタマイズ）
# .env はリポジトリ管理対象（GitHub Actions が直接読み込む）
# TREND_TOPICS=Anthropic,OpenAI,claude
# TREND_EXCLUDE_PATTERNS=Mrs. GREEN APPLE

# 4. 設定を同期（public/data/runtime-config.json を生成）
npm run sync:config

# 5. データを取得（初回は時間がかかる場合あり）
npm run job:fetch

# 6. 開発サーバーを起動
npm run dev
# → http://localhost:8080 で確認
```

## Docker / コンテナ
Dockerfile / docker-compose.yml は存在しない。コンテナ化は未対応。

## 環境ごとの差異

| | ローカル開発 | GitHub Actions (CI/CD) |
|---|---|---|
| `.env` 読み込み | `scripts/lib/runtime-config.mjs` が直接ファイルを読む | `Load .env` ステップで `GITHUB_ENV` に展開 |
| Node.js バージョン | ローカルインストール版 | v20（`setup-node@v4` で指定） |
| `runtime-config.json` | `npm run sync:config` で手動生成 | `npm run job:fetch` の冒頭で自動生成 |
| データ更新後の git push | 手動（または不要） | 自動コミット + push |
| デプロイ | なし（ローカル確認のみ） | GitHub Pages へ自動デプロイ |

## GitHub での初期設定
1. リポジトリを GitHub に push
2. `Settings > Pages > Build and deployment` を `GitHub Actions` に設定
3. `Actions` タブから `Research And Deploy` を手動実行して初回デプロイを確認

## cron での運用（セルフホスト）
GitHub Actions を使わずにサーバーで直接 cron 実行する場合：
```cron
0 * * * * cd /home/user/trend-watcher && /usr/bin/node scripts/sync-runtime-config.mjs && /usr/bin/node scripts/fetch-trends.mjs >> /home/user/logs/trend-fetch.log 2>&1
```
