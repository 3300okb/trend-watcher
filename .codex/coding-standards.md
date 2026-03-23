# coding-standards.md — コーディング規約

## 命名規則
- 変数・関数名は `camelCase`（例: `configuredTopics`, `resolveSourceFeedUrl`）
- 定数は `SCREAMING_SNAKE_CASE`（例: `REQUEST_TIMEOUT_MS`, `MAX_ITEMS_PER_SOURCE`）
- スクリプトファイル名は `kebab-case.mjs`（例: `fetch-trends.mjs`）

## ファイル・フォルダ構成のルール
- `scripts/`: バッチ・ビルド実行スクリプト（ESM）
- `scripts/lib/`: 共通ロジック（キーワード解決、URL生成など）
- `config/`: RSSソース・キーワード設定
- `src/styles/`: Tailwind の入力 CSS
- `public/`: 配信ファイル（`assets/` と `data/`）
- `out/`: `npm run build` で生成される成果物（直接編集しない）

## 品質ルール（必須）
- 型・インターフェースを明示する（型のある言語の場合）
- マジックナンバーは定数化する
- エラーハンドリングを省略しない
- JSON 出力更新は atomic rename（tmp 書き込み後 rename）を優先する

## コメント・ドキュメントのルール
- コメントは「なぜそうするか（Why）」を書く。「何をするか（What）」はコードが語る
- 自明な処理への説明コメントは避ける
- 例外系・回避策（タイムアウト、フォールバック）には意図を短く明記する

## セキュリティ
- API キーや認証情報をコードに直書きしない
- HTML を直接挿入する操作（innerHTML 相当）は XSS リスクに注意する
- ログにシークレット（トークン・鍵・個人情報）を出力しない

## 禁止事項
- `.env` ファイルをコミットしない
- `console.log` などのデバッグ出力を残したままコミットしない（運用ログは可）
- `require()` を使わない（このプロジェクトは ESM）
- `public/data/` の生成 JSON を手動編集しない
