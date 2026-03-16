-- Migration: 00005_create_rooms
-- Description: Create the rooms table. Physical or virtual rooms for classes.

CREATE TABLE rooms (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name      text    NOT NULL,
  capacity  integer NOT NULL,
  is_active   boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT rooms_capacity_positive
    CHECK (capacity > 0)
);

CREATE INDEX idx_rooms_tenant_id ON rooms(tenant_id);

COMMENT ON TABLE rooms IS 'Physical or virtual rooms where classes are held.';
