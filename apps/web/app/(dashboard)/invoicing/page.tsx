import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoicingPageClient } from './page-client'

export default async function InvoicingPage() {
  await requireModule('invoicing')

  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const canWrite = !!auth.role && ['super_admin', 'admin'].includes(auth.role)

  const supabase = await createClient()

  // Fetch invoices for tenant
  // DB column is parent_id (old schema) — we treat it as contact_id
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('created_at', { ascending: false })

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
