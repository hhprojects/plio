-- Migration: 00019_invoices_payments_rls
-- Description: RLS policies for invoices and payments tables

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INVOICES policies
-- ============================================================================

-- Admin/super_admin can SELECT all invoices within their tenant
CREATE POLICY "invoices_select_admin"
  ON invoices FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Parents can SELECT their own invoices
CREATE POLICY "invoices_select_parent"
  ON invoices FOR SELECT
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    AND parent_id = public.get_user_profile_id(tenant_id)
  );

-- Admin/super_admin can INSERT invoices
CREATE POLICY "invoices_insert_admin"
  ON invoices FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Admin/super_admin can UPDATE invoices
CREATE POLICY "invoices_update_admin"
  ON invoices FOR UPDATE
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

-- Admin/super_admin can DELETE invoices (only drafts in practice, enforced in app)
CREATE POLICY "invoices_delete_admin"
  ON invoices FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- PAYMENTS policies
-- ============================================================================

-- Admin/super_admin can SELECT all payments within their tenant
CREATE POLICY "payments_select_admin"
  ON payments FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Parents can SELECT their own payments (via invoice ownership)
CREATE POLICY "payments_select_parent"
  ON payments FOR SELECT
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    AND invoice_id IN (
      SELECT id FROM invoices
      WHERE parent_id = public.get_user_profile_id(payments.tenant_id)
    )
  );

-- Admin/super_admin can INSERT payments (mark as paid)
CREATE POLICY "payments_insert_admin"
  ON payments FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Admin/super_admin can UPDATE payments (verify/reject)
CREATE POLICY "payments_update_admin"
  ON payments FOR UPDATE
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
