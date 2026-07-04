-- Add missing payment columns to attendance table
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid';

-- Force schema reload
NOTIFY pgrst, 'reload schema';
