# coding-standards.md — コーディング規約

## 言語・フレームワーク
- **Node.js v20 以上**（GitHub Actions で指定）。バッチスクリプト。
- **JavaScript ESM**: `"type": "module"` により全スクリプトが ES Modules。
- **TailwindCSS v3**（CLI ビルド）。**バニラ JS**（フロントエンド、フレームワークなし）。
- TypeScript は使用していない。

## モジュール形式
- スクリプトの拡張子は `.mjs`（例: `fetch-trends.mjs`）。設定ファイルは `.cjs`（例: `tailwind.config.cjs`）。
- `require()` は使わない。`import` / `export` を使う。
- パス解決は `import.meta.url` を使う（`__dirname` は使わない）。

```javascript
// 良い例
import { readFile } from 'node:fs/promises';
const ROOT = resolve(new URL('..', import.meta.url).pathname);
```

## 非同期処理
- `async/await` を使う。`.then()/.catch()` チェーンは避ける。
- バッチのエントリポイントは `main()` にまとめ、末尾で `main().catch(...)` を呼ぶ。

```javascript
main().catch((error) => {
  console.error('[trend-watcher] failed', error);
  process.exitCode = 1;
});
```

## ファイル書き込みパターン
JSON 更新は必ず atomic rename（tmp に書いてから `rename`）を使う。ターゲットへ直接 `writeFile` しない。

```javascript
async function atomicWriteJson(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, file);
}
```

## 設定読み込み
キーワード・除外パターンは `scripts/lib/runtime-config.mjs` の関数を使う。
`config/keywords.json` を各スクリプトで直接読む実装を重複させない。

```javascript
import { getConfiguredTopics, getConfiguredExcludePatterns } from './lib/runtime-config.mjs';
```

## 品質ルール（必須）
- マジックナンバーはファイル上部で `SCREAMING_SNAKE_CASE` 定数にする（`const REQUEST_TIMEOUT_MS = 20000;`）。
- エラーハンドリングを省略しない。バッチはソース単位で `try/catch` し、1 ソースの失敗で全体を止めない。エラーはログ配列に記録し `fetch-logs.json` へ。

## 命名規則
- **変数・関数**: `camelCase`（例: `configuredTopics`, `parseRssItems`）
- **定数**: `SCREAMING_SNAKE_CASE`（例: `REQUEST_TIMEOUT_MS`, `DATA_DIR`）
- **ファイル名**: `kebab-case.mjs`（例: `fetch-trends.mjs`）

## ファイル・フォルダ構成のルール
- `scripts/`: バッチスクリプト（エントリポイント）。`scripts/lib/`: 複数スクリプトから使う共通関数。
- `config/`: 静的設定 JSON。`public/`: 静的配信ファイル（git 管理）。
- `public/data/`: バッチ生成データ（一部 .gitignore）。`out/`: ビルド出力（コミットしない）。

## コメント・ドキュメントのルール
- コメントは「なぜそうするか（Why）」を書く。「何をするか（What）」はコードが語る。
- 自明な処理にコメントを書かない。

## セキュリティ
- API キーや認証情報をコードに直書きしない。
- HTML を直接挿入する操作（`innerHTML` 相当）は XSS リスクに注意する。
- 翻訳 API の URL・クライアント ID はハードコードのまま安易に変更しない（仕様変更に弱い）。

## 禁止事項
- `require()` の使用（ESM プロジェクト）。
- `console.log` / デバッグ出力をコミットに含める（バッチの通常ログは可）。
- `.env` ファイルのコミット・ステージング。
- `public/data/` 以下への直接 `writeFile`（atomic rename パターンを使う）。
- `out/` ディレクトリのコミット。

> 機械的に強制できる禁止事項は rules（`.codex/rules/`）/ hooks（`.codex/hooks/guard.sh`）でも強制する。
