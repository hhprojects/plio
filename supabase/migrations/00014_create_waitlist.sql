-- Migration: 00014_create_waitlist
-- Description: Waitlist table for tenant registration applications

CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('tuition', 'yoga', 'music', 'enrichment', 'other')),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  tenant_id uuid REFERENCES tenants(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_contact_email ON waitlist(contact_email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
