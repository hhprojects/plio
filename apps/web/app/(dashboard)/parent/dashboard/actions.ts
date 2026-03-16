'use server'

import { createClient } from '@/lib/supabase/server'

async function getParentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role, full_name')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    return { error: 'Not a parent', profile: null }
  }

  return { error: null, profile }
}

export async function getParentDashboardData() {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { error, data: null }

  const supabase = await createClient()
  const tenantId = profile.tenant_id

  // 1. Fetch children
  const { data: children } = await supabase
    .from('students')
    .select('id, full_name, is_active')
    .eq('tenant_id', tenantId)
    .eq('parent_id', profile.id)
    .eq('is_active', true)
    .order('full_name')

  const studentIds = (children ?? []).map((c) => c.id)

  if (studentIds.length === 0) {
    return {
      data: {
        children: [],
        nextClasses: [],
        creditBalances: {},
        recentActivity: [],
      },
    }
  }

  // 2. Fetch upcoming enrollments (next class per student)
  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingEnrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      status,
      class_instances!inner(
        id,
        date,
        start_time,
        end_time,
        status,
        courses!inner(title, color_code),
        tutor:profiles!class_instances_tutor_id_fkey(full_name),
        room:rooms(name)
      )
    `)
    .in('student_id', studentIds)
    .eq('tenant_id', tenantId)
    .in('status', ['confirmed', 'makeup'])
    .gte('class_instances.date', today)
    .eq('class_instances.status', 'scheduled')
    .order('class_instances(date)', { ascending: true })
    .limit(10)

  // Group by student, take first per student
  const nextClassMap: Record<string, {
    enrollmentId: string
    date: string
    startTime: string
    endTime: string
    courseTitle: string
    courseColor: string
    tutorName: string
    roomName: string | null
  }> = {}

  for (const e of upcomingEnrollments ?? []) {
    if (nextClassMap[e.student_id]) continue
    const ci = e.class_instances as unknown as {
      id: string
      date: string
      start_time: string
      end_time: string
      courses: { title: string; color_code: string }
      tutor: { full_name: string } | null
      room: { name: string } | null
    }
    nextClassMap[e.student_id] = {
      enrollmentId: e.id,
      date: ci.date,
      startTime: ci.start_time,
      endTime: ci.end_time,
      courseTitle: ci.courses?.title ?? 'Unknown',
      courseColor: ci.courses?.color_code ?? '#6366f1',
      tutorName: ci.tutor?.full_name ?? 'TBD',
      roomName: ci.room?.name ?? null,
    }
  }

  // 3. Fetch credit balances
  const { data: creditData } = await supabase
    .from('credit_ledger')
    .select('student_id, amount')
    .in('student_id', studentIds)
    .eq('tenant_id', tenantId)

  const creditBalances: Record<string, number> = {}
  for (const entry of creditData ?? []) {
    creditBalances[entry.student_id] =
      (creditBalances[entry.student_id] ?? 0) + entry.amount
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
      children: (children ?? []).map((c) => ({
        id: c.id,
        fullName: c.full_name,
      })),
      nextClasses: Object.entries(nextClassMap).map(([studentId, cls]) => ({
        studentId,
        studentName: (children ?? []).find((c) => c.id === studentId)?.full_name ?? 'Unknown',
        ...cls,
      })),
      creditBalances,
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
