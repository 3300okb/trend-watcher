---
name: fetch
description: トレンドデータ収集（RSS 取得・翻訳・JSON 更新）をローカル実行して動作確認する手順。fetch-trends.mjs や config/sources.json・keywords.json を変更した後の検証に使う。外部 API を叩くため、ユーザーが明示的に指示したときのみ実行する。
---

# トレンドデータ収集のローカル実行・動作確認

> 外部 API（Google ニュース RSS・Google 翻訳）へ実リクエストが走る。ユーザーが明示的に呼び出したときだけ実行する。

以下を順に実行し、各ステップのログを提示する。

1. `npm run sync:config` — runtime-config を最新化
2. `npm run job:fetch` — RSS 取得・翻訳・JSON 更新（`sync:config` も内部で再実行される）
3. `git status` で `public/data/trends.json` / `latest.json` の差分を確認
4. 差分行数・主要キー数・`fetch-logs.json` の末尾数件を要約して報告

注意:
- `public/data/*.json` への直接書き込みは禁止（`atomicWriteJson` パターン経由。`.codex/hooks/guard.sh` がシェル経由の直書きをブロックする）。
- 翻訳 API のレート制限に注意し、エラーが出たら即停止して報告する。
- `public/data/runtime-config.json` は `.gitignore` 対象（差分に出ないのが正常）。
