-- ============================================================
-- COMBINED FIX SCRIPT
-- Run this ONCE in: Supabase Dashboard > SQL Editor
-- Project: https://ixvgkkrlykjdvgdeiqmi.supabase.co
-- ============================================================

-- 1. Fix memberships DELETE/UPDATE RLS (allows all authenticated users)
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;

CREATE POLICY "Authenticated users can delete memberships"
  ON public.memberships FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update memberships"
  ON public.memberships FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 2. Create membership_usage_logs table for Shake tracking
CREATE TABLE IF NOT EXISTS public.membership_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID REFERENCES public.memberships(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  membership_plan TEXT,
  used_day INTEGER,
  remaining_days INTEGER,
  shake_date DATE DEFAULT CURRENT_DATE,
  shake_time_ist TEXT,
  updated_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on new table
ALTER TABLE public.membership_usage_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for membership_usage_logs
CREATE POLICY "Authenticated users can select usage logs"
  ON public.membership_usage_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert usage logs"
  ON public.membership_usage_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 5. Enable realtime on new table
ALTER TABLE public.membership_usage_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'membership_usage_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.membership_usage_logs;
  END IF;
END $$;

-- 6. Create closing table (Replaces old closings table)
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

-- Policies
CREATE POLICY "Authenticated users can select closing"
  ON public.closing FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert closing"
  ON public.closing FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update closing"
  ON public.closing FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete closing"
  ON public.closing FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create the auto-sync function
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
    (visit_date < CURRENT_DATE) OR (created_at < NOW() - INTERVAL '24 hours')
  ON CONFLICT (visitor_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
