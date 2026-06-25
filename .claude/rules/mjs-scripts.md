---
paths:
  - "scripts/**/*.mjs"
---

# バッチスクリプト（.mjs）ルール

`scripts/` 以下の `.mjs` を作成・編集するときに必ず守る制約。

- **ESM のみ**: `import` / `export` を使う。`require()` は使わない。パス解決は `import.meta.url`（`__dirname` は使わない）。
- **JSON 書き込みは atomic rename**: `public/data/` 以下を含む JSON 更新は、tmp ファイルに書いてから `rename` する（`atomicWriteJson` パターン）。ターゲットへ直接 `writeFile` しない。
- **設定読み込みは共通関数経由**: キーワード・除外パターンは `scripts/lib/runtime-config.mjs` の `getConfiguredTopics()` / `getConfiguredExcludePatterns()` を使う。`config/keywords.json` を各スクリプトで直接読まない。
- **非同期は async/await**: `.then()/.catch()` チェーンは避ける。エントリポイントは `main()` にまとめ、末尾で `main().catch(...)` を呼ぶ。
- **マジックナンバーは定数化**: `const REQUEST_TIMEOUT_MS = 20000;` のようにファイル上部で `SCREAMING_SNAKE_CASE` 定数にする。
- **エラーハンドリング**: ソース単位で `try/catch` し、1 ソースの失敗で全体を止めない。エラーはログ配列に記録し `fetch-logs.json` へ。機密情報（API キー・トークン）はログ・コンソールに出さない。

> 機械的な強制（直接書き込み・`.env` ステージング・`out/` add のブロック）は `.claude/hooks/guard.sh` が担当。
