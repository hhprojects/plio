-- Migration: 00009_create_enrollments
-- Description: Create the enrollments table. Links students to class instances.

CREATE TABLE enrollments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        uuid        NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  class_instance_id uuid        NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
  tenant_id         uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status            text        NOT NULL DEFAULT 'confirmed',
  checked_in_at     timestamptz,
  cancelled_at      timestamptz,
  cancellation_reason text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT enrollments_status_check
    CHECK (status IN ('confirmed', 'attended', 'no_show', 'cancelled', 'makeup')),

  CONSTRAINT enrollments_student_class_unique
    UNIQUE (student_id, class_instance_id)
);

CREATE INDEX idx_enrollments_tenant_id ON enrollments(tenant_id);
CREATE INDEX idx_enrollments_class_instance_id ON enrollments(class_instance_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);

COMMENT ON TABLE enrollments IS 'Student enrollments in specific class instances. Tracks attendance status.';
COMMENT ON COLUMN enrollments.status IS 'One of: confirmed, attended, no_show, cancelled, makeup.';
COMMENT ON COLUMN enrollments.tenant_id IS 'Denormalized from class_instances for RLS performance.';
