# workflow.md — 作業フロー

## 作業手順

タスクに取り組む際は以下の手順を守ってください：

1. **調査**: 対象ファイルをすべて読み、影響範囲を把握してから変更に入る
2. **実装**: 既存コードのスタイル・命名規則・ファイル構成に合わせて実装する
3. **検証**: 実装後はビルドを実行し、すべてパスすることを確認する
4. **報告**: 変更ファイルと実行結果を明示して報告する

シンプルな 1 行修正などは調査フェーズを省略して直接実装してよい。

## 開発サーバー

```bash
# CSS ビルド + Python3 http.server で http://localhost:8080 を起動
npm run dev
```

## ビルド

```bash
# config 同期 + CSS ビルド + 静的サイト生成（out/ に出力）
npm run build

# CSS のみビルド
npm run build:css

# config/keywords.json → public/data/runtime-config.json の同期
npm run sync:config
```

## データ収集（バッチ）

```bash
# RSS フェッチ + 翻訳 + JSON 更新
npm run job:fetch
```

## 報告フォーマット

作業完了時は以下の形式で報告する：

### 変更ファイル
- `path/to/file`: （変更内容の要約）

### 実行結果
- ビルド: ✅ / ❌
- テスト: （テストフレームワーク未導入）
- lint: （lint 未導入）
