# testing.md — テスト・品質チェック

## テストフレームワーク
- **未導入**。`package.json` に `test` スクリプトはない。テストファイル（`__tests__/` / `spec/` / `tests/`）も存在しない。

## Lint / フォーマット
- **未導入**（ESLint / Prettier ともに devDependencies になし、対応スクリプトもなし）。

## 現在の品質確認方法（自動テストの代替）

### ビルド動作確認
```bash
npm run build
ls -la out/   # out/index.html と out/assets/tailwind.css を確認
```

### バッチ動作確認（外部 API を叩く・手動のみ）
```bash
npm run job:fetch
# 実行後、public/data/fetch-logs.json の末尾数件でエラーを確認
```

### フロントエンド動作確認
```bash
npm run dev   # → http://localhost:8080 でブラウザ確認
```

## 未導入項目の扱い
- lint・テストは未導入。報告時は「未導入」と明記し、代替として `npm run build`（必要に応じて `npm run job:fetch`）を実行する。

## テストを書く際の注意点（将来導入時向け）
- ESM のため Jest ではなく `node:test`（追加依存なし）か Vitest を推奨。
- テストすべき優先箇所: `scripts/lib/runtime-config.mjs` のピュア関数、`scripts/fetch-trends.mjs` の `normalizeUrl` / `matchTopics` / `shouldExcludeArticle` / XML パーサー。
- 外部 API（Google ニュース RSS・Google 翻訳）は必ずモックにする。
- ファイル書き込みは一時ディレクトリを使うかモックにする。`process.env` の上書きは各テスト後にリストアする。
- 配置方針（導入時）: `scripts/__tests__/*.test.mjs`。
