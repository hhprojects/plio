import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId, getAuthUser } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarPageClient } from './page-client'

export default async function CalendarPage() {
  const mod = await requireModule('calendar')
  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const supabase = await createClient()

  // Fetch sessions for current month range (expanded +/-1 month for calendar edges)
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0]

  let sessionsQuery = supabase
    .from('sessions')
    .select('*, service:services(id, name, color), team_member:team_members(id, name, color)')
    .eq('tenant_id', auth.tenantId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('start_time')

  // Role-based filtering
  if (auth.role === 'staff') {
    // Staff: only sessions assigned to their team member record
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('tenant_id', auth.tenantId)
      .eq('profile_id', auth.profileId!)
      .single()

    if (teamMember) {
      sessionsQuery = sessionsQuery.eq('team_member_id', teamMember.id)
    } else {
      // No team member record found — show nothing
      sessionsQuery = sessionsQuery.eq('team_member_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sessions: any[] | null = null

  if (auth.role === 'client') {
    // Client: only sessions they are enrolled in
    const user = await getAuthUser()
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', user?.email ?? '')
      .eq('tenant_id', auth.tenantId)
      .single()

    if (contact) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('session_id')
        .eq('tenant_id', auth.tenantId)
        .eq('contact_id', contact.id)
        .neq('status', 'cancelled')

      const enrolledIds = (enrollments ?? []).map((e) => e.session_id)

      if (enrolledIds.length > 0) {
        const { data } = await supabase
          .from('sessions')
          .select('*, service:services(id, name, color), team_member:team_members(id, name, color)')
          .eq('tenant_id', auth.tenantId)
          .gte('date', startDate)
          .lte('date', endDate)
          .in('id', enrolledIds)
          .order('date')
          .order('start_time')

        sessions = data
      } else {
        sessions = []
      }
    } else {
      sessions = []
    }
  } else {
    const { data } = await sessionsQuery
    sessions = data
  }

  // Fetch services, team members, rooms, and contacts
  const [servicesResult, teamResult, roomsResult, contactsResult] = await Promise.all([
    supabase.from('services').select('id, name, color, duration_minutes').eq('tenant_id', auth.tenantId).eq('active', true),
    supabase.from('team_members').select('id, name, color').eq('tenant_id', auth.tenantId),
    supabase.from('rooms').select('id, name').eq('tenant_id', auth.tenantId).eq('is_active', true),
    supabase.from('contacts').select('id, name').eq('tenant_id', auth.tenantId),
  ])

  const calendarConfig = (mod.config as Record<string, unknown>) ?? {}

  return (
    <CalendarPageClient
      sessions={sessions ?? []}
      services={servicesResult.data ?? []}
      teamMembers={teamResult.data ?? []}
      rooms={roomsResult.data ?? []}
      contacts={contactsResult.data ?? []}
      calendarConfig={calendarConfig}
      role={auth.role!}
    />
  )
}
