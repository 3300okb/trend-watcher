# コマンドリファレンス

## 開発サーバー
```bash
npm run dev
```
- `public/` を `http://localhost:8080` で配信（python3 の組み込みサーバー使用）
- CSS を事前ビルドしてから起動する
- 注意: `public/data/trends.json` などのデータは事前に `npm run job:fetch` で生成が必要

## CSS ビルド
```bash
npm run build:css
```
- `src/styles/tailwind.css` を読み込み、`public/assets/tailwind.css` に出力（minify）
- TailwindCSS CLI を使用

## 設定同期
```bash
npm run sync:config
```
- `config/keywords.json` の `topics` / `excludePatterns` を読み取り、`public/data/runtime-config.json` を生成
- フロントエンドが表示するキーワードリストの更新に使う

## トレンドデータ収集
```bash
npm run job:fetch
```
- `npm run sync:config` を実行してから RSS フィードを取得
- `config/sources.json` で定義されたソースから記事を収集
- トピックマッチングで絞り込み、Google 翻訳 API で日本語化
- 結果を `public/data/trends.json` / `public/data/latest.json` に atomic 書き込み
- 翻訳キャッシュを `public/data/translation-cache.json` に保存
- 実行ログを `public/data/fetch-logs.json` に追記（最大500件）
- 注意: 外部 API（Google ニュース RSS、翻訳 API）にリクエストが走る

## 静的サイトビルド
```bash
npm run build
```
- `npm run sync:config` + `npm run build:css` を実行してから `out/` ディレクトリへ静的ファイルをコピー
- GitHub Pages デプロイ用の `out/` を生成する
- `out/` は `.gitignore` に含まれているため、手動でコミットしない

## ワークフロー手動ディスパッチ
```bash
npm run dispatch:research
```
- GitHub Actions の `research-and-deploy` ワークフローを手動トリガー
- GitHub API を呼び出すため、`GITHUB_TOKEN` 環境変数が必要

## よく使う組み合わせ
```bash
# ローカルで最新データを取得して確認する
npm run job:fetch && npm run dev

# デプロイ前の最終確認
npm run build && ls -la out/
```
