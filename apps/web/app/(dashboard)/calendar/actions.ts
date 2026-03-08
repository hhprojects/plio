'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'

// --- Recurring Class ---

const recurringClassSchema = z.object({
  service_id: z.string().uuid(),
  team_member_id: z.string().uuid(),
  room_id: z.string().uuid().optional().or(z.literal('')),
  days_of_week: z.array(z.coerce.number().min(0).max(6)).min(1, 'Select at least one day'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  effective_from: z.string(),
  effective_until: z.string().optional(),
})

export async function createRecurringClass(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const raw = {
    service_id: formData.get('service_id'),
    team_member_id: formData.get('team_member_id'),
    room_id: formData.get('room_id'),
    days_of_week: formData.getAll('days_of_week').map(Number),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    effective_from: formData.get('effective_from'),
    effective_until: formData.get('effective_until'),
  }

  const parsed = recurringClassSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const {
    service_id,
    team_member_id,
    room_id,
    days_of_week,
    start_time,
    end_time,
    effective_from,
    effective_until,
  } = parsed.data
  const supabase = await createClient()

  // Create a schedule record for each day
  const schedules = days_of_week.map((day) => ({
    tenant_id: auth.tenantId!,
    service_id,
    team_member_id,
    room_id: room_id || null,
    day_of_week: day,
    start_time,
    end_time,
    effective_from,
    effective_until: effective_until || null,
  }))

  const { data: insertedSchedules, error: schedError } = await supabase
    .from('schedules')
    .insert(schedules)
    .select()

  if (schedError) return { error: schedError.message }

  // Generate session instances from each schedule
  const { data: holidays } = await supabase
    .from('holidays')
    .select('date')
    .eq('tenant_id', auth.tenantId!)

  const holidayDates = new Set((holidays ?? []).map((h) => h.date))

  const sessions: Array<{
    tenant_id: string
    service_id: string
    schedule_id: string
    team_member_id: string
    room_id: string | null
    date: string
    start_time: string
    end_time: string
    status: string
    type: string
  }> = []

  for (const schedule of insertedSchedules ?? []) {
    const from = new Date(schedule.effective_from)
    const until = schedule.effective_until
      ? new Date(schedule.effective_until)
      : new Date(from)
    // Default to 12 weeks if no end date
    if (!schedule.effective_until) {
      until.setDate(until.getDate() + 84)
    }

    const current = new Date(from)
    while (current <= until) {
      if (current.getDay() === schedule.day_of_week) {
        const dateStr = current.toISOString().split('T')[0]
        if (!holidayDates.has(dateStr)) {
          sessions.push({
            tenant_id: auth.tenantId!,
            service_id: schedule.service_id,
            schedule_id: schedule.id,
            team_member_id: schedule.team_member_id,
            room_id: schedule.room_id,
            date: dateStr,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            status: 'scheduled',
            type: 'class',
          })
        }
      }
      current.setDate(current.getDate() + 1)
    }
  }

  if (sessions.length > 0) {
    const { error: sessError } = await supabase.from('sessions').insert(sessions)
    if (sessError) return { error: sessError.message }
  }

  revalidatePath('/calendar')
  return { success: true, count: sessions.length }
}

// --- Appointment ---

const appointmentSchema = z.object({
  service_id: z.string().uuid(),
  team_member_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  date: z.string(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
})

export async function createAppointment(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const parsed = appointmentSchema.safeParse({
    service_id: formData.get('service_id'),
    team_member_id: formData.get('team_member_id'),
    contact_id: formData.get('contact_id'),
    date: formData.get('date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const supabase = await createClient()

  // Check for conflicts (team member double booking)
  const { data: conflicts } = await supabase
    .from('sessions')
    .select('id')
    .eq('tenant_id', auth.tenantId)
    .eq('team_member_id', parsed.data.team_member_id)
    .eq('date', parsed.data.date)
    .neq('status', 'cancelled')
    .lt('start_time', parsed.data.end_time)
    .gt('end_time', parsed.data.start_time)

  if (conflicts && conflicts.length > 0) {
    return { error: 'Time slot conflicts with an existing session' }
  }

  // Create session
  const { data: session, error: sessError } = await supabase
    .from('sessions')
    .insert({
      tenant_id: auth.tenantId,
      ...parsed.data,
      room_id: null,
      status: 'scheduled',
      type: 'appointment',
    })
    .select()
    .single()

  if (sessError) return { error: sessError.message }

  // Create enrollment
  const { error: enrollError } = await supabase
    .from('enrollments')
    .insert({
      tenant_id: auth.tenantId,
      session_id: session.id,
      contact_id: parsed.data.contact_id,
      status: 'confirmed',
    })

  if (enrollError) return { error: enrollError.message }

  revalidatePath('/calendar')
  return { success: true }
}

export async function updateSessionStatus(sessionId: string, status: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}

export async function updateEnrollmentStatus(enrollmentId: string, status: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const updateData: Record<string, unknown> = { status }
  if (status === 'attended') updateData.checked_in_at = new Date().toISOString()

  const { error } = await supabase
    .from('enrollments')
    .update(updateData)
    .eq('id', enrollmentId)
    .eq('tenant_id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { success: true }
}
