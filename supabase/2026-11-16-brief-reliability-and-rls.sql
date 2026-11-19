-- Applied to production on 2026-11-16 (migration: brief_reliability_and_rls_hardening).
-- Kept here so the repo matches the live database.

-- Brief reliability: record why a brief failed and how many times it was tried,
-- so the scheduler can retry safely and the admin page can show the reason.
alter table public.briefs add column if not exists error text;
alter table public.briefs add column if not exists attempts integer not null default 0;

-- One brief per company per week (the code already assumed this).
create unique index if not exists briefs_company_week_uniq on public.briefs (company_id, week_of);

-- company_locations had Row Level Security disabled: anyone holding the public
-- anon key could read or modify every company's locations. The app only touches
-- this table through server routes (service role), so a company-scoped policy is safe.
alter table public.company_locations enable row level security;
drop policy if exists company_locations_company_policy on public.company_locations;
create policy company_locations_company_policy on public.company_locations
  for all
  using (company_id in (select up.company_id from public.user_profiles up where up.user_id = (auth.uid())::text))
  with check (company_id in (select up.company_id from public.user_profiles up where up.user_id = (auth.uid())::text));

-- user_profiles allowed users to UPDATE their own row directly, including
-- is_admin, company_id, plan and subscription_status (privilege escalation).
-- All writes go through server routes, so direct access becomes read-only.
drop policy if exists "Users can manage their own profile" on public.user_profiles;
drop policy if exists "Users can read their own profile" on public.user_profiles;
create policy "Users can read their own profile" on public.user_profiles
  for select
  using ((auth.uid())::text = user_id);
