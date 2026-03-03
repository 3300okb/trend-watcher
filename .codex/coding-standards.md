# coding-standards.md — コーディング規約

## 命名規則
- JavaScript は `camelCase` を基本とし、定数は `UPPER_SNAKE_CASE` を使用する
- npm script 名は `verb:target` 形式（例: `sync:config`, `build:css`）を優先する
- 設定 JSON のキーは意味が明確な英語名を使う（例: `topics`, `excludePatterns`）

## ファイル・フォルダ構成のルール
- バッチ/CLI ロジックは `scripts/*.mjs` に配置する
- 共有ロジックは `scripts/lib/` に切り出す
- 配信物は `public/` に置き、`npm run build` で `out/` に出力する
- スタイル入力は `src/styles/tailwind.css`、生成物は `public/assets/tailwind.css` を維持する

## コメント・ドキュメントのルール
- コメントは「なぜそうするか（Why）」を書く。「何をするか（What）」はコードが語る
- README と設定ファイルの説明がずれる変更は、同一PRで README も更新する
- 外部APIや環境変数に依存する箇所は、入力条件と失敗時挙動を明示する

## 禁止事項
- `.env` ファイルをコミットしない
- `console.log` などのデバッグ出力を残したままコミットしない
- `public/data/*.json` を手動で壊す変更を行わない（JSON整形・生成経路を維持する）
- 例外を握りつぶす空の `catch` を追加しない
