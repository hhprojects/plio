-- Migration: 00027_add_tenant_active_column
-- Description: Add active flag to tenants table for enable/disable functionality

ALTER TABLE tenants ADD COLUMN active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN tenants.active IS 'Whether this tenant is active. Disabled tenants cannot access the platform.';
