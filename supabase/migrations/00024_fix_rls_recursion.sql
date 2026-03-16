-- Fix infinite recursion between enrollments_select and students_select policies.
-- The cycle: enrollments_select queries students → students_select queries enrollments → loop.
-- Solution: SECURITY DEFINER functions bypass RLS, breaking the cycle.

-- Helper: check if a user is the tutor for a given class instance (bypasses RLS on class_instances)
CREATE OR REPLACE FUNCTION public.is_tutor_for_class(p_class_instance_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_instances ci
    WHERE ci.id = p_class_instance_id
      AND ci.tutor_id = public.get_user_profile_id(p_tenant_id)
  );
$$;

-- Helper: check if a user is the parent of a given student (bypasses RLS on students)
CREATE OR REPLACE FUNCTION public.is_parent_of_student(p_student_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = p_student_id
      AND s.parent_id = public.get_user_profile_id(p_tenant_id)
  );
$$;

-- Helper: check if a user tutors any class that a student is enrolled in (bypasses RLS on enrollments + class_instances)
CREATE OR REPLACE FUNCTION public.is_tutor_for_student(p_student_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments e
    JOIN class_instances ci ON ci.id = e.class_instance_id
    WHERE e.student_id = p_student_id
      AND ci.tutor_id = public.get_user_profile_id(p_tenant_id)
  );
$$;

-- Recreate enrollments_select without direct table references that trigger RLS recursion
DROP POLICY IF EXISTS "enrollments_select" ON enrollments;
CREATE POLICY "enrollments_select"
  ON enrollments FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND (
        public.get_user_role(tenant_id) IN ('admin', 'super_admin')
        -- Tutor sees enrollments for their classes (SECURITY DEFINER, no RLS cycle)
        OR public.is_tutor_for_class(class_instance_id, tenant_id)
        -- Parent sees enrollments for own children (SECURITY DEFINER, no RLS cycle)
        OR public.is_parent_of_student(student_id, tenant_id)
      )
    )
  );

-- Recreate students_select without direct table references that trigger RLS recursion
DROP POLICY IF EXISTS "students_select" ON students;
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
        -- Tutor sees students enrolled in their classes (SECURITY DEFINER, no RLS cycle)
        OR public.is_tutor_for_student(id, tenant_id)
      )
    )
  );
