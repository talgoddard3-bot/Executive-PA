-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Phase 1 — Executive Intelligence Operating System foundation
-- Run this in Supabase SQL Editor (once). Safe to re-run (all IF NOT EXISTS /
-- idempotent guards).
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── 1. Investor Relations tracking (finishes the already-designed columns —
--       previously commented out in internal-intelligence.sql) ────────────────
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_page_url TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_report_url TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_report_title TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_report_summary TEXT;
ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS ir_last_checked_at TIMESTAMPTZ;

-- ── 2. RLS gap closure — article_favourites / article_comments / notifications
--       currently have zero RLS, so the public anon key can read/write any
--       user's comments and notifications directly via the Supabase REST API.
--       All app routes already use the service-role key + their own session
--       check (see app/api/comments/route.ts), so this only closes the
--       anon-key bypass — no app behavior changes. ───────────────────────────
ALTER TABLE article_favourites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_favourites_company_policy"
  ON article_favourites FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
    )
  );

ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_comments_company_policy"
  ON article_comments FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
    )
  );

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_company_policy"
  ON notifications FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
    )
  );

-- ── 3. FK constraints on user_id/from_user_id — these were plain UUID columns
--       with no referential integrity. Wrapped in DO blocks so this migration
--       doesn't abort if legacy rows reference a user id no longer in
--       auth.users (rare, but non-destructive to skip rather than fail loud
--       on a security-hardening migration). ──────────────────────────────────
DO $$ BEGIN
  ALTER TABLE article_favourites
    ADD CONSTRAINT article_favourites_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'Skipped article_favourites FK — legacy rows reference a missing user_id. Clean up manually if needed.';
END $$;

DO $$ BEGIN
  ALTER TABLE article_comments
    ADD CONSTRAINT article_comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'Skipped article_comments FK — legacy rows reference a missing user_id. Clean up manually if needed.';
END $$;

DO $$ BEGIN
  ALTER TABLE notifications
    ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'Skipped notifications FK — legacy rows reference a missing user_id. Clean up manually if needed.';
END $$;

DO $$ BEGIN
  ALTER TABLE notifications
    ADD CONSTRAINT notifications_from_user_id_fkey
    FOREIGN KEY (from_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
  WHEN foreign_key_violation THEN
    RAISE NOTICE 'Skipped notifications.from_user_id FK — legacy rows reference a missing user. Clean up manually if needed.';
END $$;
