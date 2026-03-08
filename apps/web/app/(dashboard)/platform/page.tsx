import { requireRole } from '@/lib/auth/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlatformDashboardClient } from './page-client'

export default async function PlatformPage() {
  await requireRole(['super_admin'])

  const supabase = createAdminClient()

  // Fetch stats in parallel
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [tenantsRes, profilesRes, recentRes] = await Promise.all([
    supabase.from('tenants').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
  ])

  return (
    <PlatformDashboardClient
      totalTenants={tenantsRes.count ?? 0}
      totalUsers={profilesRes.count ?? 0}
      recentSignups={recentRes.count ?? 0}
    />
  )
}
