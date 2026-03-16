-- Migration: 00013_rls_policies
-- Description: Enable Row Level Security on ALL tables and create access policies.
--
-- Role hierarchy:
--   super_admin — can access ALL tenants (bypass tenant isolation)
--   admin       — full CRUD within own tenant
--   tutor       — read own classes, update attendance
--   parent      — manage own children and enrollments

-- ============================================================================
-- Helper function: get current user's profile info
-- ============================================================================

-- Returns the tenant_ids the current user belongs to
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid();
$$;

-- Returns the current user's role within a specific tenant
CREATE OR REPLACE FUNCTION public.get_user_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles
  WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
  LIMIT 1;
$$;

-- Returns whether the current user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Returns the profile id for the current user within a tenant
CREATE OR REPLACE FUNCTION public.get_user_profile_id(p_tenant_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles
  WHERE user_id = auth.uid() AND tenant_id = p_tenant_id
  LIMIT 1;
$$;

-- ============================================================================
-- Enable RLS on ALL tables
-- ============================================================================

ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_instances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANTS policies
-- ============================================================================

-- Users can see tenants they belong to
CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (
    id IN (SELECT public.get_user_tenant_ids())
    OR public.is_super_admin()
  );

-- Only super_admin can insert tenants
CREATE POLICY "tenants_insert_super_admin"
  ON tenants FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Only super_admin can update tenants (admin can update via app layer with service role)
CREATE POLICY "tenants_update_super_admin"
  ON tenants FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Only super_admin can delete tenants
CREATE POLICY "tenants_delete_super_admin"
  ON tenants FOR DELETE
  USING (public.is_super_admin());

-- ============================================================================
-- PROFILES policies
-- ============================================================================

-- Users can see profiles in their tenant; super_admin sees all
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR public.is_super_admin()
  );

-- Admin and super_admin can insert profiles in their tenant
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (
    (tenant_id IN (SELECT public.get_user_tenant_ids())
     AND public.get_user_role(tenant_id) IN ('admin', 'super_admin'))
    OR public.is_super_admin()
  );

-- Admin can update profiles in their tenant; users can update their own
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (
    (tenant_id IN (SELECT public.get_user_tenant_ids())
     AND (public.get_user_role(tenant_id) IN ('admin', 'super_admin')
          OR user_id = auth.uid()))
    OR public.is_super_admin()
  )
  WITH CHECK (
    (tenant_id IN (SELECT public.get_user_tenant_ids())
     AND (public.get_user_role(tenant_id) IN ('admin', 'super_admin')
          OR user_id = auth.uid()))
    OR public.is_super_admin()
  );

-- Only admin and super_admin can delete profiles
CREATE POLICY "profiles_delete"
  ON profiles FOR DELETE
  USING (
    (tenant_id IN (SELECT public.get_user_tenant_ids())
     AND public.get_user_role(tenant_id) IN ('admin', 'super_admin'))
    OR public.is_super_admin()
  );

-- ============================================================================
-- STUDENTS policies
-- ============================================================================

-- Admin: full access within tenant
-- Tutor: can see students enrolled in their classes
-- Parent: can see own children only

CREATE POLICY "students_select"
  ON students FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        -- Admin sees all students in tenant
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        -- Parent sees own children
        OR parent_id = public.get_user_profile_id(tenant_id)
        -- Tutor sees students enrolled in their classes
        OR EXISTS (
          SELECT 1 FROM enrollments e
          JOIN class_instances ci ON ci.id = e.class_instance_id
          WHERE e.student_id = students.id
            AND ci.tutor_id = public.get_user_profile_id(students.tenant_id)
        )
      )
    )
  );

CREATE POLICY "students_insert"
  ON students FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "students_update"
  ON students FOR UPDATE
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

CREATE POLICY "students_delete"
  ON students FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- COURSES policies
-- ============================================================================

-- Everyone in the tenant can read courses; only admin can mutate
CREATE POLICY "courses_select"
  ON courses FOR SELECT
  USING (
    public.is_super_admin()
    OR tenant_id IN (SELECT public.get_user_tenant_ids())
  );

CREATE POLICY "courses_insert"
  ON courses FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "courses_update"
  ON courses FOR UPDATE
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

CREATE POLICY "courses_delete"
  ON courses FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- ROOMS policies
-- ============================================================================

-- Everyone in tenant can read rooms; only admin can mutate
CREATE POLICY "rooms_select"
  ON rooms FOR SELECT
  USING (
    public.is_super_admin()
    OR tenant_id IN (SELECT public.get_user_tenant_ids())
  );

CREATE POLICY "rooms_insert"
  ON rooms FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "rooms_update"
  ON rooms FOR UPDATE
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

CREATE POLICY "rooms_delete"
  ON rooms FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- HOLIDAYS policies
-- ============================================================================

-- Everyone in tenant can read holidays; only admin can mutate
CREATE POLICY "holidays_select"
  ON holidays FOR SELECT
  USING (
    public.is_super_admin()
    OR tenant_id IN (SELECT public.get_user_tenant_ids())
  );

CREATE POLICY "holidays_insert"
  ON holidays FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "holidays_update"
  ON holidays FOR UPDATE
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

