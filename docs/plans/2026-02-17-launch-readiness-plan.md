# Launch Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build three critical features for launch: Invoice/Payment workflow with "Mark as Paid", CSV Student Import, and Privacy Policy / Terms of Service pages.

**Architecture:** Follows existing patterns — server actions with getTenantId() + Zod validation + Supabase queries + revalidatePath. Pages follow server page.tsx → page-client.tsx pattern. New database tables via Supabase migrations with RLS policies.

**Tech Stack:** Next.js 15.5 (App Router), React 19, TypeScript 5.9, Supabase (PostgreSQL + RLS), Tailwind CSS 4, Shadcn UI, Zod, React Hook Form, papaparse (new dep for CSV).

---

## Task 1: Database Migration — Invoices & Payments Tables

**Files:**
- Create: `supabase/migrations/00017_create_invoices.sql`
- Create: `supabase/migrations/00018_create_payments.sql`

**Step 1: Create invoices migration**

Create `supabase/migrations/00017_create_invoices.sql`:

```sql
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
```

**Step 2: Create payments migration**

Create `supabase/migrations/00018_create_payments.sql`:

```sql
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
```

**Step 3: Run migrations locally**

Run: `npx supabase db reset` (or apply the new migrations)
Expected: Tables created successfully

**Step 4: Commit**

```bash
git add supabase/migrations/00017_create_invoices.sql supabase/migrations/00018_create_payments.sql
git commit -m "feat: add invoices and payments tables"
```

---

## Task 2: RLS Policies for Invoices & Payments

**Files:**
- Create: `supabase/migrations/00019_invoices_payments_rls.sql`

**Step 1: Create RLS policies migration**

Create `supabase/migrations/00019_invoices_payments_rls.sql`:

```sql
-- Migration: 00019_invoices_payments_rls
-- Description: RLS policies for invoices and payments tables

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INVOICES policies
-- ============================================================================

-- Admin/super_admin can SELECT all invoices within their tenant
CREATE POLICY "invoices_select_admin"
  ON invoices FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Parents can SELECT their own invoices
CREATE POLICY "invoices_select_parent"
  ON invoices FOR SELECT
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    AND parent_id = public.get_user_profile_id(tenant_id)
  );

-- Admin/super_admin can INSERT invoices
CREATE POLICY "invoices_insert_admin"
  ON invoices FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Admin/super_admin can UPDATE invoices
CREATE POLICY "invoices_update_admin"
  ON invoices FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Admin/super_admin can DELETE invoices (only drafts in practice, enforced in app)
CREATE POLICY "invoices_delete_admin"
  ON invoices FOR DELETE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- PAYMENTS policies
-- ============================================================================

-- Admin/super_admin can SELECT all payments within their tenant
CREATE POLICY "payments_select_admin"
  ON payments FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Parents can SELECT their own payments (via invoice ownership)
CREATE POLICY "payments_select_parent"
  ON payments FOR SELECT
  USING (
    tenant_id IN (SELECT public.get_user_tenant_ids())
    AND invoice_id IN (
      SELECT id FROM invoices
      WHERE parent_id = public.get_user_profile_id(payments.tenant_id)
    )
  );

-- Admin/super_admin can INSERT payments (mark as paid)
CREATE POLICY "payments_insert_admin"
  ON payments FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );

-- Admin/super_admin can UPDATE payments (verify/reject)
CREATE POLICY "payments_update_admin"
  ON payments FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      tenant_id IN (SELECT public.get_user_tenant_ids())
      AND public.get_user_role(tenant_id) IN ('admin', 'super_admin')
    )
  );
```

**Step 2: Apply migration**

Run: `npx supabase db reset`

**Step 3: Commit**

```bash
git add supabase/migrations/00019_invoices_payments_rls.sql
git commit -m "feat: add RLS policies for invoices and payments"
```

---

## Task 3: TypeScript Types for Invoices & Payments

**Files:**
- Modify: `packages/db/src/types.ts`

**Step 1: Add invoice/payment types**

Add the following to `packages/db/src/types.ts` after the existing enum types (around line 38):

```typescript
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
export type PaymentMethod = 'paynow' | 'cash' | 'bank_transfer' | 'stripe';
export type PaymentStatus = 'pending_verification' | 'verified' | 'rejected';
```

Add the following interfaces after the existing row types (after the `Notification` interface):

