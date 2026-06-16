-- Enable the uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the tables (if they don't exist)
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    user_id TEXT NOT NULL, -- Clerk user ID
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- CREATE POLICIES
-- We use Clerk JWT so `auth.jwt() ->> 'sub'` extracts the Clerk user ID.

-- Workspaces Policies
CREATE POLICY "Users can view their own workspaces" ON workspaces FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can insert their own workspaces" ON workspaces FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can update their own workspaces" ON workspaces FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can delete their own workspaces" ON workspaces FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);

-- Uploads Policies
CREATE POLICY "Users can view their own uploads" ON uploads FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can insert their own uploads" ON uploads FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can delete their own uploads" ON uploads FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);

-- Reports Policies
CREATE POLICY "Users can view their own reports" ON reports FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can insert their own reports" ON reports FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);
CREATE POLICY "Users can delete their own reports" ON reports FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);

-- Organizations and Projects (linked to workspace ownership)
CREATE POLICY "Users can view organizations in their workspaces" ON organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM workspaces w WHERE w.id = organizations.workspace_id AND w.user_id = (auth.jwt() ->> 'sub'))
);
CREATE POLICY "Users can insert orgs" ON organizations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM workspaces w WHERE w.id = workspace_id AND w.user_id = (auth.jwt() ->> 'sub'))
);

CREATE POLICY "Users can view projects" ON projects FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM organizations o JOIN workspaces w ON w.id = o.workspace_id
        WHERE o.id = projects.organization_id AND w.user_id = (auth.jwt() ->> 'sub')
    )
);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM organizations o JOIN workspaces w ON w.id = o.workspace_id
        WHERE o.id = organization_id AND w.user_id = (auth.jwt() ->> 'sub')
    )
);
