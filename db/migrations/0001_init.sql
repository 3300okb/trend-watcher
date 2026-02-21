CREATE TYPE trend_category AS ENUM ('web', 'ai', 'tech');
CREATE TYPE fetch_status AS ENUM ('success', 'failed', 'partial');

CREATE TABLE sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  category trend_category NOT NULL,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE articles (
  id UUID PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES sources(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  category trend_category NOT NULL,
  language TEXT,
  hash_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(canonical_url)
);

CREATE INDEX idx_articles_published_at_desc ON articles(published_at DESC);
CREATE INDEX idx_articles_category_published_at_desc ON articles(category, published_at DESC);
CREATE INDEX idx_articles_hash_title ON articles(hash_title);

CREATE TABLE article_scores (
  id UUID PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id),
  score_total NUMERIC(8,4) NOT NULL,
  freshness_score NUMERIC(8,4) NOT NULL,
  source_weight_score NUMERIC(8,4) NOT NULL,
  keyword_boost_score NUMERIC(8,4) NOT NULL,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_article_scores_article_id_scored_at_desc ON article_scores(article_id, scored_at DESC);
CREATE INDEX idx_article_scores_score_total_desc ON article_scores(score_total DESC);

CREATE TABLE fetch_logs (
  id UUID PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES sources(id),
  status fetch_status NOT NULL,
  http_status INT,
  fetched_count INT NOT NULL DEFAULT 0,
  inserted_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  duration_ms INT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fetch_logs_source_id_fetched_at_desc ON fetch_logs(source_id, fetched_at DESC);
CREATE INDEX idx_fetch_logs_status_fetched_at_desc ON fetch_logs(status, fetched_at DESC);
