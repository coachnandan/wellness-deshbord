-- Add remark column to attendance table
-- Stores membership-related remarks: S, SB, SF for Afresh (AF) and Active members

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance'
      AND column_name = 'remark'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN remark TEXT DEFAULT NULL;
  END IF;
END $$;
