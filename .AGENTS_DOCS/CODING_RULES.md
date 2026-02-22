# CODING_RULES

## 要約
- 変更範囲は最小化し、既存スタイルに合わせる。
- 生成物とデータJSONの更新は、目的に必要な時だけ行う。

## ルール
- 目的に直接関係しないリファクタはしない。
- 命名・構成・モジュール分割は既存パターンを優先する。
- 追加コメントは「なぜ必要か」が不明な箇所に限定する。
- 生成物の更新は、必要時のみ行う。

## このリポジトリ固有
- データ処理変更時は `public/data/*.json` の差分が意図通りか確認する。
- `scripts/fetch-trends.mjs` は atomic write 前提のため、書き込み方式を壊さない。
- 翻訳キャッシュ（`public/data/translation-cache.json`）の肥大化に注意し、不必要なリセットはしない。
- `out/` はビルド生成物として扱い、手編集しない。
- `.env` のキー追加・変更時は `scripts/lib/runtime-config.mjs` と `README.md` の整合を取る。

## 変更後の最小確認
- データ系変更: `npm run job:fetch`
- UI/CSS変更: `npm run build:css`（必要なら `npm run dev`）
- 配備関連変更: `npm run build`