```typescript
export interface LineItem {
  description: string;
  student_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  parent_id: string;
  line_items: LineItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  tenant_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  receipt_url: string | null;
  stripe_payment_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}
```

**Step 2: Commit**

```bash
git add packages/db/src/types.ts
git commit -m "feat: add Invoice and Payment TypeScript types"
```

---

## Task 4: Admin Invoices — Server Actions

**Files:**
- Create: `apps/web/app/(dashboard)/admin/invoices/actions.ts`

**Step 1: Create server actions file**

Create `apps/web/app/(dashboard)/admin/invoices/actions.ts` following the exact pattern from `admin/students/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  description: z.string().min(1),
  student_name: z.string().min(1),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
  amount: z.number().min(0),
})

const createInvoiceSchema = z.object({
  parent_id: z.string().uuid('Please select a parent'),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

const markPaidSchema = z.object({
  invoice_id: z.string().uuid(),
  method: z.enum(['paynow', 'cash', 'bank_transfer', 'stripe']),
  amount: z.number().min(0.01, 'Amount must be positive'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

// ---------------------------------------------------------------------------
// Helper: get tenant ID + settings
// ---------------------------------------------------------------------------

async function getTenantWithSettings() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { tenantId: null, settings: null, profileId: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { tenantId: null, settings: null, profileId: null, error: 'Profile not found' }
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', profile.tenant_id)
    .single()

  return {
    tenantId: profile.tenant_id,
    profileId: profile.id,
    settings: tenant?.settings ?? {},
    error: undefined,
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceWithParent {
  id: string
  invoiceNumber: string
  parentId: string
  parentName: string
  parentEmail: string
  lineItems: Array<{
    description: string
    student_name: string
    quantity: number
    unit_price: number
    amount: number
  }>
  subtotal: number
  gstRate: number
  gstAmount: number
  total: number
  status: string
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// getInvoices
// ---------------------------------------------------------------------------

export async function getInvoices(): Promise<{
  data: InvoiceWithParent[]
  error?: string
}> {
  const { tenantId, error } = await getTenantWithSettings()
  if (error || !tenantId) {
    return { data: [], error: error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: invoices, error: queryError } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      parent_id,
      line_items,
      subtotal,
      gst_rate,
      gst_amount,
      total,
      status,
      due_date,
      paid_at,
      notes,
      created_at,
      parent:profiles!invoices_parent_id_fkey(full_name, email)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: InvoiceWithParent[] = (invoices ?? []).map((inv) => {
    const parentData = inv.parent as unknown as {
      full_name: string
      email: string
    } | null

    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      parentId: inv.parent_id,
      parentName: parentData?.full_name ?? 'Unknown',
      parentEmail: parentData?.email ?? '',
      lineItems: inv.line_items as InvoiceWithParent['lineItems'],
      subtotal: Number(inv.subtotal),
      gstRate: Number(inv.gst_rate),
      gstAmount: Number(inv.gst_amount),
      total: Number(inv.total),
      status: inv.status,
      dueDate: inv.due_date,
      paidAt: inv.paid_at,
      notes: inv.notes,
      createdAt: inv.created_at,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// createInvoice
// ---------------------------------------------------------------------------

export async function createInvoice(data: {
  parent_id: string
  line_items: Array<{
    description: string
    student_name: string
    quantity: number
    unit_price: number
    amount: number
  }>
  due_date?: string
  notes?: string
}) {
  const parsed = createInvoiceSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const { tenantId, settings, error } = await getTenantWithSettings()
  if (error || !tenantId) {
    return { error: error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const items = parsed.data.line_items
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const gstRegistered = settings?.gst_registered ?? false
  const gstRate = gstRegistered ? (settings?.gst_rate ?? 9) : 0
  const gstAmount = gstRegistered ? Math.round(subtotal * gstRate) / 100 : 0
  const total = subtotal + gstAmount

  // Generate invoice number
  const { data: numberData } = await supabase.rpc('next_invoice_number', {
    p_tenant_id: tenantId,
  })
  const invoiceNumber = numberData ?? `INV-${new Date().getFullYear()}-0001`

  const { error: insertError } = await supabase.from('invoices').insert({
    tenant_id: tenantId,
    invoice_number: invoiceNumber,
    parent_id: parsed.data.parent_id,
    line_items: items,
    subtotal,
    gst_rate: gstRate,
    gst_amount: gstAmount,
    total,
    status: 'draft',
    due_date: parsed.data.due_date || null,
    notes: parsed.data.notes || null,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/invoices')
  return { success: true }
}

// ---------------------------------------------------------------------------
// generateMonthlyInvoices
// ---------------------------------------------------------------------------

export async function generateMonthlyInvoices(month: string) {
  // month format: "YYYY-MM"
  const { tenantId, settings, error } = await getTenantWithSettings()
  if (error || !tenantId) {
    return { error: error ?? 'No tenant', generated: 0 }
  }

  const supabase = await createClient()

  // 1. Get all active enrollments with student + parent + course info
  const startDate = `${month}-01`
  const endDate = new Date(
    parseInt(month.split('-')[0]),
    parseInt(month.split('-')[1]),
    0
  ).toISOString().split('T')[0]

  const { data: instances } = await supabase
    .from('class_instances')
    .select(`
      id,
      date,
      courses!inner(id, title, fee_per_session),
      enrollments!inner(
        student_id,
        status,
        students!inner(
          full_name,
          parent_id
        )
      )
    `)
    .eq('tenant_id', tenantId)
    .gte('date', startDate)
    .lte('date', endDate)
    .neq('status', 'cancelled')

  if (!instances || instances.length === 0) {
    return { error: 'No classes found for this month', generated: 0 }
  }

  // 2. Group line items by parent_id
  const parentLineItems: Record<string, Array<{
    description: string
    student_name: string
    quantity: number
    unit_price: number
    amount: number
  }>> = {}

  for (const instance of instances) {
    const course = instance.courses as unknown as { id: string; title: string; fee_per_session: number }
    const enrollmentList = instance.enrollments as unknown as Array<{
      student_id: string
      status: string
      students: { full_name: string; parent_id: string }
    }>

    for (const enrollment of enrollmentList) {
      if (enrollment.status === 'cancelled') continue
      const parentId = enrollment.students.parent_id
      if (!parentLineItems[parentId]) {
        parentLineItems[parentId] = []
      }

      // Find or create line item for this student+course combo
      const key = `${enrollment.student_id}-${course.id}`
      const existing = parentLineItems[parentId].find(
        (li) => li.description === `${course.title} - ${enrollment.students.full_name}`
      )

      if (existing) {
        existing.quantity += 1
        existing.amount = existing.quantity * existing.unit_price
      } else {
        const unitPrice = course.fee_per_session ?? 0
        parentLineItems[parentId].push({
          description: `${course.title} - ${enrollment.students.full_name}`,
          student_name: enrollment.students.full_name,
          quantity: 1,
          unit_price: unitPrice,
          amount: unitPrice,
        })
      }
    }
  }

  // 3. Create invoices for each parent
  const gstRegistered = settings?.gst_registered ?? false
  const gstRate = gstRegistered ? (settings?.gst_rate ?? 9) : 0
  let generated = 0

  for (const [parentId, items] of Object.entries(parentLineItems)) {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    if (subtotal <= 0) continue

    const gstAmount = gstRegistered ? Math.round(subtotal * gstRate) / 100 : 0
    const total = subtotal + gstAmount

    const { data: numberData } = await supabase.rpc('next_invoice_number', {
      p_tenant_id: tenantId,
    })
    const invoiceNumber = numberData ?? `INV-${new Date().getFullYear()}-${String(generated + 1).padStart(4, '0')}`

    const { error: insertError } = await supabase.from('invoices').insert({
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      parent_id: parentId,
      line_items: items,
      subtotal,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total,
      status: 'draft',
      due_date: endDate,
      notes: `Auto-generated for ${month}`,
    })

    if (!insertError) generated++
  }

  revalidatePath('/admin/invoices')
  return { success: true, generated }
}

// ---------------------------------------------------------------------------
// markInvoiceAsPaid
// ---------------------------------------------------------------------------

export async function markInvoiceAsPaid(data: {
  invoice_id: string
  method: string
  amount: number
  notes?: string
}) {
  const parsed = markPaidSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const { tenantId, profileId, error } = await getTenantWithSettings()
  if (error || !tenantId || !profileId) {
    return { error: error ?? 'No tenant' }
  }

  const supabase = await createClient()

  // 1. Create payment record
  const { error: paymentError } = await supabase.from('payments').insert({
    invoice_id: parsed.data.invoice_id,
    tenant_id: tenantId,
    method: parsed.data.method,
    amount: parsed.data.amount,
    status: 'verified',
    verified_by: profileId,
    verified_at: new Date().toISOString(),
  })

  if (paymentError) {
    return { error: paymentError.message }
  }

  // 2. Update invoice status to paid
  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.invoice_id)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/invoices')
  return { success: true }
}

// ---------------------------------------------------------------------------
// voidInvoice
// ---------------------------------------------------------------------------

export async function voidInvoice(invoiceId: string) {
  const { tenantId, error } = await getTenantWithSettings()
  if (error || !tenantId) {
    return { error: error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'void' })
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/invoices')
  return { success: true }
}

// ---------------------------------------------------------------------------
// sendInvoice (change status from draft to sent)
// ---------------------------------------------------------------------------

export async function sendInvoice(invoiceId: string) {
  const { tenantId, error } = await getTenantWithSettings()
  if (error || !tenantId) {
    return { error: error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent' })
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .eq('status', 'draft')

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/invoices')
  return { success: true }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/admin/invoices/actions.ts
git commit -m "feat: add invoice server actions (CRUD, generate, mark paid)"
```