CREATE POLICY "holidays_delete"
  ON holidays FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- RECURRING_SCHEDULES policies
-- ============================================================================

-- Admin and tutors can read; only admin can mutate
CREATE POLICY "recurring_schedules_select"
  ON recurring_schedules FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        OR tutor_id = public.get_user_profile_id(tenant_id)
      )
    )
  );

CREATE POLICY "recurring_schedules_insert"
  ON recurring_schedules FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "recurring_schedules_update"
  ON recurring_schedules FOR UPDATE
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

CREATE POLICY "recurring_schedules_delete"
  ON recurring_schedules FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- CLASS_INSTANCES policies
-- ============================================================================

-- Admin: full access
-- Tutor: can see own assigned classes
-- Parent: can browse available classes (SELECT only)

CREATE POLICY "class_instances_select"
  ON class_instances FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        -- Tutor sees own classes
        OR tutor_id = public.get_user_profile_id(tenant_id)
        -- Parent can browse available classes
        OR public.get_user_role(tenant_id) = 'parent'
      )
    )
  );

CREATE POLICY "class_instances_insert"
  ON class_instances FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "class_instances_update"
  ON class_instances FOR UPDATE
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

CREATE POLICY "class_instances_delete"
  ON class_instances FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- ENROLLMENTS policies
-- ============================================================================

-- Admin: full access
-- Tutor: can see and update enrollments for their classes
-- Parent: can see, insert (makeup), update (cancel) enrollments for own children

CREATE POLICY "enrollments_select"
  ON enrollments FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        -- Tutor sees enrollments for their classes
        OR EXISTS (
          SELECT 1 FROM class_instances ci
          WHERE ci.id = enrollments.class_instance_id
            AND ci.tutor_id = public.get_user_profile_id(enrollments.tenant_id)
        )
        -- Parent sees enrollments for own children
        OR EXISTS (
          SELECT 1 FROM students s
          WHERE s.id = enrollments.student_id
            AND s.parent_id = public.get_user_profile_id(enrollments.tenant_id)
        )
      )
    )
  );

CREATE POLICY "enrollments_insert"
  ON enrollments FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        -- Parent can book makeup classes for own children
        OR (
          public.get_user_role(tenant_id) = 'parent'
          AND EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id
              AND s.parent_id = public.get_user_profile_id(enrollments.tenant_id)
          )
        )
      )
    )
  );

CREATE POLICY "enrollments_update"
  ON enrollments FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        -- Tutor can update attendance
        OR EXISTS (
          SELECT 1 FROM class_instances ci
          WHERE ci.id = enrollments.class_instance_id
            AND ci.tutor_id = public.get_user_profile_id(enrollments.tenant_id)
        )
        -- Parent can cancel own children's enrollments
        OR (
          public.get_user_role(tenant_id) = 'parent'
          AND EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = enrollments.student_id
              AND s.parent_id = public.get_user_profile_id(enrollments.tenant_id)
          )
        )
      )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM class_instances ci
          WHERE ci.id = enrollments.class_instance_id
            AND ci.tutor_id = public.get_user_profile_id(enrollments.tenant_id)
        )
        OR (
          public.get_user_role(tenant_id) = 'parent'
          AND EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = enrollments.student_id
              AND s.parent_id = public.get_user_profile_id(enrollments.tenant_id)
          )
        )
      )
    )
  );

CREATE POLICY "enrollments_delete"
  ON enrollments FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- CREDIT_LEDGER policies
-- ============================================================================

-- Admin: full access (insert/select)
-- Parent: can see own children's credit entries (select only)
-- No UPDATE or DELETE — this is an append-only ledger

CREATE POLICY "credit_ledger_select"
  ON credit_ledger FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        -- Parent sees credits for own children
        OR EXISTS (
          SELECT 1 FROM students s
          WHERE s.id = credit_ledger.student_id
            AND s.parent_id = public.get_user_profile_id(credit_ledger.tenant_id)
        )
      )
    )
  );

CREATE POLICY "credit_ledger_insert"
  ON credit_ledger FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- No UPDATE policy — credit_ledger is append-only
-- No DELETE policy — credit_ledger is append-only

-- ============================================================================
-- AUDIT_LOG policies
-- ============================================================================

-- Append-only: all authenticated users can INSERT (the app logs actions)
-- Only admin/super_admin can SELECT (read the audit trail)
-- No UPDATE or DELETE — audit logs are immutable

CREATE POLICY "audit_log_select"
  ON audit_log FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "audit_log_insert"
  ON audit_log FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR public.is_super_admin()
  );

-- No UPDATE policy — audit_log is immutable
-- No DELETE policy — audit_log is immutable

-- ============================================================================
-- NOTIFICATIONS policies
-- ============================================================================

-- Users can only see their own notifications
-- System (any authenticated user / service role) can insert notifications
-- Users can update their own notifications (mark as read)
-- No DELETE — notifications are retained

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        OR user_id = public.get_user_profile_id(tenant_id)
      )
    )
  );

CREATE POLICY "notifications_insert"
  ON notifications FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    OR public.is_super_admin()
  );

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND user_id = public.get_user_profile_id(tenant_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND user_id = public.get_user_profile_id(tenant_id)
    )
  );

-- No DELETE policy — notifications are retained
