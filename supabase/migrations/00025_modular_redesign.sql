-- Migration: Modular Redesign
-- Drops old business-type-specific tables and introduces a unified,
-- module-driven schema that works for any vertical.

-- =============================================================================
-- 1. Drop old tables (IF EXISTS, CASCADE)
-- =============================================================================

DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS class_instances CASCADE;
DROP TABLE IF EXISTS recurring_schedules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS client_notes CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS availability_overrides CASCADE;
DROP TABLE IF EXISTS practitioner_availability CASCADE;
DROP TABLE IF EXISTS practitioners CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- =============================================================================
-- 2. Alter tenants — drop business_type column
-- =============================================================================

ALTER TABLE tenants DROP COLUMN IF EXISTS business_type;

-- =============================================================================
-- 3. Alter profiles — update role check constraint
-- =============================================================================

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'staff', 'client'));

-- =============================================================================
-- 4. Create new tables (in FK dependency order)
-- =============================================================================

-- modules (system registry) ---------------------------------------------------
CREATE TABLE modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  default_title text NOT NULL,
  icon text NOT NULL,
  always_on boolean NOT NULL DEFAULT false,
  dependencies text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- tenant_modules (per-tenant config) ------------------------------------------
CREATE TABLE tenant_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  custom_title text,
  sort_order integer NOT NULL DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, module_id)
);

-- contacts --------------------------------------------------------------------
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  notes text,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- contact_dependents ----------------------------------------------------------
CREATE TABLE contact_dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  name text NOT NULL,
  date_of_birth date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- team_members ----------------------------------------------------------------
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  email text,
  phone text,
  role_title text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- team_availability -----------------------------------------------------------
CREATE TABLE team_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  CHECK (start_time < end_time)
);

-- availability_overrides ------------------------------------------------------
CREATE TABLE availability_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean NOT NULL DEFAULT false,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- services --------------------------------------------------------------------
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('recurring', 'bookable')),
  duration_minutes integer,
  capacity integer,
  price numeric(10, 2),
  currency text NOT NULL DEFAULT 'SGD',
  buffer_minutes integer DEFAULT 0,
  color text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- schedules (recurring patterns) ----------------------------------------------
CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  rrule text,
  effective_from date NOT NULL,
  effective_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_time < end_time)
);

-- sessions (individual occurrences) -------------------------------------------
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES schedules(id) ON DELETE SET NULL,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'completed', 'no_show')),
  type text NOT NULL
    CHECK (type IN ('class', 'appointment')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- enrollments -----------------------------------------------------------------
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  dependent_id uuid REFERENCES contact_dependents(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'attended', 'no_show', 'cancelled', 'makeup')),
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- contact_notes ---------------------------------------------------------------
CREATE TABLE contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES team_members(id) ON DELETE SET NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. Seed modules
-- =============================================================================

INSERT INTO modules (slug, default_title, icon, always_on, dependencies) VALUES
  ('dashboard',  'Dashboard',    'LayoutDashboard', true,  '{}'),
  ('calendar',   'Calendar',     'CalendarDays',    false, '{services}'),
  ('clients',    'Clients',      'Users',           false, '{}'),
  ('services',   'Services',     'Briefcase',       false, '{}'),
  ('team',       'Team',         'UserCog',         true,  '{}'),
  ('rooms',      'Rooms',        'DoorOpen',        false, '{}'),
  ('invoicing',  'Invoicing',    'Receipt',         false, '{clients}'),
  ('booking',    'Booking Page', 'Globe',           false, '{services,calendar}'),
  ('settings',   'Settings',     'Settings',        true,  '{}');

-- =============================================================================
-- 6. Indexes
-- =============================================================================

CREATE INDEX idx_tenant_modules_tenant    ON tenant_modules(tenant_id);
CREATE INDEX idx_contacts_tenant          ON contacts(tenant_id);
CREATE INDEX idx_contact_dependents_contact ON contact_dependents(contact_id);
CREATE INDEX idx_team_members_tenant      ON team_members(tenant_id);
CREATE INDEX idx_team_availability_member ON team_availability(team_member_id);
CREATE INDEX idx_services_tenant          ON services(tenant_id);
CREATE INDEX idx_schedules_service        ON schedules(service_id);
CREATE INDEX idx_sessions_tenant_date     ON sessions(tenant_id, date);
CREATE INDEX idx_sessions_team_member     ON sessions(team_member_id);
CREATE INDEX idx_sessions_schedule        ON sessions(schedule_id);
CREATE INDEX idx_enrollments_session      ON enrollments(session_id);
CREATE INDEX idx_enrollments_contact      ON enrollments(contact_id);
CREATE INDEX idx_contact_notes_contact    ON contact_notes(contact_id);

-- end of migration
