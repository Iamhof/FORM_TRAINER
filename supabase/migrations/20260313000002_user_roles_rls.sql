-- Migration: Enable RLS on user_roles and restrict write access
-- Why: RLS was never enabled on this table. Any authenticated user can INSERT/UPDATE
-- themselves to admin/PT role. The SELECT policy from 20250116 exists but is not
-- enforced because ALTER TABLE ... ENABLE ROW LEVEL SECURITY was never run.

-- Enable RLS (this activates the existing SELECT policy too)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Prevent authenticated users from inserting, updating, or deleting roles.
-- Only service_role (via supabaseAdmin in backend) can manage roles.
DROP POLICY IF EXISTS "Deny all inserts for authenticated" ON public.user_roles;
CREATE POLICY "Deny all inserts for authenticated"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all updates for authenticated" ON public.user_roles;
CREATE POLICY "Deny all updates for authenticated"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny all deletes for authenticated" ON public.user_roles;
CREATE POLICY "Deny all deletes for authenticated"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);
