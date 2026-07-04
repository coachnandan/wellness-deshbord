-- ============================================================
-- COMPLETE FIX: Create membership_usage_logs with payment fields
-- Run this ONCE in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Step 1: Create the table with ALL required columns (including payment fields)
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
  -- Payment tracking columns
  shake_type TEXT,
  amount_paid NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid',
  advance_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: If table already exists, add missing payment columns safely
ALTER TABLE public.membership_usage_logs ADD COLUMN IF NOT EXISTS shake_type TEXT;
ALTER TABLE public.membership_usage_logs ADD COLUMN IF NOT EXISTS amount_paid NUMERIC DEFAULT 0;
ALTER TABLE public.membership_usage_logs ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Paid';
ALTER TABLE public.membership_usage_logs ADD COLUMN IF NOT EXISTS advance_amount NUMERIC DEFAULT 0;
ALTER TABLE public.membership_usage_logs ADD COLUMN IF NOT EXISTS due_amount NUMERIC DEFAULT 0;
ALTER TABLE public.membership_usage_logs ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash';

-- Step 3: Enable RLS
ALTER TABLE public.membership_usage_logs ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old policies if they exist, then recreate
DROP POLICY IF EXISTS "Authenticated users can select usage logs" ON public.membership_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can insert usage logs" ON public.membership_usage_logs;
DROP POLICY IF EXISTS "Authenticated users can update usage logs" ON public.membership_usage_logs;

CREATE POLICY "Authenticated users can select usage logs"
  ON public.membership_usage_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert usage logs"
  ON public.membership_usage_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update usage logs"
  ON public.membership_usage_logs FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Step 5: Enable realtime
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

-- Step 6: Force PostgREST to reload schema (makes new columns visible immediately)
NOTIFY pgrst, 'reload schema';

-- Done! You should see: "Success. No rows returned"
