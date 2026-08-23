-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Internal Intelligence Layer
-- Run this in Supabase SQL Editor (once)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── 1. Article / SWOT feedback ────────────────────────────────────────────────
-- Stores thumbs up/down + optional free-text tag per article item
CREATE TABLE IF NOT EXISTS article_feedback (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID         NOT NULL REFERENCES companies(id)    ON DELETE CASCADE,
  brief_id     UUID         NOT NULL REFERENCES briefs(id)       ON DELETE CASCADE,
  user_id      UUID         NOT NULL REFERENCES auth.users(id),
  section      TEXT         NOT NULL,           -- e.g. 'competitor_intelligence'
  item_index   INTEGER      NOT NULL,           -- position in the section array
  rating       SMALLINT     NOT NULL CHECK (rating IN (1, -1)),  -- 1 = helpful, -1 = not helpful
  tag          TEXT,                            -- optional free-text label e.g. "CEO must see"
  created_at   TIMESTAMPTZ  DEFAULT now(),
  updated_at   TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (company_id, brief_id, section, item_index, user_id)
);
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_feedback_company_policy"
  ON article_feedback FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
  ));

-- ── 2. Internal notes ─────────────────────────────────────────────────────────
-- Free-text intelligence entered by users — fed into the next brief synthesis
CREATE TABLE IF NOT EXISTS internal_notes (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id          UUID         NOT NULL REFERENCES auth.users(id),
  category         TEXT         NOT NULL DEFAULT 'General'
                                CHECK (category IN ('Sales Signal','Customer Intel','Risk Flag','Opportunity','Financial Signal','General')),
  content          TEXT         NOT NULL,
  target_brief_id  UUID         REFERENCES briefs(id) ON DELETE CASCADE,  -- tag to an already-generated brief for "Late Intelligence"; null = feeds the next brief
  expires_at       TIMESTAMPTZ  DEFAULT (now() + INTERVAL '60 days'),
  archived         BOOLEAN      NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ  DEFAULT now()
);
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_notes_company_policy"
  ON internal_notes FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
  ));

-- ── 3. Uploaded documents ─────────────────────────────────────────────────────
-- Metadata for files stored in Supabase Storage bucket 'internal-documents'
-- ONLY the title + description are sent to Claude; raw file contents never leave storage
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID         NOT NULL REFERENCES auth.users(id),
  title             TEXT         NOT NULL,
  description       TEXT         NOT NULL DEFAULT '',    -- optional context to help the AI interpret the file
  category          TEXT         NOT NULL DEFAULT 'Other'
                                CHECK (category IN ('Financials','Sales','Marketing','Legal/Contract','Article/Research','Other')),
  storage_path      TEXT         NOT NULL,               -- path inside bucket: {company_id}/{uuid}.ext
  file_type         TEXT         NOT NULL,               -- 'pdf', 'xlsx', 'png', 'txt', etc.
  file_size         INTEGER,                             -- bytes
  processing_status TEXT         NOT NULL DEFAULT 'pending'
                                CHECK (processing_status IN ('pending','processing','done','failed')),
  processed_content TEXT,                                -- AI-extracted summary from /api/internal/process-file — this, not the raw file, feeds into briefs
  target_brief_id   UUID         REFERENCES briefs(id) ON DELETE CASCADE,  -- tag to an already-generated brief for "Late Intelligence"; null = feeds the next brief
  expires_at        TIMESTAMPTZ  DEFAULT (now() + INTERVAL '90 days'),
  archived          BOOLEAN      NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ  DEFAULT now()
);
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uploaded_documents_company_policy"
  ON uploaded_documents FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
  ));

-- ── 4. Late Intelligence patches ────────────────────────────────────────────────
-- One AI-written "Late Intelligence Update" per (company, brief) — produced by
-- /api/internal/consolidate when notes/documents are tagged to an already-generated brief
CREATE TABLE IF NOT EXISTS brief_intel_patches (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brief_id     UUID         NOT NULL REFERENCES briefs(id)    ON DELETE CASCADE,
  summary      TEXT         NOT NULL,
  signal_count INTEGER      NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ  DEFAULT now(),
  UNIQUE (company_id, brief_id)
);
ALTER TABLE brief_intel_patches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brief_intel_patches_company_policy"
  ON brief_intel_patches FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
  ));

-- ── 5. Investor relations report tracking (on company_profiles) ────────────────
-- Run once: tracks each company's own IR/financial-reports page, and the most
-- recently seen report so it's only re-fetched and re-analyzed when it changes.
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_page_url TEXT;
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_report_url TEXT;
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_report_title TEXT;
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_report_summary TEXT;
-- ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_checked_at TIMESTAMPTZ;

-- ── Migration: run these if your tables predate the columns above ──────────────
-- ALTER TABLE internal_notes ADD COLUMN IF NOT EXISTS target_brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE;
-- ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other'
--   CHECK (category IN ('Financials','Sales','Marketing','Legal/Contract','Article/Research','Other'));
-- ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending'
--   CHECK (processing_status IN ('pending','processing','done','failed'));
-- ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS processed_content TEXT;
-- ALTER TABLE uploaded_documents ADD COLUMN IF NOT EXISTS target_brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE;
-- ALTER TABLE internal_notes DROP CONSTRAINT IF EXISTS internal_notes_category_check;
-- ALTER TABLE internal_notes ADD CONSTRAINT internal_notes_category_check
--   CHECK (category IN ('Sales Signal','Customer Intel','Risk Flag','Opportunity','Financial Signal','General'));

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS article_feedback_company_brief ON article_feedback(company_id, brief_id);
CREATE INDEX IF NOT EXISTS internal_notes_company_active  ON internal_notes(company_id, archived, expires_at);
CREATE INDEX IF NOT EXISTS uploaded_docs_company_active   ON uploaded_documents(company_id, archived, expires_at);
CREATE INDEX IF NOT EXISTS brief_intel_patches_lookup     ON brief_intel_patches(company_id, brief_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Supabase Storage: create bucket 'internal-documents' (PRIVATE)
-- Go to: Storage → New Bucket → Name: internal-documents → Private → Create
--
-- Then run this RLS policy on the bucket objects table:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- (Run in SQL editor after creating the bucket)
-- Allows authenticated users to upload to their company's folder
CREATE POLICY "internal_docs_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'internal-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "internal_docs_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'internal-documents'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "internal_docs_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'internal-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
