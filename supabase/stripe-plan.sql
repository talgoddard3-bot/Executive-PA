-- Stripe + plan columns for user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'solo';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';

-- Company type for companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_type TEXT;
