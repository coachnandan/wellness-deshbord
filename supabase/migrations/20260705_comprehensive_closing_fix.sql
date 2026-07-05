-- ============================================================
-- COMPREHENSIVE FIX: Closing visit_date + missing records
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Shift ALL auto-inserted closing records forward by 1 day
-- (covers both 'Auto' from client and 'System Auto-Sync' from pg_cron)
-- Only shifts records that still match the visitor's original visit_date
-- (i.e., not yet corrected)
UPDATE public.closing c
SET
  visit_date  = (c.visit_date::date + INTERVAL '1 day')::date,
  updated_at  = now()
WHERE
  -- created by any auto process (not manual staff)
  c.created_by_user_name IN ('Auto', 'System Auto-Sync')
  -- only where visit_date still equals the visitor's visit_date (not yet shifted)
  AND EXISTS (
    SELECT 1 FROM public.visitor_logs v
    WHERE v.id = c.visitor_id
      AND v.visit_date::date = c.visit_date::date
  );

-- STEP 2: Insert any visitors that are ≥ 24h old but missing from closing entirely
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
  v.id, v.visitor_name, v.mobile_number,
  (v.visit_date::date + INTERVAL '1 day')::date,  -- closing date = day after visit
  NULLIF(v.visit_time, '')::time,
  'Pending',
  'Pending',
  now(),
  now(),
  'Auto'
FROM public.visitor_logs v
WHERE
  -- visitor is at least 24h old
  (v.created_at < now() - INTERVAL '24 hours'
   OR v.visit_date < CURRENT_DATE)
  -- not already in closing
  AND NOT EXISTS (
    SELECT 1 FROM public.closing c
    WHERE c.visitor_id = v.id
  )
ON CONFLICT (visitor_id) DO NOTHING;

-- STEP 3: Verify the result
SELECT
  c.visit_date,
  COUNT(*) AS closing_count,
  COUNT(CASE WHEN c.created_by_user_name = 'Auto' THEN 1 END) AS auto_count,
  COUNT(CASE WHEN c.created_by_user_name = 'System Auto-Sync' THEN 1 END) AS sys_count
FROM public.closing c
GROUP BY c.visit_date
ORDER BY c.visit_date DESC
LIMIT 10;
