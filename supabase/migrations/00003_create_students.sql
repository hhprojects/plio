-- Migration: 00003_create_students
-- Description: Create the students table. Students belong to a parent profile.

CREATE TABLE students (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  full_name     text        NOT NULL,
  date_of_birth date,
  school        text,
  level         text,
  notes         text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_students_tenant_parent ON students(tenant_id, parent_id);

COMMENT ON TABLE students IS 'Students enrolled in tuition. Each student belongs to a parent profile.';
COMMENT ON COLUMN students.level IS 'Education level, e.g. "Sec 3", "P5".';