---

## Task 5: Admin Invoices — Page & UI Components

**Files:**
- Create: `apps/web/app/(dashboard)/admin/invoices/page.tsx`
- Create: `apps/web/app/(dashboard)/admin/invoices/page-client.tsx`
- Create: `apps/web/components/admin/invoices/invoices-table.tsx`
- Create: `apps/web/components/admin/invoices/invoice-form.tsx`
- Create: `apps/web/components/admin/invoices/mark-paid-dialog.tsx`
- Create: `apps/web/components/admin/invoices/generate-invoices-dialog.tsx`

**Step 1: Create server page**

Create `apps/web/app/(dashboard)/admin/invoices/page.tsx`:

```typescript
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import { getInvoices } from './actions'
import { InvoicesPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function InvoicesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <InvoicesData />
    </Suspense>
  )
}

async function InvoicesData() {
  const { tenantId } = await getTenantId()
  const supabase = await createClient()

  const [invoicesResult, parentsResult] = await Promise.all([
    getInvoices(),
    tenantId
      ? supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('tenant_id', tenantId)
          .eq('role', 'parent')
          .eq('is_active', true)
          .order('full_name')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <InvoicesPageClient
      initialInvoices={invoicesResult.data}
      parents={parentsResult.data ?? []}
    />
  )
}
```

