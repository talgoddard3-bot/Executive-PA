-- Email delivery schedule per company
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS brief_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  enabled          BOOLEAN NOT NULL DEFAULT false,
  days             INTEGER[] NOT NULL DEFAULT '{1}',  -- 0=Sun … 6=Sat
  hour_utc         INTEGER NOT NULL DEFAULT 7,        -- 07:00 UTC
  recipient_emails TEXT[] NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ DEFAULT now()
);
