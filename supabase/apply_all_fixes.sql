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

-- Verification: Show all policies on memberships
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'memberships'
ORDER BY cmd;
