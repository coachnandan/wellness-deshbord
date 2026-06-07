-- Migration: Add notes column to clients, fix RLS for enrollment flow
-- Date: 2026-06-08

-- 1. Add notes column to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Fix attendance INSERT policy - allow all authenticated users (not just admins)
--    The existing "Admins can insert attendance" blocks non-admin enrollment
DROP POLICY IF EXISTS "Admins can insert attendance" ON public.attendance;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can insert attendance"
    ON public.attendance FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN
  -- Policy already exists, skip
  NULL;
END $$;

-- 3. Create membership_activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.membership_activity_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id        uuid REFERENCES public.memberships(id) ON DELETE CASCADE,
  client_id            uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  action_type          text NOT NULL,
  action_description   text,
  performed_by_user_id uuid,
  performed_by_name    text,
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mal_membership_id ON public.membership_activity_logs(membership_id);
CREATE INDEX IF NOT EXISTS idx_mal_client_id ON public.membership_activity_logs(client_id);

-- 4. Add RLS policies for membership_activity_logs
ALTER TABLE public.membership_activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can select membership_activity_logs"
    ON public.membership_activity_logs FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can insert membership_activity_logs"
    ON public.membership_activity_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 5. Ensure payment tracking columns exist in memberships
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS total_amount          numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_amount        numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount      numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status_detail text DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS created_by_user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_name       TEXT,
  ADD COLUMN IF NOT EXISTS client_name           TEXT;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
