-- ── Tag notes and docs to a specific brief ────────────────────────────────────
ALTER TABLE internal_notes
  ADD COLUMN IF NOT EXISTS target_brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL;

ALTER TABLE uploaded_documents
  ADD COLUMN IF NOT EXISTS target_brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS processed_content TEXT,
  ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'done', 'failed', 'skipped'));

-- ── Consolidated AI insights for late intel on a past brief ───────────────────
CREATE TABLE IF NOT EXISTS brief_intel_patches (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brief_id     UUID        NOT NULL REFERENCES briefs(id) ON DELETE CASCADE,
  summary      TEXT        NOT NULL,
  signal_count INTEGER     DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, brief_id)
);
ALTER TABLE brief_intel_patches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brief_intel_patches_company_policy"
  ON brief_intel_patches FOR ALL
  USING (company_id IN (
    SELECT company_id FROM user_profiles WHERE user_id = auth.uid()
  ));
CREATE INDEX IF NOT EXISTS brief_intel_patches_brief ON brief_intel_patches(brief_id);
