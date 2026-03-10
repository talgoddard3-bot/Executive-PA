-- Raw signals table — populated by Python scraper, read at brief generation time
-- Run this once in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS raw_signals (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   UUID        REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  signal_type  TEXT        NOT NULL,   -- 'company' | 'competitor' | 'country' | 'location' | 'industry'
  entity_name  TEXT        NOT NULL,   -- company name, competitor name, or country name
  country      TEXT        DEFAULT '',
  title        TEXT        NOT NULL,
  summary      TEXT        DEFAULT '',
  url          TEXT        UNIQUE,     -- deduplicates on upsert
  source_name  TEXT        DEFAULT '',
  published_at TEXT,                   -- raw string from RSS (varies by feed)
  fetched_at   TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS raw_signals_company_id_idx ON raw_signals(company_id);
CREATE INDEX IF NOT EXISTS raw_signals_fetched_at_idx ON raw_signals(fetched_at DESC);
CREATE INDEX IF NOT EXISTS raw_signals_signal_type_idx ON raw_signals(company_id, signal_type);

-- Auto-delete signals older than 14 days (keep DB lean)
-- Run this separately as a Supabase cron job if desired:
-- DELETE FROM raw_signals WHERE fetched_at < now() - interval '14 days';
