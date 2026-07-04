---
name: code-review
description: trend-watcher 固有の観点で変更をレビューするチェックリスト。バッチスクリプト（.mjs）・フロントエンド・設定・CI を変更した後の品質確認に使う。汎用の差分レビューは組み込みの /code-review が担う。
---

# コードレビュー観点（trend-watcher 固有）

まず `git diff`（未コミットは working tree、PR はブランチ差分）で変更範囲を把握し、以下の観点で確認する。
承認 / 要修正 / 差し戻しを明確に伝え、指摘は `ファイル名:行番号` で示す。

## 1. 正確性・仕様
- 変更意図と差分が一致しているか。収集・正規化・重複除去・翻訳・保存・配信のどの責務を触ったか明確か。
- 既存の自動実行スケジュール（GitHub Actions）を壊していないか。

## 2. セキュリティ・機密
- API キー・トークン・`.env` の値をコード / ログ / コンソールに出していないか。
- `public/assets/supabase-config.js` の anon key は公開前提だが、それ以外の秘密情報を追加していないか。
- Supabase RLS の前提（ユーザーは自分のデータのみ）を崩す変更がないか。

## 3. バッチスクリプト（`scripts/**/*.mjs`）
- ESM のみ（`require()` 不使用、`import.meta.url` でパス解決）。詳細は `.claude/rules/mjs-scripts.md`。
- JSON 書き込みは atomic rename（`atomicWriteJson`）。`public/data/` への直接 `writeFile` は不可。
- キーワード読み込みは `scripts/lib/runtime-config.mjs` の共通関数経由。
- ソース単位の `try/catch` で 1 ソース失敗が全体を止めない。マジックナンバーは定数化。

## 4. フロントエンド（`public/`）
- `app.js` は ES module（`type="module"`）。グローバル汚染に依存していないか。
- Supabase 同期は「ダウンロードのみ・Supabase を Source of Truth」の戦略を維持しているか（削除済みアイテムの再アップロードを起こさないか）。
- `public/assets/tailwind.css` は生成物。手編集していないか（Tailwind ソースは `src/styles/tailwind.css`）。

## 5. 生成物・データ
- `public/data/*.json`・`out/` を手動編集・手動コミットしていないか。
- `git status` に意図しない生成物差分が出ていないか。

## 6. 検証
- `npm run build` が通ることを確認したか。収集処理変更時は `npm run job:fetch` 相当の経路を確認したか。

## 出力フォーマット

```
## レビュー結果: ✅ 承認 / ⚠️ 要修正 / ❌ 差し戻し

### 良い点
- ...

### 必須修正（差し戻し条件）
- [ ] ファイル名:行番号 - 問題と修正方法

### 推奨修正（任意）
- [ ] ファイル名:行番号 - 提案内容

### 総評
...
```
