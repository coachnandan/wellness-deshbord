-- Migration: Automatic attendance marking
-- Date: 2026-06-06

-- 1. Add 'source' column to track whether attendance was Manual or Auto-Marked
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual';

-- 2. Create function to automatically mark absences
CREATE OR REPLACE FUNCTION public.auto_mark_absences(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO public.attendance (client_id, date, status, marked_by_name, source, client_name)
  SELECT 
    c.id, 
    target_date, 
    'Absent', 
    'System', 
    'Auto-Marked',
    c.name
  FROM public.clients c
  WHERE c.status = 'Active' 
    AND NOT EXISTS (
      SELECT 1 FROM public.attendance a 
      WHERE a.client_id = c.id AND a.date = target_date
    )
  ON CONFLICT (client_id, date) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 3. (Optional) Schedule the job if pg_cron is enabled
-- You can run this block manually in Supabase SQL editor if pg_cron is available
/*
SELECT cron.schedule(
  'auto_mark_absences_job',
  '59 23 * * *', -- Run at 23:59 every day (adjust timezone as needed for your project)
  $$ SELECT public.auto_mark_absences((CURRENT_DATE AT TIME ZONE 'UTC')::date); $$
);
*/
