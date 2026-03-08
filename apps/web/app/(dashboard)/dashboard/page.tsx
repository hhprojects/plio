import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardPageClient } from './page-client'

export default async function DashboardPage() {
  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's sessions with joins
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('*, service:services(name, color), team_member:team_members(name)')
    .eq('tenant_id', auth.tenantId)
    .eq('date', today)
    .neq('status', 'cancelled')
    .order('start_time')

  // Fetch counts
  const [contactsResult, servicesResult, teamResult] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('tenant_id', auth.tenantId),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', auth.tenantId).eq('active', true),
    supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('tenant_id', auth.tenantId),
  ])

  return (
    <DashboardPageClient
      todaySessions={todaySessions ?? []}
      contactsCount={contactsResult.count ?? 0}
      servicesCount={servicesResult.count ?? 0}
      teamCount={teamResult.count ?? 0}
      role={auth.role!}
    />
  )
}
