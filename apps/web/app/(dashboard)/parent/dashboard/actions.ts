'use server'

import { createClient } from '@/lib/supabase/server'

async function getParentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null, user: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role, full_name')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'client') {
    return { error: 'Not a client', profile: null, user: null }
  }

  return { error: null, profile, user }
}

export async function getParentDashboardData() {
  const { profile, user, error } = await getParentProfile()
  if (error || !profile || !user) return { error, data: null }

  const supabase = await createClient()
  const tenantId = profile.tenant_id

  // 1. Find contact record by email
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('email', user.email!)
    .single()

  if (!contact) {
    return {
      data: {
        children: [],
        nextClasses: [],
        recentActivity: [],
      },
    }
  }

  // 2. Fetch dependents
  const { data: dependents } = await supabase
    .from('contact_dependents')
    .select('id, name')
    .eq('contact_id', contact.id)
    .order('name')

  const dependentIds = (dependents ?? []).map((d) => d.id)

  if (dependentIds.length === 0) {
    return {
      data: {
        children: [],
        nextClasses: [],
        recentActivity: [],
      },
    }
  }

  // 3. Fetch upcoming enrollments (next class per dependent)
  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingEnrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      dependent_id,
      status,
      session:sessions!inner(
        id,
        date,
        start_time,
        end_time,
        status,
        service:services(name, color),
        team_member:team_members(name),
        room:rooms(name)
      )
    `)
    .in('dependent_id', dependentIds)
    .eq('tenant_id', tenantId)
    .in('status', ['confirmed', 'makeup'])
    .gte('sessions.date', today)
    .eq('sessions.status', 'scheduled')
    .order('sessions(date)', { ascending: true })
    .limit(10)

  // Group by dependent, take first per dependent
  const nextClassMap: Record<string, {
    enrollmentId: string
    date: string
    startTime: string
    endTime: string
    serviceName: string
    serviceColor: string
    teamMemberName: string
    roomName: string | null
  }> = {}

  for (const e of upcomingEnrollments ?? []) {
    if (nextClassMap[e.dependent_id]) continue
    const s = e.session as unknown as {
      id: string
      date: string
      start_time: string
      end_time: string
      service: { name: string; color: string } | null
      team_member: { name: string } | null
      room: { name: string } | null
    }
    nextClassMap[e.dependent_id] = {
      enrollmentId: e.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      serviceName: s.service?.name ?? 'Unknown',
      serviceColor: s.service?.color ?? '#6366f1',
      teamMemberName: s.team_member?.name ?? 'TBD',
      roomName: s.room?.name ?? null,
    }
  }

  // 4. Fetch recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, read_at, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    data: {
      children: (dependents ?? []).map((d) => ({
        id: d.id,
        fullName: d.name,
      })),
      nextClasses: Object.entries(nextClassMap).map(([dependentId, cls]) => ({
        dependentId,
        dependentName: (dependents ?? []).find((d) => d.id === dependentId)?.name ?? 'Unknown',
        ...cls,
      })),
      recentActivity: (notifications ?? []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: !!n.read_at,
        createdAt: n.created_at,
      })),
    },
  }
}
