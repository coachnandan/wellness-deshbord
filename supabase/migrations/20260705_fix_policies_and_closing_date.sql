-- Run this in Supabase SQL Editor to fix the duplicate policy error
-- Safe to run even if policies already exist

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

-- Also run the date-fix update (shift auto-carried records forward by 1 day)
UPDATE closing c
SET visit_date = (c.visit_date::date + INTERVAL '1 day')::date,
    updated_at  = now()
WHERE c.created_by_user_name = 'Auto'
  AND EXISTS (
    SELECT 1 FROM visitors v
    WHERE v.id = c.visitor_id
      AND v.visit_date::date = c.visit_date::date
  );
