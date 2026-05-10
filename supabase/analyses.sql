-- Lune POST /api/analyse persistence (persist: true)
--
-- If you see: "Could not find the 'result' column of 'analyses' in the schema cache"
-- run **repair_analyses.sql** (or run the ALTER block below). PostgREST reloads shortly after.

-- ── Fresh install ─────────────────────────────────────────────
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text,
  result jsonb not null default '{}'::jsonb
);

-- ── Repair: add missing columns (safe to re-run) ─────────────
alter table public.analyses add column if not exists result jsonb not null default '{}'::jsonb;
alter table public.analyses add column if not exists source text;

create index if not exists analyses_created_at_idx on public.analyses (created_at desc);

alter table public.analyses enable row level security;

-- Service role bypasses RLS for server-side inserts when using SUPABASE_SERVICE_ROLE_KEY.

-- Anonymous key (development only): uncomment to allow inserts from the anon key path.
-- create policy "anon insert analyses"
--   on public.analyses for insert to anon with check (true);

