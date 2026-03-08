import { requireModule, requireRole } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ServicesPageClient } from './page-client'

export default async function ServicesPage() {
  await requireModule('services')

  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const canWrite = !!auth.role && ['super_admin', 'admin'].includes(auth.role)

  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('name')

  return <ServicesPageClient services={services ?? []} canWrite={canWrite} />
}
