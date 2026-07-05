-- Enable pg_cron extension (requires superuser, might need to be enabled manually in Supabase UI first)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Create the new closing table
CREATE TABLE IF NOT EXISTS public.closing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID REFERENCES public.visitor_logs(id) ON DELETE CASCADE,
  visitor_name TEXT,
  contact_number TEXT,
  visit_date DATE,
  visit_time TIME,
  status TEXT DEFAULT 'Pending',
  selected_type TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_id UUID,
  created_by_user_name TEXT DEFAULT 'System Auto-Sync',
  UNIQUE (visitor_id)
);

-- Enable RLS
ALTER TABLE public.closing ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent — drop first so re-running is safe)
DROP POLICY IF EXISTS "Authenticated users can select closing" ON public.closing;
CREATE POLICY "Authenticated users can select closing"
  ON public.closing FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert closing" ON public.closing;
CREATE POLICY "Authenticated users can insert closing"
  ON public.closing FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update closing" ON public.closing;
CREATE POLICY "Authenticated users can update closing"
  ON public.closing FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete closing" ON public.closing;
CREATE POLICY "Authenticated users can delete closing"
  ON public.closing FOR DELETE
  USING (auth.role() = 'authenticated');

-- 2. Create the auto-sync function
CREATE OR REPLACE FUNCTION public.auto_sync_closings()
RETURNS void AS $$
BEGIN
  INSERT INTO public.closing (
    visitor_id,
    visitor_name,
    contact_number,
    visit_date,
    visit_time,
    status,
    selected_type,
    created_at,
    updated_at,
    created_by_user_name
  )
  SELECT 
    id,
    visitor_name,
    mobile_number,
    visit_date,
    visit_time,
    'Pending',
    'Pending',
    NOW(),
    NOW(),
    'System Auto-Sync'
  FROM public.visitor_logs
  WHERE 
    -- 24 hours logic: Visit date is before current date, or exactly 24 hours have passed since created_at
    (visit_date < CURRENT_DATE) OR (created_at < NOW() - INTERVAL '24 hours')
  ON CONFLICT (visitor_id) DO NOTHING; -- Ignore duplicates
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the function to run every hour using pg_cron
-- Note: If pg_cron is not enabled, this step will fail.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule('sync-closings-hourly', '0 * * * *', 'SELECT public.auto_sync_closings()');
  END IF;
END $$;
