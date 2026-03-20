# public/ ディレクトリ固有の指示

ルートの AGENTS.md の指示に加え、このディレクトリでは以下の規則を守ること。
詳細なルールは `.codex/` 配下の該当ファイルを参照すること。

## ディレクトリ構成

```
public/
├── index.html                 # フロントエンド HTML
├── assets/
│   ├── app.js                 # フロントエンド JS（type="module"）
│   ├── supabase-config.js     # Supabase 設定（通常スクリプト、window.SUPABASE_CONFIG）
│   ├── tailwind.css           # ビルド済み CSS（直接編集しない）
│   └── *.woff2                # LINE Seed JP フォント
└── data/
    ├── trends.json            # メインデータ（GitHub Actions が自動更新）
    ├── latest.json            # 最新データ
    ├── fetch-logs.json        # フェッチログ
    ├── runtime-config.json    # ビルド時生成（.gitignore 対象）
    └── translation-cache.json # 翻訳キャッシュ
```

## 固有の規則

- `app.js` は `type="module"` で読み込まれるため、変数はグローバルスコープに漏れない
- Supabase 設定は `supabase-config.js`（通常スクリプト）で `window.SUPABASE_CONFIG` として公開し、`app.js` から参照する
- `tailwind.css` は `npm run build:css` で生成される。直接編集しない（ソースは `src/styles/tailwind.css`）
- `data/` 以下の JSON はバッチスクリプトが自動生成する。手動編集しない
- `innerHTML` による HTML 直接挿入は XSS リスクに注意する
- localStorage キー `trend-watcher-saved` で保存記事を管理
