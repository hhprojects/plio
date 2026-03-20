'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CANCELLATION_HOURS } from '@/lib/constants'

async function getParentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null, email: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'client') {
    return { error: 'Not a client', profile: null, email: null }
  }

  return { error: null, profile, email: user.email! }
}

async function getContactAndDependents(supabase: Awaited<ReturnType<typeof createClient>>, email: string, tenantId: string) {
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .eq('tenant_id', tenantId)
    .single()

  if (!contact) return { contact: null, dependents: [] }

  const { data: dependents } = await supabase
    .from('contact_dependents')
    .select('id, name')
    .eq('contact_id', contact.id)
    .eq('tenant_id', tenantId)

  return { contact, dependents: dependents ?? [] }
}

export async function getParentSchedule() {
  const { profile, email, error } = await getParentProfile()
  if (error || !profile || !email) return { data: null, error }

  const supabase = await createClient()

  const { contact, dependents } = await getContactAndDependents(supabase, email, profile.tenant_id)
  if (!contact) return { data: { children: [], upcoming: [], past: [] } }

  const dependentIds = dependents.map((c) => c.id)
  if (dependentIds.length === 0) return { data: { children: [], upcoming: [], past: [] } }

  // Get all enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      dependent_id,
      status,
      checked_in_at,
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
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(100)

  const today = new Date().toISOString().split('T')[0]
  const upcoming: Array<{
    enrollmentId: string
    dependentId: string
    dependentName: string
    sessionId: string
    date: string
    startTime: string
    endTime: string
    serviceName: string
    serviceColor: string
    teamMemberName: string
    roomName: string | null
    status: string
    sessionStatus: string
  }> = []
  const past: typeof upcoming = []

  for (const e of enrollments ?? []) {
    const session = e.session as unknown as {
      id: string
      date: string
      start_time: string
      end_time: string
      status: string
      service: { name: string; color: string } | null
      team_member: { name: string } | null
      room: { name: string } | null
    }

    const entry = {
      enrollmentId: e.id,
      dependentId: e.dependent_id,
      dependentName: dependents.find((c) => c.id === e.dependent_id)?.name ?? 'Unknown',
      sessionId: session.id,
      date: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      serviceName: session.service?.name ?? 'Unknown',
      serviceColor: session.service?.color ?? '#6366f1',
      teamMemberName: session.team_member?.name ?? 'TBD',
      roomName: session.room?.name ?? null,
      status: e.status,
      sessionStatus: session.status,
    }

    if (session.date >= today && e.status !== 'cancelled') {
      upcoming.push(entry)
    } else {
      past.push(entry)
    }
  }

  // Sort upcoming ascending
  upcoming.sort((a, b) => a.date.localeCompare(b.date))

  return {
    data: {
      children: dependents.map((c) => ({ id: c.id, fullName: c.name })),
      upcoming,
      past,
    },
  }
}

