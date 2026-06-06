-- Migration: Attendance Final Update & Lock System
-- Date: 2026-06-06

-- 1. Create attendance_locks table
CREATE TABLE IF NOT EXISTS public.attendance_locks (
  date DATE PRIMARY KEY,
  locked_by_user_id UUID,
  locked_by_name TEXT,
  locked_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
  is_locked BOOLEAN DEFAULT TRUE
);

-- Enable RLS for the locks table
ALTER TABLE public.attendance_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read attendance locks" ON public.attendance_locks;
DROP POLICY IF EXISTS "Authenticated users can insert attendance locks" ON public.attendance_locks;

CREATE POLICY "Anyone can read attendance locks" 
  ON public.attendance_locks FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert attendance locks" 
  ON public.attendance_locks FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Create Trigger Function to block modifications on locked dates
CREATE OR REPLACE FUNCTION public.check_attendance_lock()
RETURNS TRIGGER AS $$
DECLARE
  target_date DATE;
  lock_exists BOOLEAN;
BEGIN
  -- Determine the date being modified/inserted based on the operation
  IF TG_OP = 'DELETE' THEN
    target_date := OLD.date;
  ELSE
    target_date := NEW.date;
  END IF;

  -- Check if a lock exists for this date
  SELECT EXISTS (
    SELECT 1 FROM public.attendance_locks 
    WHERE date = target_date AND is_locked = TRUE
  ) INTO lock_exists;

  IF lock_exists THEN
    RAISE EXCEPTION 'ATTENDANCE_LOCKED: Attendance for % has been finalized and locked.', target_date;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply Trigger to attendance table
DROP TRIGGER IF EXISTS enforce_attendance_lock_trigger ON public.attendance;
CREATE TRIGGER enforce_attendance_lock_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.check_attendance_lock();

-- 4. Reload API schema cache
NOTIFY pgrst, 'reload schema';
