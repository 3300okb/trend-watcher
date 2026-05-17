---
description: 静的サイトのフルビルド
---

以下を順に実行し、各ステップのログを提示してください。

1. `npm run sync:config`
2. `npm run build:css`
3. `npm run build` — `out/` に出力
4. `out/index.html` の存在と `out/assets/tailwind.css` のサイズを確認
5. 失敗時はエラー全文を提示し、原因仮説を 2-3 個提示

`out/` はコミット対象外。動作確認後はそのまま残してよい。
