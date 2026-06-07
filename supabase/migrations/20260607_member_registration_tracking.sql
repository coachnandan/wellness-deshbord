-- Migration: Member Registration Date-Wise Tracking
-- Date: 2026-06-07
-- Purpose: Store registration date (IST), time (IST), created_by_user_id, created_by_name
--          for every new member. Enables date-wise filtering and reporting.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add tracking columns to clients table
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS registration_date       DATE,
  ADD COLUMN IF NOT EXISTS registration_time_ist   TEXT,
  ADD COLUMN IF NOT EXISTS created_by_name         TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Back-fill existing rows using created_at converted to IST
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.clients
SET
  registration_date = (created_at AT TIME ZONE 'Asia/Kolkata')::DATE,
  registration_time_ist = TO_CHAR(
    created_at AT TIME ZONE 'Asia/Kolkata',
    'HH12:MI AM'
  )
WHERE registration_date IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Auto-populate registration_date & registration_time_ist on INSERT
--    (in case the application does not supply them)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_client_registration_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_date IS NULL THEN
    NEW.registration_date := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
  END IF;
  IF NEW.registration_time_ist IS NULL THEN
    NEW.registration_time_ist := TO_CHAR(
      NOW() AT TIME ZONE 'Asia/Kolkata',
      'HH12:MI AM'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_registration_fields ON public.clients;

CREATE TRIGGER trg_client_registration_fields
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_client_registration_fields();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Performance indexes for date-wise filtering & reporting
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clients_registration_date
  ON public.clients(registration_date DESC);

CREATE INDEX IF NOT EXISTS idx_clients_created_by_name
  ON public.clients(created_by_name);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Column comments for documentation
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON COLUMN public.clients.registration_date IS
  'Date the member was registered, in IST (Asia/Kolkata). Used for date-wise grouping and filtering.';

COMMENT ON COLUMN public.clients.registration_time_ist IS
  'Time the member was registered, formatted as HH:MM AM/PM in IST.';

COMMENT ON COLUMN public.clients.created_by_name IS
  'Display name of the staff member / admin who registered this client.';

-- End of migration
