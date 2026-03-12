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
    SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- ── 2. Internal notes ─────────────────────────────────────────────────────────
-- Free-text intelligence entered by users — fed into the next brief synthesis
CREATE TABLE IF NOT EXISTS internal_notes (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id      UUID         NOT NULL REFERENCES auth.users(id),
  category     TEXT         NOT NULL DEFAULT 'General'
                            CHECK (category IN ('Sales Signal','Customer Intel','Risk Flag','Opportunity','General')),
  content      TEXT         NOT NULL,
  expires_at   TIMESTAMPTZ  DEFAULT (now() + INTERVAL '60 days'),
  archived     BOOLEAN      NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ  DEFAULT now()
);
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_notes_company_policy"
  ON internal_notes FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- ── 3. Uploaded documents ─────────────────────────────────────────────────────
-- Metadata for files stored in Supabase Storage bucket 'internal-documents'
-- ONLY the title + description are sent to Claude; raw file contents never leave storage
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id       UUID         NOT NULL REFERENCES auth.users(id),
  title         TEXT         NOT NULL,
  description   TEXT         NOT NULL DEFAULT '',    -- what this file contains / key insight
  storage_path  TEXT         NOT NULL,               -- path inside bucket: {company_id}/{uuid}.ext
  file_type     TEXT         NOT NULL,               -- 'pdf', 'xlsx', 'png', 'txt', etc.
  file_size     INTEGER,                             -- bytes
  expires_at    TIMESTAMPTZ  DEFAULT (now() + INTERVAL '90 days'),
  archived      BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  DEFAULT now()
);
ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uploaded_documents_company_policy"
  ON uploaded_documents FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
  ));

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS article_feedback_company_brief ON article_feedback(company_id, brief_id);
CREATE INDEX IF NOT EXISTS internal_notes_company_active  ON internal_notes(company_id, archived, expires_at);
CREATE INDEX IF NOT EXISTS uploaded_docs_company_active   ON uploaded_documents(company_id, archived, expires_at);

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
