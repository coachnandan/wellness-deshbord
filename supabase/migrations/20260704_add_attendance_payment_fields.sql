-- Migration: 20260704_add_attendance_payment_fields
-- Purpose: Add comprehensive payment tracking for all shake logs (including members and non-members)

ALTER TABLE public.membership_usage_logs 
  ADD COLUMN IF NOT EXISTS shake_type TEXT,
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';

-- Note: amount_paid and payment_status already exist from a previous migration.

-- Force PostgREST schema reload so the new columns appear immediately
NOTIFY pgrst, 'reload schema';
