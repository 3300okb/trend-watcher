# コーディング規約

## 言語・フレームワーク
- **Node.js**: バッチスクリプト（v20 以上、GitHub Actions で指定）
- **JavaScript ESM**: `"type": "module"` により全スクリプトが ES Modules
- **TailwindCSS v3**: フロントエンドのスタイリング（CLI ビルド）
- **バニラ JS**: フロントエンドロジック（フレームワークなし）
- TypeScript は使用していない

## モジュール形式
- スクリプトファイルの拡張子は `.mjs`（例: `fetch-trends.mjs`, `build-static.mjs`）
- 設定ファイルは `.cjs`（例: `tailwind.config.cjs`）
- `require()` は使わない。`import` / `export` を使う
- `import.meta.url` でファイルパスを解決する（`__dirname` の代わり）

```javascript
// 良い例
import { readFile } from 'node:fs/promises';
const ROOT = resolve(new URL('..', import.meta.url).pathname);

// 悪い例
const { readFile } = require('fs');
const ROOT = __dirname;
```

## 非同期処理
- `async/await` を使う。`.then()/.catch()` チェーンは避ける
- バッチのエントリポイントは `main()` 関数にまとめ、末尾で呼び出す

```javascript
async function main() {
  // ...
}

main().catch((error) => {
  console.error('[trend-watcher] failed', error);
  process.exitCode = 1;
});
```

## ファイル書き込みパターン
JSON ファイルの更新は必ず atomic rename パターンを使う。
直接 `writeFile` でターゲットに書き込まない。

```javascript
// 良い例（atomic rename）
async function atomicWriteJson(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await rename(tmp, file);
}

// 悪い例（非 atomic）
await writeFile(file, JSON.stringify(data, null, 2), 'utf8');
```

## 定数
マジックナンバーはファイル上部で定数化する。

```javascript
// 良い例
const REQUEST_TIMEOUT_MS = 20000;
const MAX_ITEMS_PER_SOURCE = 30;

// 悪い例
setTimeout(() => controller.abort(), 20000);
```

## 設定読み込み
キーワード・除外パターンの読み込みは必ず `scripts/lib/runtime-config.mjs` の関数を使う。
直接 `.env` を読み込む実装を各スクリプトに重複させない。

```javascript
import { getConfiguredTopics, getConfiguredExcludePatterns } from './lib/runtime-config.mjs';
```

## エラーハンドリング
- バッチ処理ではソース単位で `try/catch` し、1 ソースの失敗が全体を止めないようにする
- エラーはログ配列に記録し、`fetch-logs.json` に保存する
- 機密情報（API キー、トークン）はログやコンソールに出力しない

## 命名規則
- **変数・関数**: `camelCase`（例: `configuredTopics`, `parseRssItems`）
- **定数**: `SCREAMING_SNAKE_CASE`（例: `REQUEST_TIMEOUT_MS`, `DATA_DIR`）
- **ファイル名**: `kebab-case.mjs`（例: `fetch-trends.mjs`, `runtime-config.mjs`）

## コメント
- 「何をするか（What）」はコードが語る。「なぜそうするか（Why）」をコメントで書く
- 自明な処理にコメントを書かない

```javascript
// 良い例
// URL 末尾のスラッシュを除去して正規化（重複排除のため）
if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
  url.pathname = url.pathname.slice(0, -1);
}

// 悪い例
// URL の末尾スラッシュを削除する
url.pathname = url.pathname.slice(0, -1);
```

## ファイル・フォルダ構成のルール
- `scripts/`: バッチスクリプト（エントリポイント）
- `scripts/lib/`: 複数スクリプトから使う共通関数
- `config/`: 静的設定ファイル（JSON）
- `public/`: 静的配信ファイル（git 管理）
- `public/data/`: バッチ生成データ（一部 .gitignore）
- `out/`: ビルド出力（.gitignore、コミットしない）

## 禁止事項
- `require()` の使用（ESM プロジェクト）
- `console.log` / デバッグ出力をコミットに含める（バッチの通常ログは可）
- `.env` ファイルをコミットする（機密情報を含む）
- `public/data/` 以下への直接 `writeFile`（atomic rename パターンを使う）
- `out/` ディレクトリをコミットする（.gitignore 対象）
- 翻訳 API の URL やクライアント ID をハードコードしたまま変更しない（仕様変更に弱いため）
