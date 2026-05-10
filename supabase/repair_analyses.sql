-- Fix: "Could not find the 'result' column of 'analyses' in the schema cache"
-- Supabase → SQL Editor → Run (then retry persist in the app).

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.analyses add column if not exists result jsonb not null default '{}'::jsonb;
alter table public.analyses add column if not exists source text;

-- Nudge PostgREST to pick up new columns (harmless if redundant)
notify pgrst, 'reload schema';
