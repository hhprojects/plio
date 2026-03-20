'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getTutorProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null, teamMemberId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || !['staff', 'admin'].includes(profile.role)) {
    return { error: 'Not authorized', profile: null, teamMemberId: null }
  }

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!teamMember) {
    return { error: 'Team member record not found', profile: null, teamMemberId: null }
  }

  return { error: null, profile, teamMemberId: teamMember.id }
}

export async function getClassDetail(sessionId: string) {
  const { profile, teamMemberId, error } = await getTutorProfile()
  if (error || !profile || !teamMemberId) return { data: null, error }

  const supabase = await createClient()

  // Fetch session (RLS ensures tutor can only see their own)
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      team_member_id,
      room:rooms(name),
      service:services(name, color)
    `)
    .eq('id', sessionId)
    .eq('team_member_id', teamMemberId)
    .single()

  if (sessionError || !session) {
    return { data: null, error: 'Session not found or not assigned to you' }
  }

  // Fetch enrollments for this session
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      checked_in_at,
      dependent:contact_dependents(id, name)
    `)
    .eq('session_id', sessionId)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['confirmed', 'attended', 'no_show', 'makeup'])
    .order('created_at', { ascending: true })

  const service = session.service as unknown as { name: string; color: string }
  const room = session.room as unknown as { name: string } | null

  return {
    data: {
      id: session.id,
      date: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      status: session.status,
      serviceName: service.name,
      serviceColor: service.color,
      roomName: room?.name ?? null,
      enrollments: (enrollments ?? []).map((e) => {
        const dependent = e.dependent as unknown as { id: string; name: string }
        return {
          id: e.id,
          dependentId: dependent.id,
          dependentName: dependent.name,
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
  const { profile, teamMemberId, error } = await getTutorProfile()
  if (error || !profile || !teamMemberId) return { error }

  const supabase = await createClient()

  // Verify enrollment belongs to tutor's session
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, session_id')
    .eq('id', enrollmentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!enrollment) return { error: 'Enrollment not found' }

  // Verify the session belongs to this tutor via team_member_id
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', enrollment.session_id)
    .eq('team_member_id', teamMemberId)
    .single()

  if (!session) return { error: 'Not authorized' }

  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      status,
      checked_in_at: status === 'attended' ? new Date().toISOString() : null,
    })
    .eq('id', enrollmentId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/tutor/classes/${enrollment.session_id}`)
  return { success: true }
}
