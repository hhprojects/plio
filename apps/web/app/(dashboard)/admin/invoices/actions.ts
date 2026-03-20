'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { TenantSettings } from '@plio/db'

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
  const typedSettings = settings as TenantSettings
  const gstRegistered = typedSettings?.gst_registered ?? false
  const gstRate = gstRegistered ? (typedSettings?.gst_rate ?? 9) : 0
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

  // 1. Get all sessions for the month with service info
  const startDate = `${month}-01`
  const endDate = new Date(
    parseInt(month.split('-')[0]),
    parseInt(month.split('-')[1]),
    0
  ).toISOString().split('T')[0]

  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      service:services!inner(id, name, price),
      enrollments!inner(
        contact_id,
        dependent_id,
        status,
        contact:contacts!inner(id, name),
        dependent:contact_dependents(name)
      )
    `)
    .eq('tenant_id', tenantId)
    .gte('date', startDate)
    .lte('date', endDate)
    .neq('status', 'cancelled')

  if (!sessions || sessions.length === 0) {
    return { error: 'No sessions found for this month', generated: 0 }
  }

  // 2. Group line items by contact_id (the parent/contact who pays)
  const contactLineItems: Record<string, Array<{
    description: string
    student_name: string
    quantity: number
    unit_price: number
    amount: number
  }>> = {}

  for (const session of sessions) {
    const service = session.service as unknown as { id: string; name: string; price: number }
    const enrollmentList = session.enrollments as unknown as Array<{
      contact_id: string
      dependent_id: string | null
      status: string
      contact: { id: string; name: string }
      dependent: { name: string } | null
    }>

    for (const enrollment of enrollmentList) {
      if (enrollment.status === 'cancelled') continue

      const contactId = enrollment.contact_id
      // Use dependent name if present, otherwise fall back to contact name
      const studentName = enrollment.dependent?.name ?? enrollment.contact.name

      if (!contactLineItems[contactId]) {
        contactLineItems[contactId] = []
      }

      // Find or create line item for this student+service combo
      const lineDescription = `${service.name} - ${studentName}`
      const existing = contactLineItems[contactId].find(
        (li) => li.description === lineDescription
      )

      if (existing) {
        existing.quantity += 1
        existing.amount = existing.quantity * existing.unit_price
      } else {
        const unitPrice = service.price ?? 0
        contactLineItems[contactId].push({
          description: lineDescription,
          student_name: studentName,
          quantity: 1,
          unit_price: unitPrice,
          amount: unitPrice,
        })
      }
    }
  }

  // 3. Create invoices for each contact
  const typedSettings = settings as TenantSettings
  const gstRegistered = typedSettings?.gst_registered ?? false
  const gstRate = gstRegistered ? (typedSettings?.gst_rate ?? 9) : 0
  let generated = 0

  for (const [contactId, items] of Object.entries(contactLineItems)) {
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
      parent_id: contactId,
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
