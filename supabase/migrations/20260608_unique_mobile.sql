-- Migration: Prevent duplicate member profiles by mobile number
-- Date: 2026-06-08

-- Add unique constraint on mobile_number (ignore duplicates already in DB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_mobile_number_unique'
  ) THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_mobile_number_unique UNIQUE (mobile_number);
  END IF;
END $$;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
