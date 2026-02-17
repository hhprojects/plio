-- Add business_type column to tenants table
-- Defaults to 'education' so existing tenants are unaffected.

ALTER TABLE tenants
ADD COLUMN business_type text NOT NULL DEFAULT 'education';

ALTER TABLE tenants
ADD CONSTRAINT tenants_business_type_check
CHECK (business_type IN ('education', 'wellness'));

COMMENT ON COLUMN tenants.business_type IS 'Vertical mode: education (tuition centres) or wellness (clinics, salons)';
