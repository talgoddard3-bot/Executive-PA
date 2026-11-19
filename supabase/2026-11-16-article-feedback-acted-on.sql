-- Applied to production on 2026-11-16 (migration: article_feedback_acted_on).
-- "Acted on" marks an insight that led to a real decision or action — the product's
-- core value metric (decisions changed per customer).
alter table public.article_feedback add column if not exists acted_on boolean not null default false;
alter table public.article_feedback add column if not exists acted_at timestamptz;
