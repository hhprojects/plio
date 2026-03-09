-- RLS policies for the modular redesign tables (00025).
-- Reuses helper functions from 00013: get_user_tenant_ids(), get_user_role(tenant_id).

-- =============================================================================
-- 1. Enable RLS on all new tables
-- =============================================================================

ALTER TABLE modules              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_dependents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_availability    ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE services             ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_notes        ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. modules (system registry — readable by everyone)
-- =============================================================================

CREATE POLICY "modules_select" ON modules
  FOR SELECT USING (true);

-- =============================================================================
-- 3. tenant_modules
-- =============================================================================

CREATE POLICY "tenant_modules_select" ON tenant_modules
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "tenant_modules_insert" ON tenant_modules
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "tenant_modules_update" ON tenant_modules
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "tenant_modules_delete" ON tenant_modules
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 4. contacts
-- =============================================================================

CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 5. contact_dependents (same as contacts)
-- =============================================================================

CREATE POLICY "contact_dependents_select" ON contact_dependents
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "contact_dependents_insert" ON contact_dependents
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "contact_dependents_update" ON contact_dependents
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "contact_dependents_delete" ON contact_dependents
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 6. team_members
-- =============================================================================

CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 7. team_availability
-- =============================================================================

CREATE POLICY "team_availability_select" ON team_availability
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "team_availability_insert" ON team_availability
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "team_availability_update" ON team_availability
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "team_availability_delete" ON team_availability
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

-- =============================================================================
-- 8. availability_overrides (same as team_availability)
-- =============================================================================

CREATE POLICY "availability_overrides_select" ON availability_overrides
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "availability_overrides_insert" ON availability_overrides
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "availability_overrides_update" ON availability_overrides
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "availability_overrides_delete" ON availability_overrides
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

-- =============================================================================
-- 9. services
-- =============================================================================

CREATE POLICY "services_select" ON services
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "services_insert" ON services
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "services_update" ON services
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "services_delete" ON services
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 10. schedules (same as services)
-- =============================================================================

CREATE POLICY "schedules_select" ON schedules
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "schedules_insert" ON schedules
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "schedules_update" ON schedules
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

CREATE POLICY "schedules_delete" ON schedules
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 11. sessions
-- =============================================================================

CREATE POLICY "sessions_select" ON sessions
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "sessions_delete" ON sessions
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 12. enrollments (same as sessions)
-- =============================================================================

CREATE POLICY "enrollments_select" ON enrollments
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "enrollments_insert" ON enrollments
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "enrollments_update" ON enrollments
  FOR UPDATE USING (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

CREATE POLICY "enrollments_delete" ON enrollments
  FOR DELETE USING (get_user_role(tenant_id) IN ('super_admin', 'admin'));

-- =============================================================================
-- 13. contact_notes (append-only: SELECT + INSERT only)
-- =============================================================================

CREATE POLICY "contact_notes_select" ON contact_notes
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "contact_notes_insert" ON contact_notes
  FOR INSERT WITH CHECK (get_user_role(tenant_id) IN ('super_admin', 'admin', 'staff'));

-- =============================================================================
-- 14. Anon policies (public booking page)
-- =============================================================================

CREATE POLICY "anon_services_select" ON services
  FOR SELECT TO anon USING (active = true);

CREATE POLICY "anon_team_members_select" ON team_members
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_team_availability_select" ON team_availability
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_availability_overrides_select" ON availability_overrides
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_sessions_select" ON sessions
  FOR SELECT TO anon USING (true);
