-- Migration: 00008_create_class_instances
-- Description: Create the class_instances table. Each row is a single scheduled class session.

CREATE TABLE class_instances (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_schedule_id uuid        REFERENCES recurring_schedules(id) ON DELETE SET NULL,
  course_id             uuid        NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  tenant_id             uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date                  date        NOT NULL,
  start_time            time        NOT NULL,
  end_time              time        NOT NULL,
  tutor_id              uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  room_id               uuid        REFERENCES rooms(id) ON DELETE SET NULL,
  status                text        NOT NULL DEFAULT 'scheduled',
  max_capacity          integer     NOT NULL,
  override_notes        text,
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT class_instances_status_check
    CHECK (status IN ('scheduled', 'cancelled', 'holiday')),

  CONSTRAINT class_instances_time_order
    CHECK (start_time < end_time),

  CONSTRAINT class_instances_max_capacity_positive
    CHECK (max_capacity > 0)
);

-- Calendar queries: list classes on a given date range
CREATE INDEX idx_class_instances_tenant_date
  ON class_instances(tenant_id, date);

-- Tutor schedule: find all classes for a tutor on a date
CREATE INDEX idx_class_instances_tenant_tutor_date
  ON class_instances(tenant_id, tutor_id, date);

-- Room conflict detection
CREATE INDEX idx_class_instances_room_conflict
  ON class_instances(tenant_id, room_id, date, start_time, end_time);

COMMENT ON TABLE class_instances IS 'Individual class sessions. Generated from recurring_schedules or created ad-hoc.';
COMMENT ON COLUMN class_instances.recurring_schedule_id IS 'NULL for ad-hoc classes not generated from a recurring schedule.';
COMMENT ON COLUMN class_instances.status IS 'One of: scheduled, cancelled, holiday.';
