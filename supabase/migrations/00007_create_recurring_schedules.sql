-- Migration: 00007_create_recurring_schedules
-- Description: Create the recurring_schedules table. Defines repeating class patterns.

CREATE TABLE recurring_schedules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week     smallint    NOT NULL,
  start_time      time        NOT NULL,
  end_time        time        NOT NULL,
  tutor_id        uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  room_id         uuid        REFERENCES rooms(id) ON DELETE SET NULL,
  recurrence_rule text        NOT NULL,
  effective_from  date        NOT NULL,
  effective_until date        NOT NULL,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT recurring_schedules_day_of_week_check
    CHECK (day_of_week BETWEEN 0 AND 6),

  CONSTRAINT recurring_schedules_time_order
    CHECK (start_time < end_time),

  CONSTRAINT recurring_schedules_effective_range
    CHECK (effective_from <= effective_until)
);

CREATE INDEX idx_recurring_schedules_tenant_id ON recurring_schedules(tenant_id);
CREATE INDEX idx_recurring_schedules_course_id ON recurring_schedules(course_id);
CREATE INDEX idx_recurring_schedules_tutor_id ON recurring_schedules(tutor_id);

COMMENT ON TABLE recurring_schedules IS 'Recurring class schedule patterns. Used to generate class_instances.';
COMMENT ON COLUMN recurring_schedules.day_of_week IS '0 = Sunday, 6 = Saturday.';
COMMENT ON COLUMN recurring_schedules.recurrence_rule IS 'iCal RRULE string, e.g. FREQ=WEEKLY;BYDAY=MO.';
COMMENT ON COLUMN recurring_schedules.tenant_id IS 'Denormalized from courses for RLS performance.';
