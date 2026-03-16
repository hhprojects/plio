-- Migration: 00018_create_payments
-- Description: Individual payment records against invoices.

CREATE TABLE payments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  method            text NOT NULL
                    CHECK (method IN ('paynow', 'cash', 'bank_transfer', 'stripe')),
  amount            numeric(10,2) NOT NULL,
  status            text NOT NULL DEFAULT 'pending_verification'
                    CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  receipt_url       text,
  stripe_payment_id text,
  verified_by       uuid REFERENCES profiles(id),
  verified_at       timestamptz,
  rejection_reason  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE payments IS 'Individual payment attempts against an invoice';

CREATE INDEX payments_invoice_idx ON payments(invoice_id);
CREATE INDEX payments_tenant_status_idx ON payments(tenant_id, status);
