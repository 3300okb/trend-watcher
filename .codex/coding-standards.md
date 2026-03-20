# coding-standards.md — コーディング規約

## モジュールシステム

- ESM（ES Modules）を使用する。`require()` は使わない
- スクリプトファイルの拡張子は `.mjs`
- `package.json` に `"type": "module"` が設定済み
- フロントエンド JS は `type="module"` で読み込まれる

## 命名規則

- ファイル名: ケバブケース（`fetch-trends.mjs`, `runtime-config.mjs`）
- 変数・関数: キャメルケース（`fetchTrends`, `runtimeConfig`）
- 定数: アッパースネークケース（`TREND_TOPICS`, `TREND_EXCLUDE_PATTERNS`）
- CSS カスタムカラー: 短い英単語（`ink`, `paper`, `mist`, `brand`, `accent`）

## ファイル・フォルダ構成のルール

- バッチスクリプトは `scripts/` に配置（`.mjs` 拡張子）
- 共通ライブラリは `scripts/lib/` に配置
- フロントエンドファイルは `public/` 以下に配置
- 設定ファイルは `config/` に配置（JSON 形式）
- TailwindCSS ソースは `src/styles/` に配置

## JSON 書き込みルール

- `public/data/` 以下の JSON を直接 `writeFile` で書き込まない
- atomic rename パターンを使う（一時ファイルに書き込み → `rename` で上書き）

## コメント・ドキュメントのルール

- コメントは「なぜそうするか（Why）」を書く。「何をするか（What）」はコードが語る
- JSDoc は必要に応じて関数の引数・戻り値に記載する

## フロントエンドの注意点

- `app.js` は `type="module"` のため、変数はグローバルスコープに漏れない
- Supabase 設定は `window.SUPABASE_CONFIG` パターンで共有（通常スクリプトで先に読み込み）
- localStorage キー: `trend-watcher-saved`

## 禁止事項

- `.env` ファイルをコミットしない
- `console.log` などのデバッグ出力を残したままコミットしない
- `out/` ディレクトリをコミットしない（`.gitignore` 対象）
- `require()` を使わない（ESM プロジェクト）
- `public/data/` の JSON を直接 `writeFile` しない（atomic rename を使う）
- API キーや認証情報をコードに直書きしない
- `innerHTML` による HTML 直接挿入は XSS リスクに注意する