**Step 2: Create client page**

Create `apps/web/app/(dashboard)/admin/invoices/page-client.tsx` — manages Dialog state for invoice form, mark-paid dialog, and generate dialog. Composes InvoicesTable, InvoiceForm, MarkPaidDialog, GenerateInvoicesDialog.

Follow the exact pattern from `admin/students/page-client.tsx`:
- `'use client'` directive
- `useState` for data, dialog open states, selected invoice
- `useTransition` for async refreshes
- Buttons: "Create Invoice" and "Generate Monthly" in header
- Pass callbacks to child components

**Step 3: Create invoices table component**

Create `apps/web/components/admin/invoices/invoices-table.tsx`:
- Columns: Invoice #, Parent, Total ($XX.XX), Status (Badge), Due Date, Created, Actions
- Status badge colors: draft=gray, sent=blue, paid=green, overdue=red, void=gray/strikethrough
- Actions dropdown: View, Mark as Paid (if not paid/void), Send (if draft), Void (if draft/sent)
- Sort by created_at descending by default
- Follow the exact shadcn Table pattern from `student-table.tsx`

**Step 4: Create invoice form component**

Create `apps/web/components/admin/invoices/invoice-form.tsx`:
- Dialog with form inside
- Select parent from dropdown
- Dynamic line items: add/remove rows with description, student_name, quantity, unit_price, auto-calc amount
- Shows subtotal, GST (if tenant is GST-registered), total at bottom
- Due date picker using Calendar popover
- Notes textarea
- Submit calls `createInvoice()` server action
- Toast on success/error

**Step 5: Create mark-paid dialog component**

Create `apps/web/components/admin/invoices/mark-paid-dialog.tsx`:
- Small Dialog showing invoice number and total
- Payment method Select: PayNow, Cash, Bank Transfer
- Amount Input (pre-filled with invoice total)
- Optional notes
- Confirm button calls `markInvoiceAsPaid()` server action
- Toast on success

**Step 6: Create generate-invoices dialog component**

