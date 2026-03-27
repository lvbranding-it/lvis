-- LVIS™ — Wave Apps Integration
-- Migration 006
-- Adds Wave customer/invoice tracking columns.
-- Stripe columns are kept (nullable) for reference — not used after this migration.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wave_customer_id TEXT;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS wave_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS wave_invoice_id  TEXT;
