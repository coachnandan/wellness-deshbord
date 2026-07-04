-- Migration: 20260703_cleanup_unused_tables
-- Purpose: Drop unused tables 'members' and 'closings'

-- Drop the unused 'closings' table (which was replaced by 'closing')
DROP TABLE IF EXISTS public.closings CASCADE;

-- Drop the unused 'members' table (which was replaced by 'clients')
-- Along with its trigger and sequence
DROP TABLE IF EXISTS public.members CASCADE;
DROP FUNCTION IF EXISTS public.update_members_updated_at() CASCADE;
DROP SEQUENCE IF EXISTS public.members_id_seq CASCADE;
DROP FUNCTION IF EXISTS public.generate_member_id() CASCADE;
