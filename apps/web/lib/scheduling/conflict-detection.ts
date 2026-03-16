import type { SupabaseClient } from '@supabase/supabase-js'

export interface Conflict {
  type: 'tutor' | 'room'
  classInstanceId: string
  date: string
  startTime: string
  endTime: string
  courseName: string
}

/**
 * Detect tutor and room scheduling conflicts for a given time slot.
 *
 * Checks all scheduled class instances on the same date and tenant,
 * looking for overlapping times with the same tutor or room.
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
    tutorId: string
    roomId?: string
    excludeInstanceId?: string
  }
): Promise<Conflict[]> {
  const { tenantId, date, startTime, endTime, tutorId, roomId, excludeInstanceId } = input

  // Query class_instances for the same tenant and date, status = 'scheduled'
  // Join with courses to get the course name
  let query = supabase
    .from('class_instances')
    .select('id, date, start_time, end_time, tutor_id, room_id, course_id, courses(title)')
    .eq('tenant_id', tenantId)
    .eq('date', date)
    .eq('status', 'scheduled')

  // Exclude the instance being moved/edited (if provided)
  if (excludeInstanceId) {
    query = query.neq('id', excludeInstanceId)
  }

  const { data: instances, error } = await query

  if (error) {
    console.error('Error detecting conflicts:', error)
    return []
  }

  if (!instances || instances.length === 0) {
    return []
  }

  const conflicts: Conflict[] = []

  for (const instance of instances) {
    const existingStart = instance.start_time as string
    const existingEnd = instance.end_time as string

    // Check time overlap: existingStart < newEnd AND existingEnd > newStart
    const overlaps = existingStart < endTime && existingEnd > startTime

    if (!overlaps) continue

    // Extract course name from joined data
    const courseData = instance.courses as unknown as { title: string } | null
    const courseName = courseData?.title ?? 'Unknown Course'

    // Check tutor conflict
    if (instance.tutor_id === tutorId) {
      conflicts.push({
        type: 'tutor',
        classInstanceId: instance.id as string,
        date: instance.date as string,
        startTime: existingStart,
        endTime: existingEnd,
        courseName,
      })
    }

    // Check room conflict (only if roomId is provided and not null)
    if (roomId && instance.room_id === roomId) {
      conflicts.push({
        type: 'room',
        classInstanceId: instance.id as string,
        date: instance.date as string,
        startTime: existingStart,
        endTime: existingEnd,
        courseName,
      })
    }
  }

  return conflicts
}
