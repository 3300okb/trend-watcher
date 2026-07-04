---
name: build
description: 静的サイトをフルビルドして out/ を生成・検証する手順。デプロイ前の最終確認や、CSS / 静的出力の生成を確認したいときに使う。外部 API は叩かない。
---

# 静的サイトのフルビルド

以下を順に実行し、各ステップのログを提示する。

1. `npm run sync:config` — `config/keywords.json` → `public/data/runtime-config.json` を再生成
2. `npm run build:css` — Tailwind を `public/assets/tailwind.css` に minify 出力
3. `npm run build` — `out/` に静的ファイルを出力（上記 2 つも内部で再実行される）
4. `out/index.html` の存在と `out/assets/tailwind.css` のサイズを確認
5. 失敗時はエラー全文を提示し、原因仮説を 2〜3 個提示

注意:
- `out/` はコミット対象外（`.gitignore`）。動作確認後はそのまま残してよい。
- 外部 API は呼ばない（ビルドのみ）。
