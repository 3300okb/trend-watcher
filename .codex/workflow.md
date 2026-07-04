# workflow.md — 作業フロー

## 作業手順

1. **調査**: 対象ファイルをすべて読み、影響範囲を把握してから変更に入る。
   - バッチ変更時は `scripts/lib/runtime-config.mjs` の既存関数で対応できないか先に確認する。
   - 直近のバッチ挙動は `public/data/fetch-logs.json` の末尾で確認できる。
2. **実装**: 既存コードのスタイル・命名規則・ファイル構成に合わせて実装する。
3. **検証**: 実装後は `npm run build` が通ることを確認する。収集処理を触った場合は `npm run job:fetch`（外部 API を叩くため注意）で経路を確認する。lint・テストは未導入のため「未導入」と明記する。
4. **報告**: 変更ファイルと実行結果を明示して報告する。

シンプルな 1 行修正などは調査フェーズを省略して直接実装してよい。

## 標準フロー（サブエージェント）

`researcher → planner → coder → reviewer`。単純な 1 行修正は researcher / planner を省略可。
Codex の組み込み `explorer` / `worker` に加え、プロジェクト固有の観点を持つ `.codex/agents/` のカスタムエージェントを使う。

## 開発サーバー

```bash
npm run dev   # public/ を http://localhost:8080 で配信（CSS を事前ビルドして起動）
```

- データ（`public/data/trends.json` 等）は事前に `npm run job:fetch` で生成が必要。

## ビルド

```bash
npm run build   # sync:config + build:css + build-static.mjs → out/ 生成
ls -la out/     # out/index.html と out/assets/tailwind.css を確認
```

## 報告フォーマット

作業完了時は以下の形式で報告する：

### 変更ファイル
- `path/to/file`: （変更内容の要約）

### 実行結果
- ビルド: ✅ / ❌
- テスト: 未導入
- lint: 未導入
