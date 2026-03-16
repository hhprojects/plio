'use server'

import { createClient } from '@/lib/supabase/server'

async function getParentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    return { error: 'Not a parent', profile: null }
  }

  return { error: null, profile }
}

export async function getAttendanceData(studentId?: string) {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { data: null, error }

  const supabase = await createClient()

  // Get children
  const { data: children } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('tenant_id', profile.tenant_id)
    .eq('parent_id', profile.id)
    .eq('is_active', true)
    .order('full_name')

  if (!children || children.length === 0) {
    return { data: { children: [], entries: [], summary: null } }
  }

  const targetStudentId = studentId || children[0].id

  // Verify student belongs to parent
  const isOwn = children.some((c) => c.id === targetStudentId)
  if (!isOwn) return { data: null, error: 'Not authorized' }

  // Fetch enrollments for this student
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      checked_in_at,
      cancelled_at,
      class_instances!inner(
        date,
        start_time,
        end_time,
        courses!inner(title, color_code)
      )
    `)
    .eq('student_id', targetStudentId)
    .eq('tenant_id', profile.tenant_id)
    .order('class_instances(date)', { ascending: false })
    .limit(200)

  const entries = (enrollments ?? []).map((e) => {
    const ci = e.class_instances as unknown as {
      date: string
      start_time: string
      end_time: string
      courses: { title: string; color_code: string }
    }
    return {
      id: e.id,
      date: ci.date,
      startTime: ci.start_time,
      endTime: ci.end_time,
      courseTitle: ci.courses?.title ?? 'Unknown',
      courseColor: ci.courses?.color_code ?? '#6366f1',
      status: e.status,
      checkedInAt: e.checked_in_at,
      cancelledAt: e.cancelled_at,
    }
  })

  // Compute summary
  const total = entries.length
  const attended = entries.filter((e) => e.status === 'attended').length
  const noShow = entries.filter((e) => e.status === 'no_show').length
  const cancelled = entries.filter((e) => e.status === 'cancelled').length
  const makeup = entries.filter((e) => e.status === 'makeup').length
  const attendanceRate = attended + noShow > 0 ? Math.round((attended / (attended + noShow)) * 100) : 0
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

  return {
    data: {
      children: children.map((c) => ({ id: c.id, fullName: c.full_name })),
      entries,
      summary: {
        total,
        attended,
        noShow,
        cancelled,
        makeup,
        attendanceRate,
        cancellationRate,
      },
    },
  }
}
