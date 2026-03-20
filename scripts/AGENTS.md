# scripts/ ディレクトリ固有の指示

ルートの AGENTS.md の指示に加え、このディレクトリでは以下の規則を守ること。
詳細なルールは `.codex/` 配下の該当ファイルを参照すること。

## ディレクトリ構成

```
scripts/
├── fetch-trends.mjs          # メインバッチ: RSS 取得・翻訳・JSON 書き込み
├── build-static.mjs           # 静的サイトビルド（out/ 生成）
├── dispatch-workflow.mjs      # GitHub Actions ワークフローディスパッチ
├── sync-runtime-config.mjs    # config/keywords.json → public/data/runtime-config.json 同期
└── lib/
    └── runtime-config.mjs     # キーワード・除外パターンの共通管理
```

## 固有の規則

- すべてのファイルは ESM（`.mjs` 拡張子、`import`/`export`）で記述する
- `require()` は絶対に使わない
- `public/data/` への JSON 書き込みは atomic rename パターンを使う（一時ファイル → `fs.rename`）
- 新しいユーティリティを作る前に `scripts/lib/runtime-config.mjs` の既存関数で対応できないか確認する
- `console.log` などのデバッグ出力を残さない
