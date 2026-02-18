-- RLS policies for wellness-mode tables.
-- Reuses helper functions from 00013_rls_policies.sql.
-- Note: get_user_role(tenant_id) and get_user_profile_id(tenant_id) require the
-- tenant_id column as an argument — matching the signatures from 00013.

-- ==================== SERVICES ====================
CREATE POLICY "super_admin_services" ON services
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_services_all" ON services
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) IN ('admin', 'super_admin')
  );

CREATE POLICY "practitioner_services_select" ON services
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) = 'practitioner'
  );

CREATE POLICY "anon_services_select" ON services
  FOR SELECT TO anon
  USING (is_active = true);

-- ==================== CLIENTS ====================
CREATE POLICY "super_admin_clients" ON clients
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_clients_all" ON clients
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) IN ('admin', 'super_admin')
  );

CREATE POLICY "practitioner_clients_select" ON clients
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) = 'practitioner'
  );

CREATE POLICY "anon_clients_insert" ON clients
  FOR INSERT TO anon
  WITH CHECK (true);

-- ==================== PRACTITIONER AVAILABILITY ====================
CREATE POLICY "super_admin_availability" ON practitioner_availability
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_availability_all" ON practitioner_availability
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) IN ('admin', 'super_admin')
  );

CREATE POLICY "practitioner_availability_own" ON practitioner_availability
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) = 'practitioner'
    AND practitioner_id = get_user_profile_id(tenant_id)
  );

CREATE POLICY "anon_availability_select" ON practitioner_availability
  FOR SELECT TO anon
  USING (true);

-- ==================== AVAILABILITY OVERRIDES ====================
CREATE POLICY "super_admin_overrides" ON availability_overrides
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_overrides_all" ON availability_overrides
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) IN ('admin', 'super_admin')
  );

CREATE POLICY "practitioner_overrides_own" ON availability_overrides
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) = 'practitioner'
    AND practitioner_id = get_user_profile_id(tenant_id)
  );

CREATE POLICY "anon_overrides_select" ON availability_overrides
  FOR SELECT TO anon
  USING (true);

-- ==================== APPOINTMENTS ====================
CREATE POLICY "super_admin_appointments" ON appointments
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_appointments_all" ON appointments
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) IN ('admin', 'super_admin')
  );

CREATE POLICY "practitioner_appointments_select" ON appointments
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) = 'practitioner'
    AND practitioner_id = get_user_profile_id(tenant_id)
  );

CREATE POLICY "practitioner_appointments_update" ON appointments
  FOR UPDATE USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) = 'practitioner'
    AND practitioner_id = get_user_profile_id(tenant_id)
  );

CREATE POLICY "anon_appointments_insert" ON appointments
  FOR INSERT TO anon
  WITH CHECK (true);

-- ==================== CLIENT NOTES ====================
CREATE POLICY "super_admin_client_notes" ON client_notes
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_client_notes_select" ON client_notes
  FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) IN ('admin', 'super_admin')
  );

CREATE POLICY "admin_client_notes_delete" ON client_notes
  FOR DELETE USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) IN ('admin', 'super_admin')
  );

CREATE POLICY "practitioner_client_notes_all" ON client_notes
  FOR ALL USING (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND get_user_role(tenant_id) = 'practitioner'
    AND practitioner_id = get_user_profile_id(tenant_id)
  );
