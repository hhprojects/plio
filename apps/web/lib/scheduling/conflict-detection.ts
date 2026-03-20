import type { SupabaseClient } from '@supabase/supabase-js'

export interface Conflict {
  type: 'tutor' | 'room'
  sessionId: string
  date: string
  startTime: string
  endTime: string
  serviceName: string
}

/**
 * Detect tutor and room scheduling conflicts for a given time slot.
 *
 * Checks all scheduled sessions on the same date and tenant,
 * looking for overlapping times with the same team member or room.
 *
 * Time overlap logic: existingStart < newEnd AND existingEnd > newStart
 */
export async function detectConflicts(
  supabase: SupabaseClient,
  input: {
    tenantId: string
    date: string
    startTime: string
    endTime: string
    teamMemberId: string
    roomId?: string
    excludeSessionId?: string
  }
): Promise<Conflict[]> {
  const { tenantId, date, startTime, endTime, teamMemberId, roomId, excludeSessionId } = input

  // Query sessions for the same tenant and date, status = 'scheduled'
  // Join with services to get the service name
  let query = supabase
    .from('sessions')
    .select('id, date, start_time, end_time, team_member_id, room_id, service_id, service:services(name)')
    .eq('tenant_id', tenantId)
    .eq('date', date)
    .eq('status', 'scheduled')

  // Exclude the session being moved/edited (if provided)
  if (excludeSessionId) {
    query = query.neq('id', excludeSessionId)
  }

  const { data: sessions, error } = await query

  if (error) {
    console.error('Error detecting conflicts:', error)
    return []
  }

  if (!sessions || sessions.length === 0) {
    return []
  }

  const conflicts: Conflict[] = []

  for (const session of sessions) {
    const existingStart = session.start_time as string
    const existingEnd = session.end_time as string

    // Check time overlap: existingStart < newEnd AND existingEnd > newStart
    const overlaps = existingStart < endTime && existingEnd > startTime

    if (!overlaps) continue

    // Extract service name from joined data
    const serviceData = session.service as unknown as { name: string } | null
    const serviceName = serviceData?.name ?? 'Unknown Service'

    // Check team member conflict
    if (session.team_member_id === teamMemberId) {
      conflicts.push({
        type: 'tutor',
        sessionId: session.id as string,
        date: session.date as string,
        startTime: existingStart,
        endTime: existingEnd,
        serviceName,
      })
    }

    // Check room conflict (only if roomId is provided and not null)
    if (roomId && session.room_id === roomId) {
      conflicts.push({
        type: 'room',
        sessionId: session.id as string,
        date: session.date as string,
        startTime: existingStart,
        endTime: existingEnd,
        serviceName,
      })
    }
  }

  return conflicts
}
