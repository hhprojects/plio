import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId, getAuthUser } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoicingPageClient } from './page-client'

export default async function InvoicingPage() {
  await requireModule('invoicing')

  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const canWrite = !!auth.role && ['super_admin', 'admin'].includes(auth.role)

  const supabase = await createClient()

  // For client role, find their contact record and filter invoices
  let contactId: string | null = null
  if (auth.role === 'client') {
    const user = await getAuthUser()
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', user?.email ?? '')
      .eq('tenant_id', auth.tenantId)
      .single()

    contactId = contact?.id ?? null
  }

  // Fetch invoices for tenant (filtered by contact for clients)
  // DB column is parent_id (old schema) — we treat it as contact_id
  let invoicesQuery = supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })

  if (auth.role === 'client' && contactId) {
    invoicesQuery = invoicesQuery.eq('parent_id', contactId)
  } else if (auth.role === 'client') {
    // No contact record found — show no invoices
    invoicesQuery = invoicesQuery.eq('parent_id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: invoices } = await invoicesQuery

  // Fetch contacts for the contact dropdown and name lookups
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name')
    .eq('tenant_id', auth.tenantId)
    .order('name')

  const contactMap = new Map((contacts ?? []).map((c) => [c.id, c.name]))

  // Join contact names to invoices
  const invoicesWithContact = (invoices ?? []).map((inv) => ({
    ...inv,
    contact_name: contactMap.get(inv.parent_id) ?? 'Unknown',
  }))

  return (
    <InvoicingPageClient
      invoices={invoicesWithContact}
      contacts={contacts ?? []}
      canWrite={canWrite}
    />
  )
}