Create `apps/web/components/admin/invoices/generate-invoices-dialog.tsx`:
- Dialog with month picker (YYYY-MM format, default to current month)
- "Generate" button calls `generateMonthlyInvoices()` server action
- Shows result: "Generated X invoices"
- Toast on success/error

**Step 7: Commit**

```bash
git add apps/web/app/\(dashboard\)/admin/invoices/ apps/web/components/admin/invoices/
git commit -m "feat: add admin invoices page with table, form, mark-paid, and generate"
```

---

## Task 6: Add Invoices to Admin Sidebar

**Files:**
- Modify: `apps/web/components/admin/sidebar.tsx`

**Step 1: Add FileText import and nav item**

In `apps/web/components/admin/sidebar.tsx`:

Add `FileText` to the lucide-react import (line 6-16).

Add to `navItems` array after the "Team" entry (line 30):

```typescript
  { label: "Invoices", href: "/admin/invoices", icon: FileText },
```

**Step 2: Commit**

```bash
git add apps/web/components/admin/sidebar.tsx
git commit -m "feat: add Invoices to admin sidebar navigation"
```

---

## Task 7: Parent Fees Page — Replace "Coming Soon"

**Files:**
- Modify: `apps/web/app/(dashboard)/parent/fees/page.tsx`
- Create: `apps/web/app/(dashboard)/parent/fees/actions.ts`
- Create: `apps/web/app/(dashboard)/parent/fees/page-client.tsx`

**Step 1: Create parent fees server actions**

Create `apps/web/app/(dashboard)/parent/fees/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export interface ParentInvoice {
  id: string
  invoiceNumber: string
  lineItems: Array<{
    description: string
    student_name: string
    quantity: number
    unit_price: number
    amount: number
  }>
  subtotal: number
  gstRate: number
  gstAmount: number
  total: number
  status: string
  dueDate: string | null
  paidAt: string | null
  createdAt: string
}

export async function getParentInvoices(): Promise<{
  data: ParentInvoice[]
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: [], error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { data: [], error: 'Profile not found' }
  }

  const { data: invoices, error: queryError } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('parent_id', profile.id)
    .neq('status', 'draft')
    .order('created_at', { ascending: false })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: ParentInvoice[] = (invoices ?? []).map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    lineItems: inv.line_items as ParentInvoice['lineItems'],
    subtotal: Number(inv.subtotal),
    gstRate: Number(inv.gst_rate),
    gstAmount: Number(inv.gst_amount),
    total: Number(inv.total),
    status: inv.status,
    dueDate: inv.due_date,
    paidAt: inv.paid_at,
    createdAt: inv.created_at,
  }))

  return { data: mapped }
}
```

**Step 2: Create parent fees client page**

Create `apps/web/app/(dashboard)/parent/fees/page-client.tsx`:
- Shows two sections: "Outstanding" and "Payment History"
- Outstanding: Cards for invoices with status `sent` or `overdue` — show invoice number, total, due date, line items expandable
- Payment History: List of `paid` and `void` invoices with date and amount
- Empty states for each section

**Step 3: Update server page**

Replace `apps/web/app/(dashboard)/parent/fees/page.tsx`:

```typescript
import { Suspense } from 'react'
import { getParentInvoices } from './actions'
import { ParentFeesClient } from './page-client'

export default function ParentFeesPage() {
  return (
    <Suspense fallback={<div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-32 animate-pulse rounded bg-gray-200" />
    </div>}>
      <FeesData />
    </Suspense>
  )
}

async function FeesData() {
  const { data } = await getParentInvoices()
  return <ParentFeesClient invoices={data} />
}
```

**Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/parent/fees/
git commit -m "feat: replace parent fees 'Coming soon' with invoice list"
```

---

## Task 8: CSV Student Import — Install papaparse

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install papaparse**

Run from project root:

```bash
cd apps/web && pnpm add papaparse && pnpm add -D @types/papaparse
```

**Step 2: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore: add papaparse dependency for CSV import"
```

---

## Task 9: CSV Student Import — Server Action

**Files:**
- Create: `apps/web/app/(dashboard)/admin/students/import/actions.ts`

**Step 1: Create import server action**

