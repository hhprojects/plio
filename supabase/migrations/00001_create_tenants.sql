-- Migration: 00001_create_tenants
-- Description: Create the tenants table — the root of multi-tenant isolation.

CREATE TABLE tenants (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  slug             text        UNIQUE NOT NULL,
  settings         jsonb       DEFAULT '{}'::jsonb,
  subscription_tier text       NOT NULL DEFAULT 'free',
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tenants_slug_format
    CHECK (slug ~ '^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$'),

  CONSTRAINT tenants_subscription_tier_check
    CHECK (subscription_tier IN ('free', 'starter', 'pro'))
);

COMMENT ON TABLE tenants IS 'Root tenant table. Every data row in the system belongs to exactly one tenant.';
COMMENT ON COLUMN tenants.slug IS 'URL-safe identifier, lowercase alphanumeric with hyphens.';
COMMENT ON COLUMN tenants.settings IS 'JSON: { timezone, currency, cancellation_hours, gst_registered, gst_rate, logo_url }';
