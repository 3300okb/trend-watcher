# テスト方針

## テストフレームワーク
現時点でテストフレームワークは導入されていない。
`package.json` に `test` スクリプトも定義されていない。

## テストファイルの配置
テストファイルは存在しない（`__tests__/` / `spec/` / `tests/` ディレクトリなし）。

## 現在の品質確認方法
自動テストの代わりに、以下の手動確認で品質を担保している。

### バッチ動作確認
```bash
# 実際にフェッチ・翻訳・JSON書き込みを実行して確認
npm run job:fetch

# ログを確認
cat public/data/fetch-logs.json | node -e "
  const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(d.slice(-5));
"
```

### ビルド動作確認
```bash
# 静的ビルドが正常に完了するか確認
npm run build
ls -la out/
```

### フロントエンド動作確認
```bash
# ローカルサーバーで画面を確認
npm run dev
# → http://localhost:8080 でブラウザ確認
```

## テスト導入時の推奨方針
将来テストを導入する場合の指針：

### 推奨フレームワーク
- **Node.js 組み込みテストランナー**（`node:test`）: 追加依存なしで使える
- または **Vitest**: ESM 対応、高速

### テストすべき優先箇所
1. `scripts/lib/runtime-config.mjs` の `parseEnvText`, `normalizeTopics` などのピュア関数
2. `scripts/fetch-trends.mjs` の `decodeXml`, `normalizeUrl`, `matchTopics`, `shouldExcludeArticle` などのピュア関数
3. `scripts/fetch-trends.mjs` の `parseRssItems`, `parseAtomEntries` の XML パーサー

### テストファイルの配置方針（導入時）
```
scripts/
  __tests__/
    runtime-config.test.mjs
    fetch-trends.test.mjs
```

## カバレッジ基準
（テスト未整備のため未定義。導入時に設定する）

## テストを書く際の注意点（導入時向け）
- 外部 API（Google ニュース RSS, Google 翻訳）は必ずモックにする
- ファイルシステムへの書き込みは一時ディレクトリを使うかモックにする
- `process.env` の上書きは各テスト後にリストアする
- ESM のため、Jest ではなく `node:test` か Vitest を推奨
