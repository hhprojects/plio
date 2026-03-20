'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const bookingSchema = z.object({
  tenant_id: z.string().uuid(),
  service_id: z.string().uuid(),
  team_member_id: z.string().uuid(),
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  client_name: z.string().min(1),
  client_email: z.string().email(),
  client_phone: z.string().min(1),
})

export async function createBooking(formData: FormData) {
  const parsed = bookingSchema.safeParse({
    tenant_id: formData.get('tenant_id'),
    service_id: formData.get('service_id'),
    team_member_id: formData.get('team_member_id'),
    date: formData.get('date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    client_name: formData.get('client_name'),
    client_email: formData.get('client_email'),
    client_phone: formData.get('client_phone'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  const {
    tenant_id,
    service_id,
    team_member_id,
    date,
    start_time,
    end_time,
    client_name,
    client_email,
    client_phone,
  } = parsed.data

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('sessions')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('team_member_id', team_member_id)
    .eq('date', date)
    .neq('status', 'cancelled')
    .lt('start_time', end_time)
    .gt('end_time', start_time)

  if (conflicts && conflicts.length > 0) {
    return { error: 'This slot is no longer available' }
  }

  // Find or create contact
  let contactId: string
  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('email', client_email)
    .single()

  if (existing) {
    contactId = existing.id
  } else {
    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({
        tenant_id,
        name: client_name,
        email: client_email,
        phone: client_phone,
      })
      .select('id')
      .single()
    if (error || !newContact) return { error: 'Failed to create contact' }
    contactId = newContact.id
  }

  // Create session
  const { data: session, error: sessErr } = await supabase
    .from('sessions')
    .insert({
      tenant_id,
      service_id,
      team_member_id,
      date,
      start_time,
      end_time,
      status: 'scheduled',
      type: 'appointment',
    })
    .select('id')
    .single()

  if (sessErr || !session) return { error: 'Failed to create booking' }

  // Create enrollment
  await supabase.from('enrollments').insert({
    tenant_id,
    session_id: session.id,
    contact_id: contactId,
    status: 'confirmed',
  })

  return { success: true, appointmentId: session.id, endTime: end_time }
}

export async function getAvailableSlots(
  tenantId: string,
  serviceId: string,
  date: string
) {
  const supabase = createAdminClient()

  // Get service details
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes, buffer_minutes')
    .eq('id', serviceId)
    .single()

  if (!service) return { slots: [] }

  const dayOfWeek = new Date(date).getDay()

  // Get team members with availability for this day
  const { data: availability } = await supabase
    .from('team_availability')
    .select(
      'team_member_id, start_time, end_time, team_member:team_members(id, name)'
    )
    .eq('tenant_id', tenantId)
    .eq('day_of_week', dayOfWeek)

  if (!availability || availability.length === 0) return { slots: [] }

  // Get existing sessions for this date
  const { data: existingSessions } = await supabase
    .from('sessions')
    .select('team_member_id, start_time, end_time')
    .eq('tenant_id', tenantId)
    .eq('date', date)
    .neq('status', 'cancelled')

  // Generate slots for each team member
  const slots: Array<{
    team_member_id: string
    team_member_name: string
    start_time: string
    end_time: string
  }> = []

  for (const avail of availability) {
    const teamMemberSessions = (existingSessions ?? []).filter(
      (s) => s.team_member_id === avail.team_member_id
    )

    // Generate 15-min interval slots
    let current = timeToMinutes(avail.start_time)
    const endOfDay = timeToMinutes(avail.end_time)
    const duration = service.duration_minutes ?? 60
    const buffer = service.buffer_minutes ?? 0

    while (current + duration <= endOfDay) {
      const slotStart = minutesToTime(current)
      const slotEnd = minutesToTime(current + duration)

      // Check overlap with existing sessions (including buffer)
      const hasConflict = teamMemberSessions.some((s) => {
        const sStart = timeToMinutes(s.start_time) - buffer
        const sEnd = timeToMinutes(s.end_time) + buffer
        return current < sEnd && current + duration > sStart
      })

      if (!hasConflict) {
        slots.push({
          team_member_id: avail.team_member_id,
          team_member_name: (avail.team_member as unknown as { id: string; name: string } | null)?.name ?? 'Unknown',
          start_time: slotStart,
          end_time: slotEnd,
        })
      }

      current += 15 // 15-min intervals
    }
  }

  return { slots }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
