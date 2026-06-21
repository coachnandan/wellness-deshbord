-- Drop old restrictive update/delete policies for memberships
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;

-- Create new policies allowing all authenticated portal users (coaches/staff/admins) to update and delete
CREATE POLICY "Authenticated users can update memberships" 
ON public.memberships 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete memberships" 
ON public.memberships 
FOR DELETE 
USING (auth.role() = 'authenticated');
