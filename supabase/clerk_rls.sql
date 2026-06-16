-- 1. Add user_id column to track which Clerk user owns the analysis
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS user_id text;

-- 2. Create an index on user_id for faster lookups when loading history
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON public.analyses(user_id);

-- 3. Enable RLS (if not already enabled)
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- 4. Drop any existing development policies that allowed anonymous access
DROP POLICY IF EXISTS "anon insert analyses" ON public.analyses;
DROP POLICY IF EXISTS "users can view their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "users can delete their own analyses" ON public.analyses;

-- 5. Helper function to extract Clerk User ID from the Supabase JWT
CREATE OR REPLACE FUNCTION requesting_user_id()
RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$ LANGUAGE sql STABLE;

-- 6. Create the new Clerk-based RLS policy for reading
-- Clerk Supabase JWTs inject the user ID into request.jwt.claims->>'sub'
CREATE POLICY "users can view their own analyses"
  ON public.analyses
  FOR SELECT
  USING (
    -- Allow the user who owns it
    requesting_user_id() = user_id
    OR 
    -- Or allow if it has no user_id (anonymous/public reports from before auth was added)
    user_id IS NULL
  );

-- 7. Create policy for inserting analyses
CREATE POLICY "users can insert their own analyses"
  ON public.analyses
  FOR INSERT
  WITH CHECK (
    -- Allow insertion if requesting user matches user_id
    requesting_user_id() = user_id
    OR
    -- Allow anonymous insertions if no user is logged in
    (requesting_user_id() IS NULL AND user_id IS NULL)
  );

-- 8. Create policy for deleting analyses
CREATE POLICY "users can delete their own analyses"
  ON public.analyses
  FOR DELETE
  USING (
    requesting_user_id() = user_id
  );
