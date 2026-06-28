-- Add necessary columns for Razorpay Subscriptions and Trial Engine
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50);
