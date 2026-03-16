-- Migration: 00011_create_audit_log
-- Description: Create the audit_log table. Append-only log of all data mutations.

CREATE TABLE audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  action      text        NOT NULL,
  entity_type text        NOT NULL,
  entity_id   uuid        NOT NULL,
  changes     jsonb,
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_log_action_check
    CHECK (action IN ('create', 'update', 'delete', 'cancel', 'verify', 'login'))
);

CREATE INDEX idx_audit_log_entity
  ON audit_log(tenant_id, entity_type, entity_id);

CREATE INDEX idx_audit_log_actor
  ON audit_log(tenant_id, actor_id);

COMMENT ON TABLE audit_log IS 'Append-only audit trail. No UPDATE or DELETE allowed via RLS.';
COMMENT ON COLUMN audit_log.changes IS 'JSON diff: { field: { old: ..., new: ... } }.';
