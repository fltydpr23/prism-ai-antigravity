-- Enable the uuid-ossp extension for UUID generation (if not exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the workspaces table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies (Drop if they exist, to avoid errors if we rerun)
DROP POLICY IF EXISTS "Users can view their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can insert their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON public.workspaces;

CREATE POLICY "Users can view their own workspaces" ON public.workspaces FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can insert their own workspaces" ON public.workspaces FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can update their own workspaces" ON public.workspaces FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can delete their own workspaces" ON public.workspaces FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);

-- Add workspace_id to analyses table
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Add branding columns to workspaces table
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS brand_color TEXT;

-- Update RLS for analyses to allow access based on workspace_id
-- We assume the user has access to analyses in their workspaces.
-- (If workspace_id is null, fallback to user_id)

-- First, drop the old policy if it exists (assuming we didn't have one or want to ensure a clean slate).
-- DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;

CREATE POLICY "Users can view analyses in their workspaces or their own" ON public.analyses FOR SELECT USING (
    ((auth.jwt() ->> 'sub') = user_id) OR
    (workspace_id IS NOT NULL AND EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.user_id = (auth.jwt() ->> 'sub')))
);

CREATE POLICY "Users can insert analyses in their workspaces or their own" ON public.analyses FOR INSERT WITH CHECK (
    ((auth.jwt() ->> 'sub') = user_id) OR
    (workspace_id IS NOT NULL AND EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.user_id = (auth.jwt() ->> 'sub')))
);
