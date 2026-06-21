-- ============================================================
-- FIX: Membership Delete RLS Policy
-- Run this in: Supabase Dashboard > SQL Editor
-- Project: https://ixvgkkrlykjdvgdeiqmi.supabase.co
-- ============================================================

-- Step 1: Drop the old admin-only DELETE policy
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;

-- Step 2: Drop the old admin-only UPDATE policy (optional but recommended)
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;

-- Step 3: Create a new policy allowing ALL authenticated users to delete memberships
CREATE POLICY "Authenticated users can delete memberships"
ON public.memberships
FOR DELETE
USING (auth.role() = 'authenticated');

-- Step 4: Create a new policy allowing ALL authenticated users to update memberships
CREATE POLICY "Authenticated users can update memberships"
ON public.memberships
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Verify the new policies are in place
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'memberships'
ORDER BY cmd;
