'use server'

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

export async function getTutorClasses(date: string) {
  const { profile, teamMemberId, error } = await getTutorProfile()
  if (error || !profile || !teamMemberId) return { data: [], error }

  const supabase = await createClient()

  const { data, error: queryError } = await supabase
    .from('sessions')
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      room_id,
      room:rooms(name),
      service:services(id, name, color),
      enrollments(id, status)
    `)
    .eq('tenant_id', profile.tenant_id)
    .eq('team_member_id', teamMemberId)
    .eq('date', date)
    .eq('status', 'scheduled')
    .order('start_time', { ascending: true })

  if (queryError) return { data: [], error: queryError.message }

  return {
    data: (data ?? []).map((session) => {
      const service = session.service as unknown as { id: string; name: string; color: string }
      const room = session.room as unknown as { name: string } | null
      const enrollments = (session.enrollments ?? []) as unknown as { id: string; status: string }[]
      const activeEnrollments = enrollments.filter(
        (e) => e.status === 'confirmed' || e.status === 'attended' || e.status === 'makeup'
      )

      return {
        id: session.id,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
        serviceName: service.name,
        serviceColor: service.color,
        roomName: room?.name ?? null,
        enrolledCount: activeEnrollments.length,
      }
    }),
  }
}
