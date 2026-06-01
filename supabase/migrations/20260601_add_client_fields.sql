-- Migration: Add all required fields to clients table for Anandam Wellness
-- Date: 2026-06-01

-- Add missing columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS mobile_number TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS dob DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
  ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
  ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS member_type TEXT CHECK (member_type IN ('Coach', 'Member')),
  ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Update address column type from JSONB to TEXT if needed (drop default)
ALTER TABLE public.clients ALTER COLUMN address DROP DEFAULT;

-- Copy existing data from name/contact to new fields if they exist
UPDATE public.clients SET 
  full_name = COALESCE(full_name, name),
  mobile_number = COALESCE(mobile_number, contact)
WHERE full_name IS NULL OR mobile_number IS NULL;

-- Make full_name and mobile_number required after migration
ALTER TABLE public.clients ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN mobile_number SET NOT NULL;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON public.clients(full_name);
CREATE INDEX IF NOT EXISTS idx_clients_mobile_number ON public.clients(mobile_number);
CREATE INDEX IF NOT EXISTS idx_clients_joining_date ON public.clients(joining_date);

-- End of migration
