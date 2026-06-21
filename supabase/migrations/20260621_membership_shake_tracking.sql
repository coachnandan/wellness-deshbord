-- 1. Add remaining_days to memberships table
ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS remaining_days integer DEFAULT 0;

-- 2. Create membership_usage_logs table for tracking shake consumption
CREATE TABLE IF NOT EXISTS public.membership_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id uuid REFERENCES public.memberships(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name text,
    membership_plan text,
    used_day integer,
    remaining_days integer,
    shake_timestamp timestamptz DEFAULT now(),
    updated_by_user_id uuid,
    updated_by_name text
);

-- 3. RLS Policies for membership_usage_logs
ALTER TABLE public.membership_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select membership_usage_logs" 
ON public.membership_usage_logs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert membership_usage_logs" 
ON public.membership_usage_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
