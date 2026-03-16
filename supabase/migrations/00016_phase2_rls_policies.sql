-- Migration: 00016_phase2_rls_policies
-- Description: RLS policies for waitlist and invitations tables

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- WAITLIST policies
-- ============================================================================

-- Anyone can submit a waitlist entry (uses service role in practice, but allow anon inserts)
CREATE POLICY "waitlist_insert_public"
  ON waitlist FOR INSERT
  WITH CHECK (true);

-- Only super_admin can view waitlist
CREATE POLICY "waitlist_select_super_admin"
  ON waitlist FOR SELECT
  USING (public.is_super_admin());

-- Only super_admin can update waitlist (approve/reject)
CREATE POLICY "waitlist_update_super_admin"
  ON waitlist FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ============================================================================
-- INVITATIONS policies
-- ============================================================================

-- Admin within tenant and super_admin can see invitations
CREATE POLICY "invitations_select"
  ON invitations FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Admin within tenant and super_admin can create invitations
CREATE POLICY "invitations_insert"
  ON invitations FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Admin within tenant and super_admin can update invitations (resend, revoke)
CREATE POLICY "invitations_update"
  ON invitations FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );
