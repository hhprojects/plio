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
