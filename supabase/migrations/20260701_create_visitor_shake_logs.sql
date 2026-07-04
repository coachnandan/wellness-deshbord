-- Migration: 20260701_create_visitor_shake_logs
-- Purpose: Add a separate table to track Shake purchases for visitors

CREATE TABLE IF NOT EXISTS public.visitor_shake_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID REFERENCES public.visitor_logs(id) ON DELETE CASCADE,
  visitor_name TEXT,
  shake_type TEXT,
  amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'Paid',
  advance_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.visitor_shake_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can select visitor_shake_logs"
  ON public.visitor_shake_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert visitor_shake_logs"
  ON public.visitor_shake_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update visitor_shake_logs"
  ON public.visitor_shake_logs FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete visitor_shake_logs"
  ON public.visitor_shake_logs FOR DELETE
  USING (auth.role() = 'authenticated');

-- Enable realtime
ALTER TABLE public.visitor_shake_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'visitor_shake_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_shake_logs;
  END IF;
END $$;
