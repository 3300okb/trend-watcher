# CODING_RULES.md — コーディング規約・禁止事項

---

## 基本方針

- **依頼されたこと以外を変更しない** — バグ修正の隣のコードを整理したり、コメントを追加したりしない
- **シンプルに保つ** — 将来の拡張を見越した抽象化は不要。現在の要件に最小限のコードを書く
- **Node.js 組み込み API のみ使用** — バッチスクリプトに `npm install` でパッケージを追加しない

---

## スクリプト（`scripts/`）

### アトミック書き込みパターンを壊さない

`public/data/*.json` への書き込みは必ず `.tmp` → `rename()` の順で行うこと。
`writeFile` で直接書き込むと、書き込み途中でフロントエンドがファイルを読んだ場合に
不正な JSON を受け取る可能性がある。

```javascript
// OK — atomicWriteJson() を使う
await atomicWriteJson(TRENDS_FILE, data);

// NG — 直接 writeFile を使う
await writeFile(TRENDS_FILE, JSON.stringify(data));
```

`atomicWriteJson` は `fetch-trends.mjs:234-239` に定義されている。

### エラーが出ても処理を継続する

1 ソースのフェッチが失敗しても、残りのソースの処理は継続する。
`try/catch` で個別に捕捉し、`logs` に記録して次のソースへ進む。

```javascript
// fetch-trends.mjs のパターン
try {
  // フィード取得・処理
} catch (error) {
  status = 'failed';
  errorMessage = error.message;
}
logs.push({ ..., status, errorMessage });
```

### 設定値はハードコードしない

トピックや除外パターンは必ず `.env` → `runtime-config.mjs` 経由で取得する。
スクリプト内にトピック名をハードコードしない。

```javascript
// OK
const configuredTopics = await getConfiguredTopics();

// NG
const configuredTopics = ['Anthropic', 'OpenAI', 'Google'];
```

---

## フロントエンド（`public/assets/app.js`）

### innerHTML に信頼できない文字列を直接代入しない

記事タイトルやサマリはユーザーが制御できない外部データ。
DOM に挿入する際は `textContent` を使うか、`<template>` + `cloneNode` を使う。

```javascript
// OK — textContent を使う
title.textContent = item.titleJa || item.title;

// NG — XSS の可能性
trendList.innerHTML += `<li>${item.title}</li>`;
```

### フォールバック値とランタイム設定を乖離させない

`app.js` の `FALLBACK_TOPICS` と `.env` の `TREND_TOPICS` は同じ値であるべき。
`.env` を変更したら `FALLBACK_TOPICS` も合わせて更新すること。

```javascript
// app.js:7
const FALLBACK_TOPICS = ['Anthropic', 'OpenAI', 'Google', 'Apple', 'claude', 'codex', 'gemini', 'frontend', 'html', 'css', 'typescript', 'vue'];
```

---

## スタイリング（Tailwind）

### Tailwind クラスは `public/` 配下にのみ書く

`tailwind.config.cjs` のスキャン対象は `public/**/*.html` と `public/assets/**/*.js` のみ。
別のディレクトリに HTML/JS を追加する場合は `content` の設定も更新すること。

### CSS ビルドを忘れずに実行する

新しい Tailwind クラスを追加・削除した後は必ず `npm run build:css` を実行する。
ビルドしないとクラスが出力 CSS に含まれず、スタイルが適用されない。

---

## データファイル

### `public/data/*.json` を手書き編集しない

これらのファイルはすべて自動生成物。
- `trends.json` / `latest.json` → `npm run job:fetch`
- `runtime-config.json` → `npm run sync:config`

`translation-cache.json` と `fetch-logs.json` は永続データで手書き可能だが、
通常は手書きする必要はない。

### `.gitignore` 対象ファイルをコミットしない

以下のファイルは `.gitignore` に含まれており、コミットしてはいけない:
- `public/data/runtime-config.json`
- `out/`
- `node_modules/`

---

## 変更検証の方法

テストフレームワークは存在しない。以下の手順で動作確認する:

1. **データ変更の確認**
   ```bash
   npm run job:fetch
   # public/data/trends.json の差分を確認
   git diff public/data/
   ```

2. **フロントエンド変更の確認**
   ```bash
   npm run dev
   # http://localhost:8080 でブラウザ確認
   ```

3. **フェッチエラーの確認**
   ```bash
   # fetch-logs.json の "status": "failed" 行を確認
   node -e "const l = require('./public/data/fetch-logs.json'); console.log(l.filter(x => x.status === 'failed').slice(-5))"
   ```

4. **CSS 変更の確認**
   ```bash
   npm run build:css
   npm run dev
   ```

---

## よくある落とし穴

| 状況 | 原因 | 対処 |
|---|---|---|
| スタイルが反映されない | `build:css` 未実行 | `npm run build:css` を実行 |
| フロントエンドのトピックが変わらない | `runtime-config.json` が古い | `npm run sync:config` を実行 |
| 翻訳が反映されない | キャッシュ済み | `translation-cache.json` の当該エントリを削除して再実行 |
| フィードが取得できない | タイムアウト(20秒)またはフィード URL 変更 | `fetch-logs.json` で `errorMessage` を確認 |
| `out/` が存在しない | `npm run build` 未実行 | ローカルでは不要。CI で自動生成される |
