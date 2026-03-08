import { requireRole } from '@/lib/auth/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { TenantsPageClient } from './page-client'

export default async function TenantsPage() {
  await requireRole(['super_admin'])

  const supabase = createAdminClient()

  // Fetch all tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch profile counts per tenant
  const { data: profileCounts } = await supabase
    .from('profiles')
    .select('tenant_id')

  // Build a count map
  const countMap: Record<string, number> = {}
  for (const p of profileCounts ?? []) {
    countMap[p.tenant_id] = (countMap[p.tenant_id] || 0) + 1
  }

  const tenantsWithCounts = (tenants ?? []).map((t) => ({
    ...t,
    user_count: countMap[t.id] || 0,
  }))

  return <TenantsPageClient tenants={tenantsWithCounts} />
}
