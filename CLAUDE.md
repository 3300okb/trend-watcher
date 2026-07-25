# CLAUDE.md

## プロジェクト概要

**Trend Watcher** — 静的配信 + バッチ更新のトレンド集約アプリ。
GitHub Actions で RSS 収集・Google 翻訳・GitHub Pages デプロイを 3 時間ごとに実行する。

---

## エージェント構成

標準フロー: researcher → planner → coder → reviewer
単純な 1 行修正は researcher/planner を省略可。

---

## スキル（手続き型ワークフロー）

呼び出し時のみ本体がロードされる。`/名前` で明示実行も可。

- `/build` — sync:config → build:css → build を順に実行し `out/` を検証（`.claude/skills/build/`）
- `/fetch` — トレンドデータ収集をローカル実行して動作確認（外部 API を叩くため手動実行のみ・`.claude/skills/fetch/`）
- `/code-review` の repo 固有チェックリスト（`.claude/skills/code-review/`）

---

## 詳細ドキュメント（必要時に Read で読み込む）

> 起動時には読み込まない。関連作業に着手する直前に該当ファイルを Read すること。

- `.claude/docs/ARCHITECTURE.md` — ディレクトリ構成・データフロー・外部依存
- `.claude/docs/CODING_STANDARDS.md` — コーディング規約（詳細）
- `.claude/docs/COMMANDS.md` — npm スクリプト・コマンド一覧
- `.claude/docs/TESTING.md` — テスト方針・品質確認手順
- `.claude/docs/GIT_WORKFLOW.md` — ブランチ戦略・コミット規約・CI/CD
- `.claude/docs/ENVIRONMENT.md` — キーワード設定・Supabase・環境差異

> `scripts/**/*.mjs` 編集時のファイル固有ルールは `.claude/rules/mjs-scripts.md`（paths スコープで自動ロード）。

---

## 制御手段の所在

- 手続き（ビルド・収集・レビュー）: `.claude/skills/`
- パス限定の規約（`scripts/**/*.mjs`）: `.claude/rules/`
- 機械的な強制（機密読み取り拒否・危険コマンドのブロック）: `.claude/settings.json`（permissions / PreToolUse hook）+ `.claude/hooks/guard.sh`
- 詳細ドキュメント（事実）: `.claude/docs/`

---

## 作業前チェックリスト

- [ ] 影響範囲を確認したか（researcher）
- [ ] `scripts/lib/runtime-config.mjs` の既存関数で対応できないか確認したか
- [ ] JSON 書き込みに atomic rename パターンを使っているか
- [ ] `npm run build` が通ることを確認したか

---

## 禁止事項

- `.env` をコミットしない
- `console.log` などのデバッグ出力を残してコミットしない
- `public/data/` 以下の JSON を直接 `writeFile` で書かない（atomic rename を使う）
- `out/` をコミットしない
- `require()` を使わない（ESM プロジェクト）
- レビューなしで `main` に直接プッシュしない

> 散文の禁止は確率的にしか守られない。機械的な強制は `.claude/settings.json`（permissions の `.env` 読み取り deny）と
> `.claude/hooks/guard.sh`（`public/data/*.json` 直書き・`out/` の add・`.env` の stage をブロック）で決定論的に行う。
