-- Migration: 00015_create_invitations
-- Description: Invitation table for admin-sent invites to tutors, parents, sub-admins

CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'tutor', 'parent')),
  invited_by uuid NOT NULL REFERENCES profiles(id),
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_invitations_tenant_email ON invitations(tenant_id, email);
CREATE INDEX idx_invitations_token ON invitations(token);
