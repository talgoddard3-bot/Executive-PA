-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Fixes a product-wide bug: the live brief_schedules table is missing the
-- recipient_emails column that app/api/settings/schedule/route.ts (and the
-- Settings > Schedule UI) requires on every save. Until this runs, saving a
-- weekly schedule fails silently for every company — this is why automatic
-- weekly brief generation has never actually run for anyone, not just BIG.
-- Safe, additive, non-destructive. Run once in the Supabase SQL Editor.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE brief_schedules ADD COLUMN IF NOT EXISTS recipient_emails TEXT[] NOT NULL DEFAULT '{}';
