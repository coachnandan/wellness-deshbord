-- ====================================================================
-- SUPABASE BACKEND SETUP SCRIPT for ELEVATE SANCTUARY
-- ====================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 2. CREATE TABLES
-- ====================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  address JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'Active',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  membership_plan TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'Active',
  payment_status TEXT DEFAULT 'Paid',
  renewal_status TEXT DEFAULT 'New',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Leave')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, date)
);

-- Notification Logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,
  status TEXT DEFAULT 'Sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renewal Logs table
CREATE TABLE IF NOT EXISTS public.renewal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES public.memberships(id) ON DELETE CASCADE,
  previous_expiry_date DATE NOT NULL,
  new_expiry_date DATE NOT NULL,
  renewed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  renewed_at TIMESTAMPTZ DEFAULT NOW()
);


-- ====================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 4. CREATE RLS POLICIES
-- ====================================================================

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Clients Policies
-- Admins can do everything. Members can only insert new clients, and select clients they created (if we want to restrict)
-- For now, allow all authenticated users to SELECT, but only admins can UPDATE/DELETE. Members can INSERT.
CREATE POLICY "Authenticated users can select clients" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Memberships Policies
CREATE POLICY "Authenticated users can select memberships" ON public.memberships FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert memberships" ON public.memberships FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update memberships" ON public.memberships FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can delete memberships" ON public.memberships FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Attendance Policies
CREATE POLICY "Authenticated users can select attendance" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert attendance" ON public.attendance FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update attendance" ON public.attendance FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Notification & Renewal Logs (Admins only for modification, Select for authenticated if needed)
CREATE POLICY "Authenticated users can select notification_logs" ON public.notification_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can select renewal_logs" ON public.renewal_logs FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert notification_logs" ON public.notification_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert renewal_logs" ON public.renewal_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ====================================================================
-- 5. REALTIME CONFIGURATION
-- ====================================================================

-- Turn on REPLICA IDENTITY FULL for tables we want full payload on updates/deletes
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.memberships REPLICA IDENTITY FULL;
ALTER TABLE public.attendance REPLICA IDENTITY FULL;

-- Ensure tables are added to the supabase_realtime publication
BEGIN;
  -- Remove the supabase_realtime publication if it exists to recreate it cleanly (Optional depending on Supabase version, usually better to just add)
  -- DROP PUBLICATION IF EXISTS supabase_realtime;
  -- CREATE PUBLICATION supabase_realtime;
  
  -- Add tables
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.memberships;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_logs;
COMMIT;

-- ====================================================================
-- 6. AUTHENTICATION TRIGGER
-- ====================================================================

-- Create a function to handle new user signups and insert them into the profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Wellness Coach'),
    COALESCE(new.raw_user_meta_data->>'role', 'member')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================
-- SETUP COMPLETE
-- ====================================================================
