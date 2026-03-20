'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import { detectConflicts, type Conflict } from '@/lib/scheduling/conflict-detection'
import type { SessionWithDetails } from '@/lib/scheduling/calendar-helpers'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const rescheduleSchema = z.object({
  sessionId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  teamMemberId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional().nullable(),
})

const cancelSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.string().min(1, 'Cancellation reason is required'),
})

// ---------------------------------------------------------------------------
// getSessions
// ---------------------------------------------------------------------------

export async function getSessions(
  dateFrom: string,
  dateTo: string
): Promise<{ data: SessionWithDetails[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // Fetch sessions with service, team member, and room joins
  const { data: sessions, error: queryError } = await supabase
    .from('sessions')
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      team_member_id,
      room_id,
      service_id,
      service:services(name, color),
      team_member:team_members(name),
      rooms(name)
    `
    )
    .eq('tenant_id', tenantId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!sessions || sessions.length === 0) {
    return { data: [] }
  }

  // Fetch enrollment counts for all sessions in one query
  const sessionIds = sessions.map((s) => s.id)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('session_id')
    .in('session_id', sessionIds)
    .neq('status', 'cancelled')

  // Build a count map
  const enrollmentCountMap: Record<string, number> = {}
  for (const enrollment of enrollments ?? []) {
    const key = enrollment.session_id
    enrollmentCountMap[key] = (enrollmentCountMap[key] ?? 0) + 1
  }

  // Map to SessionWithDetails
  const mapped: SessionWithDetails[] = sessions.map((session) => {
    const serviceData = session.service as unknown as { name: string; color: string } | null
    const teamMemberData = session.team_member as unknown as { name: string } | null
    const roomData = session.rooms as unknown as { name: string } | null

    return {
      id: session.id,
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      status: session.status,
      team_member_id: session.team_member_id,
      room_id: session.room_id,
      service_id: session.service_id,
      service: serviceData,
      team_member: teamMemberData,
      room: roomData,
      enrollment_count: enrollmentCountMap[session.id] ?? 0,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// getHolidays
// ---------------------------------------------------------------------------

export async function getHolidays(
  dateFrom: string,
  dateTo: string
): Promise<{ data: Array<{ id: string; tenant_id: string; date: string; name: string; is_national: boolean; created_at: string }>; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: holidays, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('tenant_id', tenantResult.tenantId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: holidays ?? [] }
}

// ---------------------------------------------------------------------------
// rescheduleSession
// ---------------------------------------------------------------------------

export async function rescheduleSession(input: {
  sessionId: string
  date: string
  startTime: string
  endTime: string
  teamMemberId?: string
  roomId?: string | null
}): Promise<{ success: boolean; conflicts: Conflict[]; error?: string }> {
  // 1. Validate
  const parsed = rescheduleSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      conflicts: [],
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  const data = parsed.data

  // Normalize time strings to HH:MM format
  const startTime = data.startTime.substring(0, 5)
  const endTime = data.endTime.substring(0, 5)

  // 2. Auth
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { success: false, conflicts: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 3. Get the current session details (to get teamMemberId and roomId if not provided)
  const { data: currentSession, error: fetchError } = await supabase
    .from('sessions')
    .select('team_member_id, room_id')
    .eq('id', data.sessionId)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchError || !currentSession) {
    return { success: false, conflicts: [], error: 'Session not found' }
  }

  const teamMemberId = data.teamMemberId ?? currentSession.team_member_id
  const roomId = data.roomId !== undefined ? data.roomId : currentSession.room_id

  // 4. Run conflict detection (exclude current session)
  const conflicts = await detectConflicts(supabase, {
    tenantId,
    date: data.date,
    startTime,
    endTime,
    teamMemberId,
    roomId: roomId ?? undefined,
    excludeSessionId: data.sessionId,
  })

  if (conflicts.length > 0) {
    return { success: false, conflicts }
  }

  // 5. Update the session
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      date: data.date,
      start_time: startTime,
      end_time: endTime,
      team_member_id: teamMemberId,
      room_id: roomId,
    })
    .eq('id', data.sessionId)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { success: false, conflicts: [], error: updateError.message }
  }

  // 6. Revalidate
  revalidatePath('/admin/calendar')

  return { success: true, conflicts: [] }
}

// ---------------------------------------------------------------------------
// cancelSession
// ---------------------------------------------------------------------------

export async function cancelSession(input: {
  sessionId: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  // 1. Validate
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  // 2. Auth
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { success: false, error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 3. Update status to cancelled
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      status: 'cancelled',
    })
    .eq('id', parsed.data.sessionId)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // 4. Revalidate
  revalidatePath('/admin/calendar')

  return { success: true }
}