export async function cancelEnrollment(enrollmentId: string) {
  const { profile, email, error } = await getParentProfile()
  if (error || !profile || !email) return { error }

  const supabase = await createClient()

  // Fetch enrollment with session
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id,
      dependent_id,
      status,
      tenant_id,
      session:sessions!inner(date, start_time)
    `)
    .eq('id', enrollmentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!enrollment) return { error: 'Enrollment not found' }
  if (!['confirmed', 'makeup'].includes(enrollment.status)) {
    return { error: 'Cannot cancel this enrollment' }
  }

  // Verify dependent belongs to parent via contact
  const { contact, dependents } = await getContactAndDependents(supabase, email, profile.tenant_id)
  if (!contact) return { error: 'Not authorized' }

  const isOwn = dependents.some((d) => d.id === enrollment.dependent_id)
  if (!isOwn) return { error: 'Not authorized' }

  // Check cancellation policy
  const session = enrollment.session as unknown as { date: string; start_time: string }
  const classDateTime = new Date(`${session.date}T${session.start_time}+08:00`)
  const now = new Date()
  const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Fetch tenant cancellation hours
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', profile.tenant_id)
    .single()

  const cancellationHours = (tenant?.settings as Record<string, unknown>)?.cancellation_hours as number ?? DEFAULT_CANCELLATION_HOURS
  const eligibleForRefund = hoursUntilClass > cancellationHours

  // Cancel the enrollment
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      status: 'cancelled',
      cancellation_reason: 'Cancelled by parent',
    })
    .eq('id', enrollmentId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/parent/schedule')
  return { success: true, creditRefunded: false }
}

export async function getAvailableMakeupSlots(dependentId: string) {
  const { profile, email, error } = await getParentProfile()
  if (error || !profile || !email) return { data: [], error }

  const supabase = await createClient()

  // Verify dependent belongs to parent via contact
  const { contact, dependents } = await getContactAndDependents(supabase, email, profile.tenant_id)
  if (!contact) return { data: [], error: 'Not authorized' }

  const isOwn = dependents.some((d) => d.id === dependentId)
  if (!isOwn) return { data: [], error: 'Not authorized' }

  const today = new Date().toISOString().split('T')[0]

  // Get scheduled sessions with service capacity
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      start_time,
      end_time,
      service:services(name, color, capacity),
      team_member:team_members(name),
      room:rooms(name)
    `)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'scheduled')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(50)

  if (!sessions || sessions.length === 0) return { data: [] }

  // Count current enrollments per session
  const sessionIds = sessions.map((s) => s.id)
  const { data: enrollmentCounts } = await supabase
    .from('enrollments')
    .select('session_id')
    .in('session_id', sessionIds)
    .eq('tenant_id', profile.tenant_id)
    .neq('status', 'cancelled')

  const countMap: Record<string, number> = {}
  for (const e of enrollmentCounts ?? []) {
    countMap[e.session_id] = (countMap[e.session_id] ?? 0) + 1
  }

  const slots = sessions
    .map((s) => {
      const current = countMap[s.id] ?? 0
      const service = s.service as unknown as { name: string; color: string; capacity: number | null } | null
      const maxCapacity = service?.capacity ?? 0
      const available = maxCapacity - current
      const teamMember = s.team_member as unknown as { name: string } | null
      const room = s.room as unknown as { name: string } | null

      return {
        sessionId: s.id,
        date: s.date,
        startTime: s.start_time,
        endTime: s.end_time,
        serviceName: service?.name ?? 'Unknown',
        serviceColor: service?.color ?? '#6366f1',
        teamMemberName: teamMember?.name ?? 'TBD',
        roomName: room?.name ?? null,
        currentEnrollment: current,
        maxCapacity,
        availableSpots: available,
      }
    })
    .filter((s) => s.availableSpots > 0)

  return { data: slots }
}

export async function bookMakeupClass(dependentId: string, sessionId: string) {
  const { profile, email, error } = await getParentProfile()
  if (error || !profile || !email) return { error }

  const supabase = await createClient()

  // Verify dependent belongs to parent via contact
  const { contact, dependents } = await getContactAndDependents(supabase, email, profile.tenant_id)
  if (!contact) return { error: 'Not authorized' }

  const isOwn = dependents.some((d) => d.id === dependentId)
  if (!isOwn) return { error: 'Not authorized' }

  // Check session capacity via service
  const { data: session } = await supabase
    .from('sessions')
    .select('id, service:services(capacity)')
    .eq('id', sessionId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!session) return { error: 'Session not found' }

  const service = session.service as unknown as { capacity: number | null } | null
  const maxCapacity = service?.capacity ?? 0

  if (maxCapacity > 0) {
    const { data: existingCount } = await supabase
      .from('enrollments')
      .select('id')
      .eq('session_id', sessionId)
      .eq('tenant_id', profile.tenant_id)
      .neq('status', 'cancelled')

    if ((existingCount?.length ?? 0) >= maxCapacity) {
      return { error: 'Session is full' }
    }
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('dependent_id', dependentId)
    .eq('session_id', sessionId)
    .neq('status', 'cancelled')
    .single()

  if (existing) return { error: 'Already enrolled in this session' }

  // Create enrollment
  const { error: enrollError } = await supabase.from('enrollments').insert({
    contact_id: contact.id,
    dependent_id: dependentId,
    session_id: sessionId,
    tenant_id: profile.tenant_id,
    status: 'makeup',
  })

  if (enrollError) return { error: enrollError.message }

  revalidatePath('/parent/schedule')
  return { success: true }
}
