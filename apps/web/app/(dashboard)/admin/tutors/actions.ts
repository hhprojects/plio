'use server'

import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Helper: get tenant ID for the current user
// ---------------------------------------------------------------------------

async function getTenantId(): Promise<{ tenantId: string | null; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { tenantId: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { tenantId: null, error: 'Profile not found' }
  }

  return { tenantId: profile.tenant_id }
}

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
  assignedCourses: Array<{ id: string; title: string; colorCode: string }>
  weeklyHours: number
  monthlyClassCount: number
}

export interface ClassInstanceWithDetails {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  courseTitle: string
  courseColor: string
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
    .in('role', ['tutor', 'admin'])
    .order('full_name', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!tutors || tutors.length === 0) {
    return { data: [] }
  }

  const tutorIds = tutors.map((t) => t.id)

  // 2. Fetch recurring_schedules for these tutors to get assigned courses and weekly hours
  const { data: schedules } = await supabase
    .from('recurring_schedules')
    .select(
      `
      tutor_id,
      start_time,
      end_time,
      is_active,
      course_id,
      courses!inner(id, title, color_code)
    `
    )
    .in('tutor_id', tutorIds)
    .eq('tenant_id', tenantId)

  // Build maps for assigned courses and weekly hours
  const tutorCoursesMap: Record<
    string,
    Map<string, { id: string; title: string; colorCode: string }>
  > = {}
  const tutorWeeklyHoursMap: Record<string, number> = {}

  for (const schedule of schedules ?? []) {
    const tutorId = schedule.tutor_id
    const courseData = schedule.courses as unknown as {
      id: string
      title: string
      color_code: string
    }

    // Track unique courses per tutor
    if (!tutorCoursesMap[tutorId]) {
      tutorCoursesMap[tutorId] = new Map()
    }
    if (courseData) {
      tutorCoursesMap[tutorId].set(courseData.id, {
        id: courseData.id,
        title: courseData.title,
        colorCode: courseData.color_code,
      })
    }

    // Calculate weekly hours only for active schedules
    if (schedule.is_active) {
      const startParts = schedule.start_time.split(':').map(Number)
      const endParts = schedule.end_time.split(':').map(Number)
      const startMinutes = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0)
      const endMinutes = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0)
      const durationHours = (endMinutes - startMinutes) / 60

      tutorWeeklyHoursMap[tutorId] =
        (tutorWeeklyHoursMap[tutorId] ?? 0) + Math.max(0, durationHours)
    }
  }

  // 3. Count class_instances in current month for each tutor
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2
  const nextMonthYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const monthEnd = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`

  const { data: classInstances } = await supabase
    .from('class_instances')
    .select('tutor_id')
    .in('tutor_id', tutorIds)
    .eq('tenant_id', tenantId)
    .eq('status', 'scheduled')
    .gte('date', monthStart)
    .lt('date', monthEnd)

  const monthlyClassCountMap: Record<string, number> = {}
  for (const ci of classInstances ?? []) {
    monthlyClassCountMap[ci.tutor_id] =
      (monthlyClassCountMap[ci.tutor_id] ?? 0) + 1
  }

  // 4. Map to TutorWithDetails
  const mapped: TutorWithDetails[] = tutors.map((t) => ({
    id: t.id,
    fullName: t.full_name,
    email: t.email,
    phone: t.phone,
    avatarUrl: t.avatar_url,
    role: t.role,
    isActive: t.is_active,
    assignedCourses: Array.from(tutorCoursesMap[t.id]?.values() ?? []),
    weeklyHours: Math.round((tutorWeeklyHoursMap[t.id] ?? 0) * 10) / 10,
    monthlyClassCount: monthlyClassCountMap[t.id] ?? 0,
  }))

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// getTutorSchedule
// ---------------------------------------------------------------------------

export async function getTutorSchedule(
  tutorId: string
): Promise<{ data: ClassInstanceWithDetails[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // Get today and 7 days from now
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextWeekStr = nextWeek.toISOString().split('T')[0]

  const { data: instances, error: queryError } = await supabase
    .from('class_instances')
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      courses!inner(title, color_code),
      rooms(name)
    `
    )
    .eq('tutor_id', tutorId)
    .eq('tenant_id', tenantId)
    .gte('date', todayStr!)
    .lte('date', nextWeekStr!)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: ClassInstanceWithDetails[] = (instances ?? []).map((inst) => {
    const course = inst.courses as unknown as {
      title: string
      color_code: string
    }
    const room = inst.rooms as unknown as { name: string } | null

    return {
      id: inst.id,
      date: inst.date,
      startTime: inst.start_time,
      endTime: inst.end_time,
      status: inst.status,
      courseTitle: course?.title ?? 'Unknown',
      courseColor: course?.color_code ?? '#6366f1',
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

  const { data: instances, error: queryError } = await supabase
    .from('class_instances')
    .select('id, date, start_time, end_time, status')
    .eq('tutor_id', tutorId)
    .eq('tenant_id', tenantId)
    .in('status', ['scheduled', 'completed'])
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .order('date', { ascending: true })

  if (queryError) {
    return { data: null, error: queryError.message }
  }

  const allInstances = instances ?? []

  // Calculate total hours and group by week
  let totalHours = 0
  const weekMap: Map<string, { hours: number; classes: number }> = new Map()

  for (const inst of allInstances) {
    const startParts = inst.start_time.split(':').map(Number)
    const endParts = inst.end_time.split(':').map(Number)
    const startMinutes = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0)
    const endMinutes = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0)
    const durationHours = Math.max(0, (endMinutes - startMinutes) / 60)

    totalHours += durationHours

    // Determine the week start (Monday) for this date
    const dateObj = new Date(inst.date + 'T00:00:00')
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
      totalClasses: allInstances.length,
      totalHours: Math.round(totalHours * 10) / 10,
      byWeek,
    },
  }
}