Create `apps/web/app/(dashboard)/admin/students/import/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const importRowSchema = z.object({
  full_name: z.string().min(1, 'Student name is required'),
  level: z.string().optional().or(z.literal('')),
  school: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_email: z.string().email('Invalid parent email'),
  parent_phone: z.string().optional().or(z.literal('')),
})

export type ImportRow = z.infer<typeof importRowSchema>

export interface ImportResult {
  studentsCreated: number
  parentsCreated: number
  rowsSkipped: number
  errors: Array<{ row: number; message: string }>
}

export async function importStudents(rows: ImportRow[]): Promise<{
  data: ImportResult | null
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { data: null, error: 'Profile not found' }
  }

  const tenantId = profile.tenant_id
  const result: ImportResult = {
    studentsCreated: 0,
    parentsCreated: 0,
    rowsSkipped: 0,
    errors: [],
  }

  // Cache parent lookups by email
  const parentCache: Record<string, string> = {}

  // Pre-fetch existing parents in this tenant
  const { data: existingParents } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('tenant_id', tenantId)
    .eq('role', 'parent')

  for (const p of existingParents ?? []) {
    parentCache[p.email.toLowerCase()] = p.id
  }

  for (let i = 0; i < rows.length; i++) {
    const parsed = importRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      result.errors.push({
        row: i + 1,
        message: parsed.error.issues.map((e) => e.message).join(', '),
      })
      result.rowsSkipped++
      continue
    }

    const row = parsed.data
    const email = row.parent_email.toLowerCase()

    // Find or create parent
    let parentId = parentCache[email]
    if (!parentId) {
      const { data: newParent, error: parentError } = await supabase
        .from('profiles')
        .insert({
          tenant_id: tenantId,
          user_id: null,
          role: 'parent',
          full_name: row.parent_name,
          email: row.parent_email,
          phone: row.parent_phone || null,
          is_active: true,
        })
        .select('id')
        .single()

      if (parentError || !newParent) {
        result.errors.push({
          row: i + 1,
          message: `Failed to create parent: ${parentError?.message ?? 'Unknown error'}`,
        })
        result.rowsSkipped++
        continue
      }

      parentId = newParent.id
      parentCache[email] = parentId
      result.parentsCreated++
    }

    // Check for duplicate student
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('parent_id', parentId)
      .eq('full_name', row.full_name)
      .maybeSingle()

    if (existing) {
      result.errors.push({
        row: i + 1,
        message: `Student "${row.full_name}" already exists for this parent`,
      })
      result.rowsSkipped++
      continue
    }

    // Create student
    const { error: studentError } = await supabase.from('students').insert({
      tenant_id: tenantId,
      parent_id: parentId,
      full_name: row.full_name,
      level: row.level || null,
      school: row.school || null,
      date_of_birth: row.date_of_birth || null,
      notes: row.notes || null,
      is_active: true,
    })

    if (studentError) {
      result.errors.push({
        row: i + 1,
        message: `Failed to create student: ${studentError.message}`,
      })
      result.rowsSkipped++
      continue
    }

    result.studentsCreated++
  }

  revalidatePath('/admin/students')
  return { data: result }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/admin/students/import/actions.ts
git commit -m "feat: add CSV student import server action"
```

---

## Task 10: CSV Student Import — UI Pages

**Files:**
- Create: `apps/web/app/(dashboard)/admin/students/import/page.tsx`
- Create: `apps/web/app/(dashboard)/admin/students/import/page-client.tsx`

**Step 1: Create import page (server)**

Create `apps/web/app/(dashboard)/admin/students/import/page.tsx`:

```typescript
import { ImportPageClient } from './page-client'

export default function ImportStudentsPage() {
  return <ImportPageClient />
}
```

**Step 2: Create import page (client)**

Create `apps/web/app/(dashboard)/admin/students/import/page-client.tsx`:

Multi-step wizard with 4 steps:

1. **Upload Step:** Drag-and-drop zone accepting `.csv` files. Parse with `Papa.parse()` on the client. Show file name and row count after parsing.

2. **Mapping Step:** Show detected CSV column headers as labels. For each, a Select dropdown mapping to target fields: `full_name`, `level`, `school`, `date_of_birth`, `notes`, `parent_name`, `parent_email`, `parent_phone`. Auto-detect obvious matches (e.g., "Name" → `full_name`, "Email" → `parent_email`).

3. **Preview Step:** Table showing first 5 mapped rows. Highlight rows with validation errors (missing required fields, invalid email format). Show counts: "X valid rows, Y errors".

4. **Import Step:** Button calls `importStudents()` server action with mapped rows. Show progress and results summary. Link back to Students page.

State management: `useState` for current step, parsed data, column mappings, validation results.

