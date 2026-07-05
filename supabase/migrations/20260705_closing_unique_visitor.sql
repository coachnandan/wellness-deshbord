-- Ensure unique constraint on closing(visitor_id) to prevent duplicate rows
-- during auto carry-forward (safe to run multiple times)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'closing_visitor_id_key'
      AND  conrelid = 'public.closing'::regclass
  ) THEN
    ALTER TABLE public.closing
      ADD CONSTRAINT closing_visitor_id_key UNIQUE (visitor_id);
  END IF;
END;
$$;
