# scripts/ ディレクトリ固有の指示

ルート `AGENTS.md` に加え、`scripts/**/*.mjs` を作成・編集するときは以下を必ず守る。
詳細な規約は `.codex/coding-standards.md` を参照。

## ディレクトリ構成
- `scripts/*.mjs`: バッチのエントリポイント（`fetch-trends.mjs` / `build-static.mjs` / `sync-runtime-config.mjs` / `dispatch-workflow.mjs`）。
- `scripts/lib/runtime-config.mjs`: 複数スクリプトから使う共通関数（キーワード・除外パターン読み込み、Google News URL 生成）。

## 固有の規則
- **ESM のみ**: `import` / `export` を使う。`require()` は使わない。パス解決は `import.meta.url`（`__dirname` は使わない）。
- **JSON 書き込みは atomic rename**: `public/data/` 以下を含む JSON 更新は tmp に書いてから `rename` する（`atomicWriteJson`）。ターゲットへ直接 `writeFile` しない。
- **設定読み込みは共通関数経由**: キーワード・除外パターンは `runtime-config.mjs` の `getConfiguredTopics()` / `getConfiguredExcludePatterns()` を使う。`config/keywords.json` を各スクリプトで直接読まない。
- **非同期は async/await**: `.then()/.catch()` チェーンは避ける。エントリポイントは `main()` にまとめ、末尾で `main().catch(...)` を呼ぶ。バッチは常駐しない設計を維持する。
- **マジックナンバーは定数化**: `const REQUEST_TIMEOUT_MS = 20000;` のようにファイル上部で `SCREAMING_SNAKE_CASE` にする。
- **エラーハンドリング**: ソース単位で `try/catch` し、1 ソースの失敗で全体を止めない。エラーはログ配列に記録し `fetch-logs.json` へ。機密情報（API キー・トークン）はログ・コンソールに出さない。

> 機械的な強制（`public/data/*.json` の直書き・`.env` ステージング・`out/` add のブロック）は `.codex/hooks/guard.sh` が担当する。
