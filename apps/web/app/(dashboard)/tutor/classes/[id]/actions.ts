'use server'

import { revalidatePath } from 'next/cache'
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

export async function getClassDetail(classInstanceId: string) {
  const { profile, error } = await getTutorProfile()
  if (error || !profile) return { data: null, error }

  const supabase = await createClient()

  // Fetch class instance (RLS ensures tutor can only see their own)
  const { data: ci, error: ciError } = await supabase
    .from('class_instances')
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      max_capacity,
      tutor_id,
      rooms(name),
      courses!inner(title, color_code)
    `)
    .eq('id', classInstanceId)
    .eq('tutor_id', profile.id)
    .single()

  if (ciError || !ci) {
    return { data: null, error: 'Class not found or not assigned to you' }
  }

  // Fetch enrollments for this class
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      checked_in_at,
      students!inner(id, full_name)
    `)
    .eq('class_instance_id', classInstanceId)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['confirmed', 'attended', 'no_show', 'makeup'])
    .order('created_at', { ascending: true })

  const course = ci.courses as unknown as { title: string; color_code: string }
  const room = ci.rooms as unknown as { name: string } | null

  return {
    data: {
      id: ci.id,
      date: ci.date,
      startTime: ci.start_time,
      endTime: ci.end_time,
      status: ci.status,
      maxCapacity: ci.max_capacity,
      courseTitle: course.title,
      courseColor: course.color_code,
      roomName: room?.name ?? null,
      enrollments: (enrollments ?? []).map((e) => {
        const student = e.students as unknown as { id: string; full_name: string }
        return {
          id: e.id,
          studentId: student.id,
          studentName: student.full_name,
          status: e.status as string,
          checkedInAt: e.checked_in_at,
        }
      }),
    },
  }
}

export async function updateAttendance(
  enrollmentId: string,
  status: 'attended' | 'no_show'
) {
  const { profile, error } = await getTutorProfile()
  if (error || !profile) return { error }

  const supabase = await createClient()

  // Verify enrollment belongs to tutor's class
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, class_instance_id')
    .eq('id', enrollmentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!enrollment) return { error: 'Enrollment not found' }

  // Verify the class belongs to this tutor
  const { data: ci } = await supabase
    .from('class_instances')
    .select('id')
    .eq('id', enrollment.class_instance_id)
    .eq('tutor_id', profile.id)
    .single()

  if (!ci) return { error: 'Not authorized' }

  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      status,
      checked_in_at: status === 'attended' ? new Date().toISOString() : null,
    })
    .eq('id', enrollmentId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/tutor/classes/${enrollment.class_instance_id}`)
  return { success: true }
}
