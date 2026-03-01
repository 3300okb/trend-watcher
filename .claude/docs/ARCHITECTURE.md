# アーキテクチャ概要

## プロジェクト概要
静的配信 + バッチ更新のトレンド集約アプリ。
GitHub Actions で RSS 収集・翻訳・デプロイを 1 時間ごとに自動実行し、GitHub Pages で静的配信する。

## ディレクトリ構成
```
trend-watcher/
├── .github/
│   └── workflows/
│       └── research-and-deploy.yml  # CI/CD パイプライン（毎時05分 + push トリガー）
├── config/
│   ├── keywords.json             # キーワード・除外パターン設定（TREND_TOPICS / TREND_EXCLUDE_PATTERNS）
│   └── sources.json              # RSS フィードソース定義
├── scripts/                      # バッチスクリプト（ESM / .mjs）
│   ├── fetch-trends.mjs          # メインバッチ: RSS取得 → フィルタ → 翻訳 → JSON出力
│   ├── build-static.mjs          # public/ → out/ へのコピー（静的ビルド）
│   ├── sync-runtime-config.mjs   # config/keywords.json → public/data/runtime-config.json 生成
│   ├── dispatch-workflow.mjs     # GitHub Actions ワークフロー手動ディスパッチ
│   └── lib/
│       └── runtime-config.mjs   # 共通: キーワード・除外パターン読み込み・Google News URL生成
├── src/
│   └── styles/
│       └── tailwind.css          # TailwindCSS ソース（ビルドするとpublic/assets/に出力）
├── public/                       # 静的配信ルート（git 管理）
│   ├── index.html                # SPA 相当の静的 HTML（Tailwind + バニラ JS）
│   ├── assets/
│   │   ├── tailwind.css          # CSS ビルド出力（minified）
│   │   ├── app.js                # フロントエンド JS（フィルタリング・レンダリング・Supabase 同期）
│   │   ├── supabase-config.js    # Supabase URL / anon key（window.SUPABASE_CONFIG で公開）
│   │   ├── LINESeedJP_OTF_Bd.woff2  # フォント
│   │   └── LINESeedJP_OTF_Rg.woff2  # フォント
│   └── data/                     # バッチが更新するデータ（GitHub Actions が自動コミット）
│       ├── trends.json           # 全記事データ（titleJa/summaryJa 含む）
│       ├── latest.json           # 最新200件（trends.json の先頭）
│       ├── runtime-config.json   # 表示用キーワード設定（.gitignore）
│       ├── translation-cache.json  # 翻訳キャッシュ（SHA1ハッシュキー）
│       └── fetch-logs.json       # バッチ実行ログ（最大500件）
├── out/                          # 静的ビルド出力（.gitignore、GitHub Pages デプロイ用）
├── package.json
└── tailwind.config.cjs
```

## 主要モジュール・レイヤー

### バッチレイヤー（Node.js ESM）
| ファイル | 役割 |
|---------|------|
| `scripts/fetch-trends.mjs` | RSS フェッチ・パース・トピックマッチング・翻訳・JSON atomic 書き込み |
| `scripts/sync-runtime-config.mjs` | `config/keywords.json` → `runtime-config.json` 変換 |
| `scripts/build-static.mjs` | `public/` → `out/` コピー + `.nojekyll` 配置 |
| `scripts/lib/runtime-config.mjs` | キーワード/除外パターン管理の共通ロジック |

### フロントエンドレイヤー（バニラ JS + Tailwind）
| ファイル | 役割 |
|---------|------|
| `public/index.html` | HTML 構造・フォントロード・Supabase CDN 読み込み |
| `public/assets/app.js` | `trends.json` を fetch してレンダリング・トピック絞り込み・Supabase 認証同期（ES module） |
| `public/assets/supabase-config.js` | Supabase 接続設定を `window.SUPABASE_CONFIG` に公開（通常スクリプト） |
| `public/assets/tailwind.css` | スタイル（minify 済み） |

### 設定・データレイヤー
| ファイル | 役割 |
|---------|------|
| `config/keywords.json` | キーワード・除外パターンの設定源 |
| `config/sources.json` | RSS ソース URL・名前の定義 |
| `public/data/trends.json` | バッチ生成のメインデータ |
| `public/data/translation-cache.json` | 翻訳 API 呼び出しのキャッシュ |

## データフロー

### バッチ実行時（GitHub Actions / cron）
```
config/keywords.json
  ↓ getConfiguredTopics() / getConfiguredExcludePatterns()
config/sources.json
  ↓ feedUrl 解決（Google News 動的 URL 含む）
RSS フィード取得（各ソース）
  ↓ parseRssItems() / parseAtomEntries()
トピックマッチング + 除外フィルタ
  ↓ matchTopics() / shouldExcludeArticle()
URL 正規化・重複排除（canonicalUrl ベース）
  ↓ normalizeUrl()
Google 翻訳 API（未翻訳のみ、キャッシュ活用）
  ↓ translateToJapanese()
public/data/trends.json  （atomic rename）
public/data/latest.json  （atomic rename）
public/data/fetch-logs.json（atomic rename）
public/data/translation-cache.json（atomic rename）
```

### フロントエンド表示時
```
ブラウザ
  → GET /data/trends.json
  → GET /data/runtime-config.json
  → app.js でレンダリング・トピック絞り込み
  → Supabase: onAuthStateChange で既存セッション検出
      → ログイン済みなら saved_articles をフェッチしてローカルとマージ
```

### Saved 記事の同期フロー
```
Save ボタン押下
  → localStorage に追記
  → Supabase: saved_articles へ upsert（ログイン済みの場合）
      → 成功後、localStorage の該当アイテムに _synced: true をセット

Remove / Clear all 押下
  → localStorage から削除
  → Supabase: saved_articles から DELETE（ログイン済みの場合）

ログイン時（INITIAL_SESSION / SIGNED_IN）
  → Supabase から saved_articles を全件取得
  → _synced: true でないローカルアイテムのみ Supabase へアップロード
      （_synced: true = 過去に同期済み = 他デバイスで削除された可能性があるため再アップロードしない）
  → Supabase の内容で localStorage を上書き（union ではなく置換）
      → Supabase から取得したアイテムには _synced: true をセット
      → 他デバイスで削除されたアイテムがローカルからも除去される
```

**同期戦略: Supabase を Source of Truth とする**
- ログイン中に保存した記事は upsert 成功後に `_synced: true` でマーク
- ログイン時の同期で Supabase から取得した記事にも `_synced: true` をセット
- 次回ログイン時の同期では `_synced: true` の記事はアップロードをスキップ
- ログアウト中（オフライン）に保存した記事は `_synced` なし → ログイン時にアップロード対象

## 外部依存サービス
| サービス | 用途 | 備考 |
|---------|------|------|
| Google News RSS | トレンドニュース収集 | `news.google.com/rss/search` |
| Google 翻訳 API（非公式） | タイトル・要約の日本語化 | `translate.googleapis.com/translate_a/single` |
| GitHub Pages | 静的サイト配信 | `out/` をデプロイ |
| GitHub Actions | バッチ実行・自動デプロイ | 毎時05分 + push トリガー |
| Supabase | 認証（Google OAuth）・saved 記事の永続化 | プロジェクト ID: `kiaqxehlkhrdcwfxradi`、リージョン: `ap-northeast-1` |
