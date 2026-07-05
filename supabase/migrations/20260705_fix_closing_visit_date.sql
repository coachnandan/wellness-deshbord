-- Fix auto-carried closing records: closing date should be visit_date + 1 day
-- (i.e., the follow-up date is the day AFTER the visitor came)
-- Only updates rows that were auto-inserted (created_by_user_name = 'Auto')
-- and where visit_date is NOT already shifted (i.e., it matches the original visitor's visit_date)

UPDATE closing c
SET visit_date = (c.visit_date::date + INTERVAL '1 day')::date,
    updated_at  = now()
WHERE c.created_by_user_name = 'Auto'
  AND EXISTS (
    SELECT 1 FROM visitors v
    WHERE v.id = c.visitor_id
      AND v.visit_date::date = c.visit_date::date  -- still on original date, not yet shifted
  );
