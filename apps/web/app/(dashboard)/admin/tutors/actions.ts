'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TutorWithDetails {
  id: string
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  role: string
  isActive: boolean
  assignedServices: Array<{ id: string; name: string; color: string }>
  weeklyHours: number
  monthlyClassCount: number
}

export interface SessionWithDetails {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  serviceName: string
  serviceColor: string
  roomName: string | null
}

export interface TutorHoursResult {
  totalClasses: number
  totalHours: number
  byWeek: Array<{
    weekStart: string
    hours: number
    classes: number
  }>
}

// ---------------------------------------------------------------------------
// getTutors
// ---------------------------------------------------------------------------

export async function getTutors(): Promise<{
  data: TutorWithDetails[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch profiles where role is tutor or admin
  const { data: tutors, error: queryError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, role, is_active')
    .eq('tenant_id', tenantId)
    .in('role', ['staff', 'admin'])
    .order('full_name', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!tutors || tutors.length === 0) {
    return { data: [] }
  }

  const tutorIds = tutors.map((t) => t.id)

  // 2. Get team_member IDs for these profile IDs
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, profile_id')
    .in('profile_id', tutorIds)
    .eq('tenant_id', tenantId)

  // Build profile→team_member mapping
  const profileToTeamMemberId: Record<string, string> = {}
  for (const tm of teamMembers ?? []) {
    if (tm.profile_id) {
      profileToTeamMemberId[tm.profile_id] = tm.id
    }
  }

  const teamMemberIds = Object.values(profileToTeamMemberId)

  // 3. Fetch schedules for these team members to get assigned services and weekly hours
  const { data: schedules } = await supabase
    .from('schedules')
    .select(
      `
      team_member_id,
      start_time,
      end_time,
      is_active,
      service_id,
      service:services!inner(id, name, color)
    `
    )
    .in('team_member_id', teamMemberIds)
    .eq('tenant_id', tenantId)

  // Build maps for assigned services and weekly hours (keyed by team_member_id)
  const tmServicesMap: Record<
    string,
    Map<string, { id: string; name: string; color: string }>
  > = {}
  const tmWeeklyHoursMap: Record<string, number> = {}

  for (const schedule of schedules ?? []) {
    const tmId = schedule.team_member_id
    const serviceData = schedule.service as unknown as {
      id: string
      name: string
      color: string
    }

    // Track unique services per team member
    if (!tmServicesMap[tmId]) {
      tmServicesMap[tmId] = new Map()
    }
    if (serviceData) {
      tmServicesMap[tmId].set(serviceData.id, {
        id: serviceData.id,
        name: serviceData.name,
        color: serviceData.color,
      })
    }

    // Calculate weekly hours only for active schedules
    if (schedule.is_active) {
      const startParts = schedule.start_time.split(':').map(Number)
      const endParts = schedule.end_time.split(':').map(Number)
      const startMinutes = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0)
      const endMinutes = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0)
      const durationHours = (endMinutes - startMinutes) / 60

      tmWeeklyHoursMap[tmId] =
        (tmWeeklyHoursMap[tmId] ?? 0) + Math.max(0, durationHours)
    }
  }

  // 4. Count sessions in current month for each team member
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2
  const nextMonthYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const monthEnd = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data: sessions } = await supabase
    .from('sessions')
    .select('team_member_id')
    .in('team_member_id', teamMemberIds)
    .eq('tenant_id', tenantId)
    .eq('status', 'scheduled')
    .gte('date', monthStart)
    .lt('date', monthEnd)

  const monthlyClassCountMap: Record<string, number> = {}
  for (const s of sessions ?? []) {
    monthlyClassCountMap[s.team_member_id] =
      (monthlyClassCountMap[s.team_member_id] ?? 0) + 1
  }

  // 5. Map to TutorWithDetails (look up team_member_id from profile id)
  const mapped: TutorWithDetails[] = tutors.map((t) => {
    const tmId = profileToTeamMemberId[t.id]
    return {
      id: t.id,
      fullName: t.full_name,
      email: t.email,
      phone: t.phone,
      avatarUrl: t.avatar_url,
      role: t.role,
      isActive: t.is_active,
      assignedServices: tmId ? Array.from(tmServicesMap[tmId]?.values() ?? []) : [],
      weeklyHours: tmId ? Math.round((tmWeeklyHoursMap[tmId] ?? 0) * 10) / 10 : 0,
      monthlyClassCount: tmId ? monthlyClassCountMap[tmId] ?? 0 : 0,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// getTutorSchedule
// ---------------------------------------------------------------------------

export async function getTutorSchedule(
  tutorId: string
): Promise<{ data: SessionWithDetails[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // Look up team_member_id for this profile
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('profile_id', tutorId)
    .eq('tenant_id', tenantId)
    .single()

  if (!teamMember) {
    return { data: [] }
  }

  // Get today and 7 days from now
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  const { data: sessionRows, error: queryError } = await supabase
    .from('sessions')
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      service:services!inner(name, color),
      rooms(name)
    `
    )
    .eq('team_member_id', teamMember.id)
    .eq('tenant_id', tenantId)
    .gte('date', todayStr!)
    .lte('date', nextWeekStr!)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: SessionWithDetails[] = (sessionRows ?? []).map((s) => {
    const service = s.service as unknown as {
      name: string
      color: string
    }
    const room = s.rooms as unknown as { name: string } | null

    return {
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      status: s.status,
      serviceName: service?.name ?? 'Unknown',
      serviceColor: service?.color ?? '#6366f1',
      roomName: room?.name ?? null,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// getTutorHours
// ---------------------------------------------------------------------------

export async function getTutorHours(
  tutorId: string,
  periodStart: string,
  periodEnd: string
): Promise<{ data: TutorHoursResult | null; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: null, error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // Look up team_member_id for this profile
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('profile_id', tutorId)
    .eq('tenant_id', tenantId)
    .single()

  if (!teamMember) {
    return { data: null, error: 'Team member not found' }
  }

  const { data: sessionRows, error: queryError } = await supabase
    .from('sessions')
    .select('id, date, start_time, end_time, status')
    .eq('team_member_id', teamMember.id)
    .eq('tenant_id', tenantId)
    .in('status', ['scheduled', 'completed'])
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .order('date', { ascending: true })

  if (queryError) {
    return { data: null, error: queryError.message }
  }

  const allSessions = sessionRows ?? []

  // Calculate total hours and group by week
  let totalHours = 0
  const weekMap: Map<string, { hours: number; classes: number }> = new Map()

  for (const s of allSessions) {
    const startParts = s.start_time.split(':').map(Number)
    const endParts = s.end_time.split(':').map(Number)
    const startMinutes = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0)
    const endMinutes = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0)
    const durationHours = Math.max(0, (endMinutes - startMinutes) / 60)

    totalHours += durationHours

    // Determine the week start (Monday) for this date
    const dateObj = new Date(s.date + 'T00:00:00')
    const dayOfWeek = dateObj.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStartDate = new Date(dateObj)
    weekStartDate.setDate(weekStartDate.getDate() + mondayOffset)
    const weekStartStr = weekStartDate.toISOString().split('T')[0]!

    const existing = weekMap.get(weekStartStr) ?? { hours: 0, classes: 0 }
    existing.hours += durationHours
    existing.classes += 1
    weekMap.set(weekStartStr, existing)
  }

  const byWeek = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, data]) => ({
      weekStart,
      hours: Math.round(data.hours * 10) / 10,
      classes: data.classes,
    }))

  return {
    data: {
      totalClasses: allSessions.length,
      totalHours: Math.round(totalHours * 10) / 10,
      byWeek,
    },
  }
}
