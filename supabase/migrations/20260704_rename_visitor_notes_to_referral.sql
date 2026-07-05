-- Migration: Rename visitor notes to referral
-- Date: 2026-07-04

ALTER TABLE public.visitor_logs RENAME COLUMN notes TO referral;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
