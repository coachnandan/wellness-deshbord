-- Migration: Add Shake attendance status
-- Date: 2026-06-06

-- 1. Drop the restrictive CHECK constraint and recreate it to include 'Shake'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'attendance'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%status%'
  ) THEN
    ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
  END IF;
END $$;

ALTER TABLE public.attendance
  ADD CONSTRAINT attendance_status_check
  CHECK (status IN ('Present', 'Absent', 'Leave', 'Pending', 'Shake'));

-- Force API Schema cache reload
NOTIFY pgrst, 'reload schema';
