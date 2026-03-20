# environment.md — 環境設定

## 必須環境変数

`.env` ファイルで管理（`.gitignore` 対象）。CI では GitHub Actions の環境変数として設定。

- RSS フェッチ・翻訳に必要な変数は `scripts/fetch-trends.mjs` を参照
- Supabase 関連の設定は `public/assets/supabase-config.js` で `window.SUPABASE_CONFIG` として公開

## ローカル開発環境のセットアップ

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd trend-watcher

# 2. Node.js v20 をインストール（nvm 推奨）
nvm install 20
nvm use 20

# 3. 依存パッケージをインストール
npm ci

# 4. 環境変数を設定（必要に応じて）
cp .env.example .env  # .env.example が存在する場合
# .env を編集して必要な値を設定

# 5. 開発サーバーを起動
npm run dev
# → http://localhost:8080 でアクセス
```

## ランタイム要件

- Node.js v20
- Python3（ローカル開発サーバー用）
- npm（パッケージ管理）

## ビルド出力

- `out/` — 静的サイトビルド出力（`.gitignore` 対象）
- `public/data/runtime-config.json` — ビルド時生成（`.gitignore` 対象）
