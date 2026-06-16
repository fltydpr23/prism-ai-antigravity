-- Run this snippet in your Supabase SQL Editor to add the missing created_at column

ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS created_at timestamptz not null default now();

-- Nudge PostgREST to pick up new columns
notify pgrst, 'reload schema';
