---
description: トレンドデータ収集をローカル実行して動作確認
---

以下を順に実行し、各ステップのログを提示してください。

1. `npm run sync:config` で runtime-config を最新化
2. `npm run job:fetch` で RSS 取得・翻訳・JSON 更新
3. `git status` で `public/data/trends.json` の差分を確認
4. 差分行数・主要キー数を要約して報告

注意:
- `public/data/*.json` への直接書き込みは禁止（atomic rename パターン経由）
- 翻訳 API のレート制限に注意し、エラーがあれば即停止して報告
