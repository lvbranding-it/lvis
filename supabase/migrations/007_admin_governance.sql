-- LVIS™ — Admin Governance
-- Migration 007
-- Adds per-user quota override and an index to speed up usage queries.

-- analyses_override: NULL = use tier default, integer = admin-set custom limit
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS analyses_override INTEGER;

-- Speed up "count analyses for user this period" scans
CREATE INDEX IF NOT EXISTS idx_forensic_reviews_created_at
  ON public.forensic_reviews(created_at);

-- Unique constraint for usage_records so upsert works correctly
ALTER TABLE public.usage_records
  DROP CONSTRAINT IF EXISTS usage_records_user_period_unique;

ALTER TABLE public.usage_records
  ADD CONSTRAINT usage_records_user_period_unique
  UNIQUE (user_id, period_start);
