-- Add necessary columns for Razorpay subscriptions and credits
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Ensure 'tier' column exists (it should, as per clerk webhook)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(50) DEFAULT 'explorer';
