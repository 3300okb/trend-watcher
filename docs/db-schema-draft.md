# DBスキーマ草案（PostgreSQL）

## ER概要
- `sources` 1 --- n `articles`
- `articles` 1 --- n `article_scores`
- `sources` 1 --- n `fetch_logs`

## テーブル

### sources
- `id` UUID PK
- `name` TEXT NOT NULL
- `url` TEXT NOT NULL
- `feed_url` TEXT NOT NULL UNIQUE
- `category` TEXT NOT NULL CHECK IN (`web`, `ai`, `tech`)
- `weight` NUMERIC(5,2) NOT NULL DEFAULT 1.00
- `is_active` BOOLEAN NOT NULL DEFAULT true
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()
- `updated_at` TIMESTAMPTZ NOT NULL DEFAULT now()

### articles
- `id` UUID PK
- `source_id` UUID NOT NULL FK -> `sources(id)`
- `title` TEXT NOT NULL
- `url` TEXT NOT NULL
- `canonical_url` TEXT NOT NULL
- `summary` TEXT NULL
- `published_at` TIMESTAMPTZ NOT NULL
- `category` TEXT NOT NULL CHECK IN (`web`, `ai`, `tech`)
- `language` TEXT NULL
- `hash_title` TEXT NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

制約/インデックス
- UNIQUE(`canonical_url`)
- INDEX(`published_at` DESC)
- INDEX(`category`, `published_at` DESC)
- INDEX(`hash_title`)

### article_scores
- `id` UUID PK
- `article_id` UUID NOT NULL FK -> `articles(id)`
- `score_total` NUMERIC(8,4) NOT NULL
- `freshness_score` NUMERIC(8,4) NOT NULL
- `source_weight_score` NUMERIC(8,4) NOT NULL
- `keyword_boost_score` NUMERIC(8,4) NOT NULL
- `scored_at` TIMESTAMPTZ NOT NULL DEFAULT now()

制約/インデックス
- INDEX(`article_id`, `scored_at` DESC)
- INDEX(`score_total` DESC)

### fetch_logs
- `id` UUID PK
- `source_id` UUID NOT NULL FK -> `sources(id)`
- `status` TEXT NOT NULL CHECK IN (`success`, `failed`, `partial`)
- `http_status` INT NULL
- `fetched_count` INT NOT NULL DEFAULT 0
- `inserted_count` INT NOT NULL DEFAULT 0
- `error_message` TEXT NULL
- `duration_ms` INT NULL
- `fetched_at` TIMESTAMPTZ NOT NULL DEFAULT now()

制約/インデックス
- INDEX(`source_id`, `fetched_at` DESC)
- INDEX(`status`, `fetched_at` DESC)

## 初期 SQL（サンプル）
```sql
CREATE TYPE trend_category AS ENUM ('web', 'ai', 'tech');
```

## データ保持方針
- `fetch_logs`: 90 日保持（以降は集計のみ保持）
- `article_scores`: 最新 30 日を参照対象
