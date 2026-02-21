# Trend Watcher 実装計画（MVP）

## 1. 目的
`web` / `AI` / `tech` の最新トレンドを継続的に収集し、重複を除去して一覧化し、注目度順に閲覧できるアプリを提供する。

## 2. 前提制約（共有レンタルサーバ）
- Node.js の常駐実行（Webサーバ用途）は不可
- cron は利用可能（最短1分、最大10件）
- Node.js は「短時間で終了するバッチ実行」に限定

## 3. 提案アーキテクチャ（制約対応版）
- Frontend: 静的サイト（Next.js `output: export` または同等）
- Data Pipeline: cron で実行する短時間バッチ
- Data Store: MVP は JSON ファイル保存（必要なら将来 DB 化）
- Runtime:
  - 閲覧時: 静的ファイルのみ配信
  - 更新時: cron -> fetch/score -> `public/data/*.json` を再生成

## 4. スコープ
### MVP に含める
- ソース収集（RSS中心）
- 正規化（タイトル・URL・公開日時・カテゴリ）
- 重複除去（URL正規化 + タイトル類似）
- トレンドスコア算出（ルールベース）
- 画面表示（ホーム、カテゴリ一覧、検索/フィルタ）

### MVP に含めない
- ユーザーアカウント/認証
- 高度なレコメンド
- Node常駐APIサーバ

## 5. 実装フェーズ
## Phase 0: プロジェクト初期化（0.5日）
- 静的出力前提でフロント初期化
- TypeScript / ESLint / Prettier 設定
- `.env.example` 作成

## Phase 1: データモデル（1日）
- 内部データ構造を定義（`sources` / `articles` / `scores` / `fetch_logs`）
- JSON 永続化形式を確定
- 将来 DB 移行しやすいインターフェースを用意

## Phase 2: 収集バッチ（2日）
- RSS Fetcher
- URL 正規化（UTM除去、末尾スラッシュ調整）
- 重複判定（canonical URL + タイトル類似）
- 失敗時リトライ + ログ記録

## Phase 3: スコアリング（1日）
- ルールベース: `freshness + source_weight + keyword_boost`
- スコア結果を JSON 出力

## Phase 4: UI（2日）
- ホーム（注目 / 新着）
- カテゴリページ
- 検索・フィルタ（カテゴリ、期間、ソース）
- 参照先は `public/data/trends.json` など静的JSON

## Phase 5: 運用（1日）
- cron 登録（15分間隔推奨）
- 失敗ログ監視
- robots.txt / 利用規約準拠の確認
- デプロイ手順書整備

## 6. マイルストーン（7日）
1. Day 1: 設計確定 + データ形式確定
2. Day 2-3: 収集バッチ
3. Day 4: スコアリング
4. Day 5-6: UI
5. Day 7: cron運用 + サーバ設置検証

## 7. 完了条件（MVP）
- 20 以上のソースから 24 時間以内記事を収集できる
- 重複率が一定以下（目標 5% 未満）
- ホーム画面で注目順と新着順を切替表示できる
- レンタルサーバで HTTPS 閲覧できる
- cron バッチがタイムアウトせず短時間で完了する
