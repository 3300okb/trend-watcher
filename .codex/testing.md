# testing.md — テスト・品質チェック

## テストフレームワーク
- 未確認 - 要記入（`package.json` に test スクリプト定義なし）

## テストファイルの配置
- 未確認 - 要記入（`__tests__/`, `tests/`, `*.spec.*`, `*.test.*` は現状未検出）

## テストの実行方法
```bash
npm test
# 現状は script 未定義のため、導入時に更新すること
```

## Lint / フォーマット
```bash
npm run lint
# 現状は script 未定義のため、導入時に更新すること
```

## 既存の品質チェックコマンド
```bash
npm run build
npm run build:css
```

## テストを書く際の注意点
- 実装変更時は対応するテストも必ず追加・修正する
- `scripts/fetch-trends.mjs` など副作用のある処理は、外部依存をモック可能な構造に分離してからテストする
- データ更新ロジックはフォーマット（JSON構造・必須キー）を壊さないアサーションを持たせる
