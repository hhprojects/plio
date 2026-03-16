'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'

// ── Zod Schemas ──────────────────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
})

const invoiceSchema = z.object({
  contact_id: z.string().uuid(),
  line_items: z.array(lineItemSchema).min(1),
  gst_rate: z.coerce.number().default(0),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

// ── Helpers ──────────────────────────────────────────────────────────────

async function generateInvoiceNumber(tenantId: string): Promise<string> {
  const supabase = await createClient()
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `INV-${yyyy}${mm}-`

  // Count existing invoices for this tenant this month
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .like('invoice_number', `${prefix}%`)

  const seq = (count ?? 0) + 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

// ── Create Invoice ───────────────────────────────────────────────────────

export async function createInvoice(payload: {
  contact_id: string
  line_items: { description: string; quantity: number; unit_price: number }[]
  gst_rate: number
  due_date?: string
  notes?: string
}) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const parsed = invoiceSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { contact_id, line_items, gst_rate, due_date, notes } = parsed.data

  // Calculate totals
  const lineItemsWithAmount = line_items.map((item) => ({
    ...item,
    amount: Math.round(item.quantity * item.unit_price * 100) / 100,
  }))
  const subtotal =
    Math.round(lineItemsWithAmount.reduce((sum, item) => sum + item.amount, 0) * 100) / 100
  const gst_amount = Math.round(subtotal * gst_rate) / 100
  const total = Math.round((subtotal + gst_amount) * 100) / 100

  const invoice_number = await generateInvoiceNumber(auth.tenantId)

  const supabase = await createClient()
  // Note: DB column is parent_id (old schema), we store contact_id there
  const { error } = await supabase.from('invoices').insert({
    tenant_id: auth.tenantId,
    invoice_number,
    parent_id: contact_id,
    line_items: lineItemsWithAmount,
    subtotal,
    gst_rate,
    gst_amount,
    total,
    status: 'draft',
    due_date: due_date || null,
    notes: notes || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/invoicing')
  return { success: true }
}

// ── Update Invoice Status ────────────────────────────────────────────────

export async function updateInvoiceStatus(
  id: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/invoicing')
  return { success: true }
}

// ── Delete Invoice ───────────────────────────────────────────────────────

export async function deleteInvoice(id: string) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  const supabase = await createClient()

  // Only allow deleting draft invoices
  const { data: invoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)
    .single()

  if (!invoice) return { error: 'Invoice not found' }
  if (invoice.status !== 'draft') return { error: 'Only draft invoices can be deleted' }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/invoicing')
  return { success: true }
}

// ── Record Payment ───────────────────────────────────────────────────────

export async function recordPayment(
  invoiceId: string,
  payload: { amount: number; method: string; reference?: string }
) {
  const auth = await getTenantId()
  if (!auth.tenantId || !auth.role || !['super_admin', 'admin'].includes(auth.role)) {
    return { error: 'Unauthorized' }
  }

  if (!payload.amount || payload.amount <= 0) {
    return { error: 'Amount must be greater than 0' }
  }

  const validMethods = ['paynow', 'cash', 'bank_transfer', 'stripe']
  if (!validMethods.includes(payload.method)) {
    return { error: 'Invalid payment method' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('payments').insert({
    invoice_id: invoiceId,
    tenant_id: auth.tenantId,
    method: payload.method,
    amount: payload.amount,
    status: 'pending_verification',
    stripe_payment_id: payload.reference || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/invoicing')
  return { success: true }
}

// ── Fetch Helpers ────────────────────────────────────────────────────────

export async function fetchInvoicePayments(invoiceId: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })

  return data ?? []
}
