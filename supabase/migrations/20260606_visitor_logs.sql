-- Migration: Visitor Logs Table (Updated with all visitor fields)
-- Date: 2026-06-06

-- 1. Create visitor_logs table with all visitor fields
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name TEXT NOT NULL,
  mobile_number TEXT,
  gender TEXT,
  age INTEGER,
  address TEXT,
  purpose TEXT,
  visit_date DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE,
  visit_time TEXT NOT NULL,
  notes TEXT,
  added_by_user_id UUID,
  added_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
);

-- 2. Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION public.visitor_logs_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW() AT TIME ZONE 'Asia/Kolkata';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS visitor_logs_updated_at_trigger ON public.visitor_logs;
CREATE TRIGGER visitor_logs_updated_at_trigger
  BEFORE UPDATE ON public.visitor_logs
  FOR EACH ROW EXECUTE FUNCTION public.visitor_logs_set_updated_at();

-- 3. Row Level Security
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read visitor logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Authenticated users can insert visitor logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Authenticated users can update visitor logs" ON public.visitor_logs;
DROP POLICY IF EXISTS "Authenticated users can delete visitor logs" ON public.visitor_logs;

CREATE POLICY "Anyone can read visitor logs"
  ON public.visitor_logs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert visitor logs"
  ON public.visitor_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update visitor logs"
  ON public.visitor_logs FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete visitor logs"
  ON public.visitor_logs FOR DELETE
  USING (auth.role() = 'authenticated');

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
