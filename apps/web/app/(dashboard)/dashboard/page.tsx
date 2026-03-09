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

    const [tenantsRes, profilesRes, recentRes, pendingRes] = await Promise.all([
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

    return (
      <DashboardPageClient
        role="super_admin"
        totalTenants={tenantsRes.count ?? 0}
        totalUsers={profilesRes.count ?? 0}
        recentSignups={recentRes.count ?? 0}
        pendingWaitlist={pendingRes.count ?? 0}
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
        role={auth.role as 'admin' | 'staff' | 'client'}
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
        role={auth.role as 'admin' | 'staff' | 'client'}
      />
    )
  }

  // Admin: show all tenant data
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('*, service:services(name, color), team_member:team_members(name)')
    .eq('tenant_id', auth.tenantId)
    .eq('date', today)
    .neq('status', 'cancelled')
    .order('start_time')

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
      role={auth.role as 'admin' | 'staff' | 'client'}
    />
  )
}
