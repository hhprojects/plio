'use server'

import { createClient } from '@/lib/supabase/server'

async function getTutorProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'tutor') {
    return { error: 'Not a tutor', profile: null }
  }

  return { error: null, profile }
}

export async function getTutorClasses(date: string) {
  const { profile, error } = await getTutorProfile()
  if (error || !profile) return { data: [], error }

  const supabase = await createClient()

  const { data, error: queryError } = await supabase
    .from('class_instances')
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      max_capacity,
      room_id,
      rooms(name),
      courses!inner(id, title, color_code),
      enrollments(id, status)
    `)
    .eq('tenant_id', profile.tenant_id)
    .eq('tutor_id', profile.id)
    .eq('date', date)
    .eq('status', 'scheduled')
    .order('start_time', { ascending: true })

  if (queryError) return { data: [], error: queryError.message }

  return {
    data: (data ?? []).map((ci) => {
      const course = ci.courses as unknown as { id: string; title: string; color_code: string }
      const room = ci.rooms as unknown as { name: string } | null
      const enrollments = (ci.enrollments ?? []) as unknown as { id: string; status: string }[]
      const activeEnrollments = enrollments.filter(
        (e) => e.status === 'confirmed' || e.status === 'attended' || e.status === 'makeup'
      )

      return {
        id: ci.id,
        date: ci.date,
        startTime: ci.start_time,
        endTime: ci.end_time,
        courseTitle: course.title,
        courseColor: course.color_code,
        roomName: room?.name ?? null,
        enrolledCount: activeEnrollments.length,
        maxCapacity: ci.max_capacity,
      }
    }),
  }
}
