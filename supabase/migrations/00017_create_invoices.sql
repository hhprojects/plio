-- Migration: 00017_create_invoices
-- Description: Monthly or on-demand invoices sent to parents.

CREATE TABLE invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  parent_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  line_items    jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal      numeric(10,2) NOT NULL DEFAULT 0,
  gst_rate      numeric(4,2) NOT NULL DEFAULT 0,
  gst_amount    numeric(10,2) NOT NULL DEFAULT 0,
  total         numeric(10,2) NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void')),
  due_date      date,
  paid_at       timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE invoices IS 'Monthly or on-demand invoices sent to parents';

-- Unique invoice number per tenant
CREATE UNIQUE INDEX invoices_tenant_number_idx ON invoices(tenant_id, invoice_number);

-- Common query pattern: filter by parent and status within a tenant
CREATE INDEX invoices_tenant_parent_status_idx ON invoices(tenant_id, parent_id, status);

-- Helper function to generate next invoice number for a tenant
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'INV-' || to_char(now(), 'YYYY') || '-' ||
    lpad((coalesce(
      (SELECT count(*) + 1 FROM invoices WHERE tenant_id = p_tenant_id),
      1
    ))::text, 4, '0');
$$;
