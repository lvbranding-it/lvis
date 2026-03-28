-- Add 'unit' (pay-per-analysis) to the subscription_tier enum
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'unit';

-- Track pre-purchased analysis credits for unit-plan users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS analysis_credits INTEGER NOT NULL DEFAULT 0;

-- Atomic increment helper used by the Wave webhook on unit payment
CREATE OR REPLACE FUNCTION increment_analysis_credits(p_user_id uuid, p_amount int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET analysis_credits = analysis_credits + p_amount
  WHERE id = p_user_id;
$$;
