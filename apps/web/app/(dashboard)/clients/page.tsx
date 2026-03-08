import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientsPageClient } from './page-client'

export default async function ClientsPage() {
  await requireModule('clients')

  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const canWrite = !!auth.role && ['super_admin', 'admin'].includes(auth.role)

  const supabase = await createClient()

  // Fetch contacts with dependent count
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, contact_dependents(id)')
    .eq('tenant_id', auth.tenantId)
    .order('name')

  const contactsWithCount = (contacts ?? []).map((c) => ({
    ...c,
    dependents_count: Array.isArray(c.contact_dependents) ? c.contact_dependents.length : 0,
    contact_dependents: undefined,
  }))

  return <ClientsPageClient contacts={contactsWithCount} canWrite={canWrite} />
}
