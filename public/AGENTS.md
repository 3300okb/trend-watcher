# public/ ディレクトリ固有の指示

ルート `AGENTS.md` に加え、`public/` 配下を編集するときは以下を守る。
詳細は `.codex/coding-standards.md` / `.codex/environment.md` を参照。

## ディレクトリ構成
- `public/index.html`: 静的 HTML（Tailwind + バニラ JS、Supabase CDN 読み込み）。
- `public/assets/app.js`: フロントエンド JS（**ES module / `type="module"`**）。レンダリング・トピック絞り込み・Supabase 認証同期。
- `public/assets/supabase-config.js`: Supabase 接続設定を `window.SUPABASE_CONFIG` に公開する通常スクリプト。
- `public/assets/tailwind.css`: **Tailwind ビルドの生成物**。手編集しない（ソースは `src/styles/tailwind.css`）。
- `public/data/`: バッチ生成データ。GitHub Actions が自動コミットする。

## 固有の規則
- `app.js` は ES module。グローバル汚染に依存した実装をしない。Supabase 設定は `window.SUPABASE_CONFIG` パターンを維持する。
- **Supabase 同期は「ダウンロードのみ・Supabase を Source of Truth」**の戦略を維持する。`syncWithSupabase()` は localStorage → Supabase の再アップロードを行わない（他デバイスで削除したアイテムが復活しないようにするため）。
- `public/assets/tailwind.css` を手編集しない。スタイル変更は `src/styles/tailwind.css` を編集し `npm run build:css` で再生成する。
- `public/data/*.json`（`trends.json` / `latest.json` など）を手動編集・手動コミットしない。バッチが管理する。
- HTML を直接挿入する操作（`innerHTML` 相当）は XSS リスクに注意する。
