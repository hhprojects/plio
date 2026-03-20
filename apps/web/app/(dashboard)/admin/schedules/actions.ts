'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import { generateClassInstances } from '@/lib/scheduling/generate-instances'

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const createScheduleSchema = z
  .object({
    serviceId: z.string().uuid(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    tutorId: z.string().uuid(),
    roomId: z.string().uuid().optional().or(z.literal('')),
    count: z.coerce.number().int().min(1).max(52),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    effectiveUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

// ---------------------------------------------------------------------------
// createRecurringSchedule
// ---------------------------------------------------------------------------

export async function createRecurringSchedule(formData: FormData) {
  // 1. Parse and validate
  const raw = {
    serviceId: formData.get('serviceId'),
    dayOfWeek: formData.get('dayOfWeek'),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    tutorId: formData.get('tutorId'),
    roomId: formData.get('roomId'),
    count: formData.get('count'),
    effectiveFrom: formData.get('effectiveFrom'),
    effectiveUntil: formData.get('effectiveUntil'),
  }

  const parsed = createScheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data

  // 2. Auth — get user and tenant
  const auth = await getTenantId()
  if (auth.error || !auth.tenantId) return { error: auth.error ?? 'Not authenticated' }
  const tenantId = auth.tenantId

  const supabase = await createClient()

  // 3. Fetch holidays for the tenant
  const { data: holidays } = await supabase
    .from('holidays')
    .select('date')
    .eq('tenant_id', tenantId)

  const holidayDates = (holidays ?? []).map((h) => h.date)

  // 4. Build recurrence rule
  const recurrenceRule = `FREQ=WEEKLY;COUNT=${data.count}`
  const roomId = data.roomId || null

  // 5. Insert schedule record
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .insert({
      service_id: data.serviceId,
      tenant_id: tenantId,
      day_of_week: data.dayOfWeek,
      start_time: data.startTime,
      end_time: data.endTime,
      team_member_id: data.tutorId,
      room_id: roomId,
      rrule: recurrenceRule,
      effective_from: data.effectiveFrom,
      effective_until: data.effectiveUntil,
    })
    .select('id')
    .single()

  if (scheduleError || !schedule) {
    return { error: scheduleError?.message ?? 'Failed to create schedule' }
  }

  // 6. Generate session instances
  const { instances } = generateClassInstances({
    scheduleId: schedule.id,
    serviceId: data.serviceId,
    tenantId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    teamMemberId: data.tutorId,
    roomId,
    recurrenceRule,
    effectiveFrom: data.effectiveFrom,
    effectiveUntil: data.effectiveUntil,
    holidays: holidayDates,
  })

  // 7. Bulk insert sessions
  if (instances.length > 0) {
    const { error: insertError } = await supabase
      .from('sessions')
      .insert(instances)

    if (insertError) {
      // Roll back: delete the schedule we just created
      await supabase.from('schedules').delete().eq('id', schedule.id)
      return { error: `Failed to create sessions: ${insertError.message}` }
    }
  }

  // 8. Revalidate
  revalidatePath('/admin/schedules')

  return { success: true, scheduleId: schedule.id, instanceCount: instances.length }
}

// ---------------------------------------------------------------------------
// getRecurringSchedules
// ---------------------------------------------------------------------------

export interface ScheduleWithDetails {
  id: string
  serviceId: string
  serviceName: string
  serviceColor: string
  dayOfWeek: number
  startTime: string
  endTime: string
  teamMemberId: string
  teamMemberName: string
  roomId: string | null
  roomName: string | null
  rrule: string | null
  effectiveFrom: string
  effectiveUntil: string | null
}

export async function getRecurringSchedules(): Promise<{
  data: ScheduleWithDetails[]
  error?: string
}> {
  const auth = await getTenantId()
  if (auth.error || !auth.tenantId) {
    return { data: [], error: auth.error ?? 'Not authenticated' }
  }

  const supabase = await createClient()

  const { data: schedules, error: queryError } = await supabase
    .from('schedules')
    .select(
      `
      id,
      service_id,
      day_of_week,
      start_time,
      end_time,
      team_member_id,
      room_id,
      rrule,
      effective_from,
      effective_until,
      services(name, color),
      team_member:team_members!schedules_team_member_id_fkey(name),
      rooms(name)
    `
    )
    .eq('tenant_id', auth.tenantId)
    .order('effective_from', { ascending: false })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: ScheduleWithDetails[] = (schedules ?? []).map((s) => {
    const serviceData = s.services as unknown as { name: string; color: string | null } | null
    const teamMemberData = s.team_member as unknown as { name: string } | null
    const roomData = s.rooms as unknown as { name: string } | null

    return {
      id: s.id,
      serviceId: s.service_id,
      serviceName: serviceData?.name ?? 'Unknown',
      serviceColor: serviceData?.color ?? '#6366f1',
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
      teamMemberId: s.team_member_id,
      teamMemberName: teamMemberData?.name ?? 'Unknown',
      roomId: s.room_id,
      roomName: roomData?.name ?? null,
      rrule: s.rrule,
      effectiveFrom: s.effective_from,
      effectiveUntil: s.effective_until,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// deleteRecurringSchedule
// ---------------------------------------------------------------------------

export async function deleteRecurringSchedule(scheduleId: string) {
  const auth = await getTenantId()
  if (auth.error || !auth.tenantId) return { error: auth.error ?? 'Not authenticated' }

  const supabase = await createClient()

  // Delete future sessions linked to this schedule
  const today = new Date().toISOString().split('T')[0]
  await supabase
    .from('sessions')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('tenant_id', auth.tenantId)
    .gte('date', today!)

  // Delete the schedule itself
  const { error: deleteError } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId)
    .eq('tenant_id', auth.tenantId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/admin/schedules')

  return { success: true }
}
