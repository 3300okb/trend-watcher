# 環境設定

## キーワード設定

キーワード・除外パターンは `config/keywords.json` で管理する（git 管理対象）。

```json
{
  "topics": ["Anthropic", "OpenAI", ...],
  "excludePatterns": ["Mrs. GREEN APPLE", ...]
}
```

| フィールド | 説明 |
|-----------|------|
| `topics` | 収集・表示対象キーワード（JSON 配列） |
| `excludePatterns` | 除外するキーワードパターン（JSON 配列） |

### process.env による上書き
`process.env.TREND_TOPICS` / `process.env.TREND_EXCLUDE_PATTERNS` が設定されている場合はそちらが優先される（カンマ区切り文字列）。

### デフォルト値（keywords.json 読み込み失敗時）
`scripts/lib/runtime-config.mjs` に定義されたデフォルト値が使われる：
```javascript
DEFAULT_TOPICS = ['Apple']
DEFAULT_EXCLUDE_PATTERNS = ['Mrs. GREEN APPLE']
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

# 3. キーワードをカスタマイズする場合は config/keywords.json を編集
# （git 管理対象のため、変更は push すれば GitHub Actions に反映される）

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
| キーワード読み込み | `config/keywords.json` を直接読む | checkout 後の `config/keywords.json` を読む |
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
