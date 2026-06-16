-- ============================================================
-- Prism Sprint 1 — SaaS Billing & Usage Tracking Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- ── 1. Subscriptions table ──────────────────────────────────
-- Tracks each user's active tier and billing details
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                   text NOT NULL UNIQUE,           -- Clerk user ID (sub)
  tier                      text NOT NULL DEFAULT 'free',   -- 'free' | 'starter' | 'pro' | 'agency' | 'enterprise'
  billing_period            text DEFAULT 'monthly',         -- 'monthly' | 'annual'
  razorpay_subscription_id  text,                           -- Razorpay payment/subscription ID
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "users can read own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (requesting_user_id() = user_id);

-- Service role only for writes (handled via server-side Supabase client)
-- No INSERT/UPDATE policy for users — billing writes go through the API

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);


-- ── 2. Usage events table ───────────────────────────────────
-- Granular event log per user per action — used for billing audit trails
CREATE TABLE IF NOT EXISTS public.usage_events (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     text NOT NULL,              -- Clerk user ID
  action      text NOT NULL,             -- 'analyse' | 'upload' | 'export'
  metadata    jsonb DEFAULT '{}',        -- e.g. { industry: "food", model: "gpt-oss", file_size_kb: 42 }
  created_at  timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own events
CREATE POLICY "users can read own usage events"
  ON public.usage_events
  FOR SELECT
  USING (requesting_user_id() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS usage_events_user_id_idx    ON public.usage_events (user_id);
CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON public.usage_events (created_at);
CREATE INDEX IF NOT EXISTS usage_events_action_idx     ON public.usage_events (user_id, action, created_at);


-- ── 3. Helper: auto-update updated_at on subscriptions ─────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ── 4. Helper: get_user_tier() ──────────────────────────────
-- Used by other DB functions to check a user's current tier
CREATE OR REPLACE FUNCTION public.get_user_tier(p_user_id text)
RETURNS text AS $$
  SELECT COALESCE(tier, 'free')
  FROM public.subscriptions
  WHERE user_id = p_user_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
