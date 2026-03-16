-- Migration: 00006_create_holidays
-- Description: Create the holidays table. Used to skip classes on holiday dates.

CREATE TABLE holidays (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date        date    NOT NULL,
  name        text    NOT NULL,
  is_national boolean      NOT NULL DEFAULT false,
  created_at  timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT holidays_tenant_date_unique
    UNIQUE (tenant_id, date)
);

COMMENT ON TABLE holidays IS 'Holiday dates for skipping scheduled classes. Includes national and custom holidays.';
