-- Migration: 00010_create_credit_ledger
-- Description: Create the credit_ledger table. Immutable ledger of credit transactions per student.

CREATE TABLE credit_ledger (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  student_id        uuid        NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  amount            integer     NOT NULL,
  reason            text        NOT NULL,
  class_instance_id uuid        REFERENCES class_instances(id) ON DELETE SET NULL,
  invoice_id        uuid,
  created_by        uuid        NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT credit_ledger_reason_check
    CHECK (reason IN ('purchase', 'cancellation_refund', 'makeup_booking', 'admin_adjustment', 'expiry'))
);

CREATE INDEX idx_credit_ledger_tenant_student ON credit_ledger(tenant_id, student_id);
CREATE INDEX idx_credit_ledger_created_by ON credit_ledger(created_by);

COMMENT ON TABLE credit_ledger IS 'Append-only ledger of credit transactions. Positive = added, negative = consumed.';
COMMENT ON COLUMN credit_ledger.amount IS 'Positive values are credits added, negative are credits consumed.';
COMMENT ON COLUMN credit_ledger.invoice_id IS 'Reference to future invoices table (no FK constraint in Phase 1).';
