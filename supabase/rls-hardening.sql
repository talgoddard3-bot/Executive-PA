-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- RLS Hardening — closes two tables that were created without Row Level
-- Security: brief_schedules (contains recipient_emails) and raw_signals
-- (competitive intelligence data). Both are otherwise readable/writable by
-- anyone with the public anon key via Supabase's REST API, bypassing the
-- app entirely. Run once in the Supabase SQL Editor.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE brief_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brief_schedules_company_policy"
  ON brief_schedules FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
    )
  );

ALTER TABLE raw_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raw_signals_company_policy"
  ON raw_signals FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles WHERE user_id::text = auth.uid()::text
    )
  );

-- Note: the weekly scraper (scripts/scraper.py) and the cron routes
-- (app/api/briefs/cron, app/api/settings/schedule) all use the Supabase
-- service-role key server-side, which bypasses RLS by design — this
-- migration only restricts access via the public anon key, it does not
-- affect the app's own server-side functionality.
