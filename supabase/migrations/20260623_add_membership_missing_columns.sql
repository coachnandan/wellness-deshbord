-- Migration: Add missing columns to memberships table
-- Date: 2026-06-23
-- Adds remaining_days, extra_type, extra_charge columns that are used in the app
-- but were missing from the schema cache.

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS remaining_days      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_type          TEXT,
  ADD COLUMN IF NOT EXISTS extra_charge        NUMERIC DEFAULT 0;

-- Backfill remaining_days from duration_days for existing records
UPDATE public.memberships
  SET remaining_days = duration_days
  WHERE remaining_days = 0 AND duration_days IS NOT NULL;

-- Force PostgREST schema reload so the new columns appear immediately
NOTIFY pgrst, 'reload schema';
