# 画面ワイヤー（MVP）

## 1. ホーム `/`
目的: 注目トレンドと新着を即時把握

```text
+----------------------------------------------------------+
| Trend Watcher                              [Search_____] |
| [All] [Web] [AI] [Tech]                    [Last 24h v] |
+----------------------------------------------------------+
| Featured Trends (score desc)                            |
| 1. [AI Model X Released]        score: 92   2h ago      |
| 2. [Web Perf Spec Update]       score: 88   3h ago      |
| 3. [Cloud Vendor New Runtime]   score: 84   4h ago      |
+----------------------------------------------------------+
| Latest                                                   |
| - title / source / category / published_at / external ->|
| - title / source / category / published_at / external ->|
| - ...                                                    |
+----------------------------------------------------------+
| [Load more]                                              |
+----------------------------------------------------------+
```

## 2. カテゴリ一覧 `/category/[web|ai|tech]`
目的: 特定カテゴリの深掘り

```text
+----------------------------------------------------------+
| Category: AI                                [Sort v]     |
| Filters: [Source v] [Past 7 days v] [Keyword_____]      |
+----------------------------------------------------------+
| [Article Card]                                            |
| Title                                                     |
| Summary (2 lines)                                         |
| Source | Published | Score | [Open]                       |
+----------------------------------------------------------+
| [Article Card] ...                                        |
+----------------------------------------------------------+
| Pagination: < 1 2 3 ... >                                |
+----------------------------------------------------------+
```

## 3. API連携前提（UI要件）
- `/api/trends?category=all&period=24h&sort=score`
- `/api/trends?category=ai&period=7d&sort=published_at`
- `/api/sources?category=ai`

## 4. レスポンシブ要件
- モバイル: 1カラム、フィルタはドロワー表示
- タブレット以上: 2カラム（Featured / Latest）
