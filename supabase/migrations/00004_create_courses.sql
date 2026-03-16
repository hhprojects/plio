-- Migration: 00004_create_courses
-- Description: Create the courses table. Courses define what is taught.

CREATE TABLE courses (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title         text          NOT NULL,
  description   text,
  default_price numeric(10,2) NOT NULL,
  color_code    text          NOT NULL,
  max_capacity  integer       NOT NULL,
  is_active     boolean       NOT NULL DEFAULT true,
  created_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT courses_default_price_positive
    CHECK (default_price >= 0),

  CONSTRAINT courses_max_capacity_positive
    CHECK (max_capacity > 0),

  CONSTRAINT courses_color_code_hex
    CHECK (color_code ~ '^#[0-9a-fA-F]{6}$')
);

CREATE INDEX idx_courses_tenant_id ON courses(tenant_id);

COMMENT ON TABLE courses IS 'Course definitions with pricing and capacity defaults.';
COMMENT ON COLUMN courses.default_price IS 'Per-session price in SGD.';
COMMENT ON COLUMN courses.color_code IS 'Hex color code for calendar display, e.g. #FF5733.';
