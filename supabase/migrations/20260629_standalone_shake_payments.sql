-- Migration: 20260629_standalone_shake_payments
-- Purpose: Add payment tracking to membership_usage_logs to support non-member Shake billing

-- 1. Add payment tracking columns to membership_usage_logs
ALTER TABLE public.membership_usage_logs 
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'Paid';

-- Note: membership_id is already nullable by default in PostgreSQL 
-- foreign key declarations unless explicitly marked NOT NULL.