**Step 3: Add "Import CSV" button to Students page**

Modify `apps/web/app/(dashboard)/admin/students/page-client.tsx`:

Add an "Import CSV" button (with Upload icon from lucide-react) in the header next to the existing "Add Student" button. Links to `/admin/students/import`.

**Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/admin/students/import/ apps/web/app/\(dashboard\)/admin/students/page-client.tsx
git commit -m "feat: add CSV student import wizard with upload, mapping, preview, and import"
```

---

## Task 11: Privacy Policy Page

**Files:**
- Create: `apps/web/app/(public)/privacy/page.tsx`

**Step 1: Create privacy policy page**

Create `apps/web/app/(public)/privacy/page.tsx`:

Static page with Singapore-appropriate privacy policy content. Uses `prose` typography styling. Content covers:
- What data is collected
- How data is used (scheduling, attendance, invoicing)
- PDPA compliance (Plio as Data Intermediary)
- Cookies (session only)
- No third-party data selling
- Data retention and deletion rights
- Contact information
- Disclaimer: "Last updated: 2026-02-17. Please review with your legal advisor."

**Step 2: Commit**

```bash
git add apps/web/app/\(public\)/privacy/page.tsx
git commit -m "feat: add privacy policy page"
```

---

## Task 12: Terms of Service Page

**Files:**
- Create: `apps/web/app/(public)/terms/page.tsx`

**Step 1: Create terms of service page**

Create `apps/web/app/(public)/terms/page.tsx`:

Static page with Singapore-appropriate ToS content. Same prose styling. Content covers:
- Service description
- Account responsibilities
- Acceptable use
- Data ownership (tenant owns their data)
- Service availability
- Limitation of liability
- Singapore governing law
- Termination and data export
- Disclaimer

**Step 2: Commit**

```bash
git add apps/web/app/\(public\)/terms/page.tsx
git commit -m "feat: add terms of service page"
```

---

## Task 13: Add Footer Links to Layouts

**Files:**
- Modify: `apps/web/app/(auth)/layout.tsx`
- Modify: `apps/web/app/(public)/layout.tsx`
- Modify: `apps/web/components/admin/sidebar.tsx`

**Step 1: Add footer to auth layout**

In `apps/web/app/(auth)/layout.tsx`, add after the `{children}` div (inside the max-w-sm wrapper):

```tsx
<div className="mt-8 text-center text-xs text-muted-foreground">
  <a href="/privacy" className="hover:underline">Privacy Policy</a>
  {' · '}
  <a href="/terms" className="hover:underline">Terms of Service</a>
</div>
```

**Step 2: Add footer to public layout**

In `apps/web/app/(public)/layout.tsx`, add after `{children}`:

```tsx
<footer className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
  <a href="/privacy" className="hover:underline">Privacy Policy</a>
  {' · '}
  <a href="/terms" className="hover:underline">Terms of Service</a>
</footer>
```

**Step 3: Add footer links to admin sidebar**

In `apps/web/components/admin/sidebar.tsx`, add privacy/terms links in the bottom nav section, below the Settings link:

```tsx
<div className="mt-2 flex gap-2 px-3 text-xs text-sidebar-foreground/40">
  <a href="/privacy" className="hover:text-sidebar-foreground/60">Privacy</a>
  <span>·</span>
  <a href="/terms" className="hover:text-sidebar-foreground/60">Terms</a>
</div>
```

**Step 4: Commit**

```bash
git add apps/web/app/\(auth\)/layout.tsx apps/web/app/\(public\)/layout.tsx apps/web/components/admin/sidebar.tsx
git commit -m "feat: add privacy policy and terms links to all layouts"
```

---

## Task 14: Final Verification

**Step 1: Build check**

Run: `pnpm build` from project root.
Expected: No TypeScript errors, successful build.

**Step 2: Verify pages load**

Run: `pnpm dev` and manually check:
- `/admin/invoices` — table renders, create form opens, mark-paid dialog works
- `/admin/students` — "Import CSV" button visible
- `/admin/students/import` — wizard renders with upload step
- `/parent/fees` — shows "No outstanding invoices" (empty state)
- `/privacy` — privacy policy renders with full content
- `/terms` — terms of service renders with full content
- Footer links visible on login, signup, and public pages

**Step 3: Final commit**

If any fixes were needed, commit them:

```bash
git add -A
git commit -m "fix: address build/UI issues from launch readiness features"
```
