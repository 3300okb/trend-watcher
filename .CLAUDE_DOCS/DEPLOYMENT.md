# DEPLOYMENT.md — デプロイ手順・CI/CD 詳細

---

## GitHub Actions（標準）

### ワークフローファイル

`.github/workflows/research-and-deploy.yml`

### トリガー条件

| トリガー | 条件 |
|---|---|
| スケジュール | 毎時 05 分（UTC）: `cron: "5 * * * *"` |
| 手動 | `workflow_dispatch`（GitHub UI または `npm run dispatch:research`） |
| プッシュ | `main` ブランチへのプッシュ（`public/data/**` の変更は除外） |

`public/data/**` をトリガー除外しているのは、データ更新コミット自体が
再度ワークフローを起動するループを防ぐため。

### 実行ステップ

```
1. Checkout                   actions/checkout@v4
2. Load .env                  .env の非コメント行を GITHUB_ENV に追記
3. Setup Node.js              actions/setup-node@v4 (v20, npm cache 有効)
4. Install dependencies       npm ci
5. Run trend research         npm run job:fetch
6. Commit updated data        public/data/ に変更があれば自動コミット・プッシュ
7. Build static site          npm run build → out/ 生成
8. Setup Pages                actions/configure-pages@v5
9. Upload artifact            actions/upload-pages-artifact@v3 (./out をアップロード)
10. Deploy to GitHub Pages    actions/deploy-pages@v4
```

### 自動コミットの仕組み

```bash
# Step 6 のスクリプト
if [ -n "$(git status --porcelain public/data)" ]; then
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git add public/data
  git commit -m "chore(data): update trends [skip ci]"
  git push
fi
```

コミットメッセージに `[skip ci]` を付けることで、このコミットがワークフローを
再トリガーしないようにしている。

### 必要な権限（permissions）

```yaml
permissions:
  contents: write   # データコミット + プッシュ
  pages: write      # GitHub Pages デプロイ
  id-token: write   # OIDC トークン（Pages デプロイ用）
```

### 並行実行制御

```yaml
concurrency:
  group: "pages"
  cancel-in-progress: false
```

`cancel-in-progress: false` により、実行中のデプロイは中断されない。
新しいトリガーはキューに積まれ、前のジョブ完了後に実行される。

---

## 手動でワークフローをトリガーする

### GitHub UI から

1. GitHub リポジトリの Actions タブを開く
2. "Research And Deploy" ワークフローを選択
3. "Run workflow" ボタンをクリック

### CLI から

```bash
# GH_TOKEN に workflow スコープの PAT を設定して実行
GH_TOKEN=ghp_xxxx npm run dispatch:research
```

デフォルトで `3300okb/trend-watcher` の `research-and-deploy.yml` を `main` ブランチで起動する。
詳細は `.CLAUDE_DOCS/COMMANDS.md` の `dispatch:research` 節を参照。

---

## レンタルサーバー（代替構成）

Node.js 常駐不可・cron 実行可能な共有レンタルサーバーへの配置手順。

### 前提

- Node.js 実行可能（`/usr/bin/node`）
- SSH + cron アクセス可能
- 静的ファイル配信可能（Apache/Nginx）
- `.env` をドキュメントルート外に配置できる

### デプロイ手順

**1. ローカルビルド**
```bash
npm ci
npm run build
# out/ ディレクトリが生成される
```

**2. 静的ファイルをアップロード**
```bash
rsync -av ./out/ user@server:/home/user/public_html/
```

**3. バッチスクリプトをアップロード**
```bash
rsync -av ./scripts/ user@server:/home/user/trend-watcher/scripts/
rsync -av ./config/ user@server:/home/user/trend-watcher/config/
rsync -av ./.env user@server:/home/user/trend-watcher/.env
```

**4. サーバー側で npm install**
```bash
ssh user@server
cd /home/user/trend-watcher
npm ci
```

**5. cron 登録**
```bash
# 15 分ごとに実行する場合
*/15 * * * * cd /home/user/trend-watcher && /usr/bin/node scripts/fetch-trends.mjs >> /home/user/logs/trend-fetch.log 2>&1
```

**注意:** `fetch-trends.mjs` は `public/data/*.json` への相対パスを使用しているため、
データ出力先が `public/` ディレクトリ配下であることを確認すること。
静的サイトの `public/data/` とバッチの出力先が一致している必要がある。

### 障害対応

1. `/home/user/logs/trend-fetch.log` を確認する
2. エラーがあっても直近の正常な JSON は保持されているため、サイト表示は継続する
3. `fetch-logs.json` で失敗ソースを特定し、フィード URL の変更がないか確認する

---

## GitHub Pages の初期設定（リポジトリ新規作成時のみ）

1. GitHub リポジトリの Settings → Pages を開く
2. Source を "GitHub Actions" に変更する
3. ワークフローを初回手動実行する

一度設定すると以降は自動で更新される。

---

## トラブルシューティング

### ワークフローが失敗する

1. Actions タブでエラーログを確認
2. よくある原因:
   - `.env` が存在しない → `.env` をリポジトリにコミットされているか確認
   - GitHub Pages が未設定 → 上記の初期設定を実施
   - フィード URL が変更された → `fetch-logs.json` の `errorMessage` を確認

### データが更新されない

1. ワークフローが正常完了しているか確認（Actions タブ）
2. "Commit updated data" ステップで "No data changes" と表示されていないか確認
   - トピックにマッチする記事が取得できていない可能性がある
3. `fetch-logs.json` で各ソースの `status` を確認

### デプロイはされるが表示が古い

- ブラウザキャッシュをクリアして確認
- `trends.json` の `generatedAt` が最新であるか確認
