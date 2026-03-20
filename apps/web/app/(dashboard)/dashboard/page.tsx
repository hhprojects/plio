import { getTenantId, getAuthUser } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardPageClient } from './page-client'

export default async function DashboardPage() {
  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  // Super admin: show platform KPIs
  if (auth.role === 'super_admin') {
    const adminSupabase = createAdminClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [tenantsRes, profilesRes, recentRes, pendingRes] = await Promise.allSettled([
      adminSupabase.from('tenants').select('id', { count: 'exact', head: true }),
      adminSupabase.from('profiles').select('id', { count: 'exact', head: true }),
      adminSupabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      adminSupabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ])

    const settledCount = (r: PromiseSettledResult<{ count: number | null }>) =>
      r.status === 'fulfilled' ? r.value.count ?? 0 : 0

    return (
      <DashboardPageClient
        role="super_admin"
        totalTenants={settledCount(tenantsRes)}
        totalUsers={settledCount(profilesRes)}
        recentSignups={settledCount(recentRes)}
        pendingWaitlist={settledCount(pendingRes)}
      />
    )
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  if (auth.role === 'staff') {
    // Staff: show only their own sessions and client counts
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .eq('profile_id', auth.profileId!)
      .single()

    const teamMemberId = teamMember?.id

    const { data: todaySessions } = await supabase
      .from('sessions')
      .select('*, service:services(name, color), team_member:team_members(name)')
      .eq('tenant_id', auth.tenantId)
      .eq('date', today)
      .neq('status', 'cancelled')
      .eq('team_member_id', teamMemberId ?? '')
      .order('start_time')

    // Count distinct contacts enrolled in this staff member's sessions
    const { count: myContactsCount } = await supabase
      .from('enrollments')
      .select('contact_id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .in(
        'session_id',
        (todaySessions ?? []).map((s) => s.id)
      )

    // Count services this staff member delivers
    const { data: myServices } = await supabase
      .from('sessions')
      .select('service_id')
      .eq('tenant_id', auth.tenantId)
      .eq('team_member_id', teamMemberId ?? '')

    const uniqueServiceIds = new Set((myServices ?? []).map((s) => s.service_id))

    return (
      <DashboardPageClient
        todaySessions={todaySessions ?? []}
        contactsCount={myContactsCount ?? 0}
        servicesCount={uniqueServiceIds.size}
        teamCount={0}
        role={auth.role as 'staff' | 'client'}
      />
    )
  }

  if (auth.role === 'client') {
    // Client: show only their enrolled sessions
    const user = await getAuthUser()
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', user?.email ?? '')
      .eq('tenant_id', auth.tenantId)
      .single()

    const contactId = contact?.id

    // Find dependents for this contact
    const { data: dependents } = await supabase
      .from('contact_dependents')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .eq('contact_id', contactId ?? '')

    const dependentCount = dependents?.length ?? 0

    // Fetch enrolled session IDs for today
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('session_id')
      .eq('tenant_id', auth.tenantId)
      .eq('contact_id', contactId ?? '')
      .neq('status', 'cancelled')

    const enrolledSessionIds = (enrollments ?? []).map((e) => e.session_id)

    let todaySessions: Array<{
      id: string
      date: string
      start_time: string
      end_time: string
      status: string
      type: string
      service: { name: string; color: string | null } | null
      team_member: { name: string } | null
    }> = []

    if (enrolledSessionIds.length > 0) {
      const { data } = await supabase
        .from('sessions')
        .select('*, service:services(name, color), team_member:team_members(name)')
        .eq('tenant_id', auth.tenantId)
        .eq('date', today)
        .neq('status', 'cancelled')
        .in('id', enrolledSessionIds)
        .order('start_time')

      todaySessions = data ?? []
    }

    // Count invoices for client
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .eq('parent_id', contactId ?? '')

    return (
      <DashboardPageClient
        todaySessions={todaySessions}
        contactsCount={dependentCount}
        servicesCount={todaySessions.length}
        teamCount={invoiceCount ?? 0}
        role={auth.role as 'staff' | 'client'}
      />
    )
  }

  // Admin: show all tenant data
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)
  const endOfLastWeek = new Date(startOfWeek)
  endOfLastWeek.setMilliseconds(-1)

  const threeDaysFromNow = new Date(now)
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const [
    todaySessionsResult,
    contactsResult, servicesResult, teamResult,
    overdueInvoicesResult, expiringInvitationsResult,
    revenueThisMonthResult, revenueLastMonthResult,
    activeClientsResult, activeClientsLastMonthResult,
    sessionsThisWeekResult, sessionsLastWeekResult,
    newSessionsThisWeekResult, newSessionsLastWeekResult,
    auditLogResult,
  ] = await Promise.allSettled([
    supabase
      .from('sessions')
      .select('*, service:services(name, color), team_member:team_members(name)')
      .eq('tenant_id', auth.tenantId)
      .eq('date', today)
      .neq('status', 'cancelled')
      .order('start_time'),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('tenant_id', auth.tenantId),
    supabase.from('services').select('id', { count: 'exact', head: true }).eq('tenant_id', auth.tenantId).eq('active', true),
    supabase.from('team_members').select('id', { count: 'exact', head: true }).eq('tenant_id', auth.tenantId),
    // Alerts
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'overdue'),
    supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'pending')
      .lte('expires_at', threeDaysFromNow.toISOString()),
    // Revenue trends
    supabase
      .from('payments')
      .select('amount')
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'verified')
      .gte('created_at', startOfMonth),
    supabase
      .from('payments')
      .select('amount')
      .eq('tenant_id', auth.tenantId)
      .eq('status', 'verified')
      .gte('created_at', startOfLastMonth)
      .lte('created_at', endOfLastMonth),
    // Active clients
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .eq('is_active', true),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .eq('is_active', true)
      .lte('created_at', endOfLastMonth),
    // Sessions this week vs last week
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .neq('status', 'cancelled')
      .gte('date', startOfWeek.toISOString().split('T')[0]),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .neq('status', 'cancelled')
      .gte('date', startOfLastWeek.toISOString().split('T')[0])
      .lte('date', endOfLastWeek.toISOString().split('T')[0]),
    // New sessions created this week vs last week
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .gte('created_at', startOfWeek.toISOString()),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', auth.tenantId)
      .gte('created_at', startOfLastWeek.toISOString())
      .lte('created_at', endOfLastWeek.toISOString()),
    // Activity feed
    supabase
      .from('audit_log')
      .select('id, action, entity_type, created_at, actor:profiles!audit_log_actor_id_fkey(full_name)')
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Safe extractors for settled results
  const getData = <T,>(r: PromiseSettledResult<{ data: T | null }>, fallback: T): T =>
    r.status === 'fulfilled' ? r.value.data ?? fallback : fallback
  const getCount = (r: PromiseSettledResult<{ count: number | null }>): number =>
    r.status === 'fulfilled' ? r.value.count ?? 0 : 0

  const sumAmounts = (rows: { amount: number }[]) =>
    rows.reduce((sum, r) => sum + Number(r.amount), 0)

  const todaySessions = getData(todaySessionsResult, [] as any[])
  const auditLog = getData(auditLogResult, [] as any[])

  return (
    <DashboardPageClient
      todaySessions={todaySessions}
      contactsCount={getCount(contactsResult)}
      servicesCount={getCount(servicesResult)}
      teamCount={getCount(teamResult)}
      role="admin"
      alerts={{
        overdueInvoices: getCount(overdueInvoicesResult),
        expiringInvitations: getCount(expiringInvitationsResult),
      }}
      trends={{
        revenueThisMonth: sumAmounts(getData(revenueThisMonthResult, [])),
        revenueLastMonth: sumAmounts(getData(revenueLastMonthResult, [])),
        activeClients: getCount(activeClientsResult),
        activeClientsLastMonth: getCount(activeClientsLastMonthResult),
        sessionsThisWeek: getCount(sessionsThisWeekResult),
        sessionsLastWeek: getCount(sessionsLastWeekResult),
        newSessionsThisWeek: getCount(newSessionsThisWeekResult),
        newSessionsLastWeek: getCount(newSessionsLastWeekResult),
      }}
      recentActivity={auditLog.map((entry: any) => ({
        id: entry.id,
        action: entry.action,
        entity_type: entry.entity_type,
        actor_name: entry.actor?.full_name ?? 'System',
        created_at: entry.created_at,
      }))}
    />
  )
}
