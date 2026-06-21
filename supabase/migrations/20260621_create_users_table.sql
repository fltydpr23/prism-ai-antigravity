-- Create users table
create table if not exists public.users (
  id text primary key, -- Matches Clerk user ID
  email text not null,
  tier text not null default 'explorer',
  analyses_count integer not null default 0,
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.users enable row level security;

-- Policies
create policy "Users can view their own profile."
  on public.users for select
  using ( (auth.jwt() ->> 'sub') = id );

create policy "Users can update their own profile."
  on public.users for update
  using ( (auth.jwt() ->> 'sub') = id );

-- Only service role can insert (via webhook)
create policy "Service role can insert users."
  on public.users for insert
  with check ( true );

-- Only service role can delete (via webhook)
create policy "Service role can delete users."
  on public.users for delete
  using ( true );
