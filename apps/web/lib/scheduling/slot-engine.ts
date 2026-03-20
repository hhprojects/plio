// NOTE: This module is a Phase 2 stub for the booking feature.
// It references tables (practitioner_availability, availability_overrides)
// that are part of the future booking schema.
import { createClient } from '@/lib/supabase/server'
import {
  computeAvailableSlots,
  type TimeSlot,
  type TimeWindow,
  type ExistingAppointment,
} from '@plio/utils'

interface GetAvailableSlotsInput {
  tenantId: string
  serviceId: string
  practitionerId: string
  date: string // YYYY-MM-DD
}

export async function getAvailableSlots(
  input: GetAvailableSlotsInput
): Promise<{ data: TimeSlot[]; error?: string }> {
  const supabase = await createClient()
  const { tenantId, serviceId, practitionerId, date } = input

  // 1. Fetch service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration_minutes, buffer_minutes')
    .eq('id', serviceId)
    .single()

  if (serviceError || !service) {
    return { data: [], error: 'Service not found' }
  }

  // 2. Fetch tenant settings for defaults
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  const settings = tenant?.settings as Record<string, unknown> | null
  const defaultBuffer = (settings?.default_buffer_minutes as number) ?? 15
  const slotInterval = (settings?.slot_interval_minutes as number) ?? 15
  const bufferMinutes = service.buffer_minutes ?? defaultBuffer

  // 3. Fetch practitioner availability for day of week
  const dayOfWeek = new Date(date).getDay()
  const { data: availability } = await supabase
    .from('practitioner_availability')
    .select('start_time, end_time')
    .eq('tenant_id', tenantId)
    .eq('practitioner_id', practitionerId)
    .eq('day_of_week', dayOfWeek)

  if (!availability || availability.length === 0) {
    return { data: [] }
  }

  // 4. Check overrides for this specific date
  const { data: overrides } = await supabase
    .from('availability_overrides')
    .select('is_available, start_time, end_time')
    .eq('tenant_id', tenantId)
    .eq('practitioner_id', practitionerId)
    .eq('date', date)

  // Build availability windows
  let windows: TimeWindow[] = availability.map((a) => ({
    start: a.start_time.slice(0, 5), // "HH:mm:ss" -> "HH:mm"
    end: a.end_time.slice(0, 5),
  }))

  if (overrides && overrides.length > 0) {
    for (const override of overrides) {
      if (!override.is_available) {
        if (!override.start_time || !override.end_time) {
          // Entire day blocked
          return { data: [] }
        }
        // Remove the blocked window (simplified: filter out overlapping windows)
        // For MVP, a full-day block is the main use case
        windows = []
      } else if (override.start_time && override.end_time) {
        // Extra availability
        windows.push({
          start: override.start_time.slice(0, 5),
          end: override.end_time.slice(0, 5),
        })
      }
    }
  }

  // 5. Fetch existing appointments for this practitioner + date
  const { data: existingAppts } = await supabase
    .from('appointments')
    .select('start_time, end_time, service_id')
    .eq('tenant_id', tenantId)
    .eq('practitioner_id', practitionerId)
    .eq('date', date)
    .in('status', ['confirmed', 'completed'])

  // Get buffer for each existing appointment's service
  const existingAppointments: ExistingAppointment[] = []
  if (existingAppts) {
    const serviceIds = [...new Set(existingAppts.map((a) => a.service_id))]
    const { data: services } = await supabase
      .from('services')
      .select('id, buffer_minutes')
      .in('id', serviceIds)

    const serviceBufferMap = new Map(
      (services || []).map((s) => [s.id, s.buffer_minutes ?? defaultBuffer])
    )

    for (const appt of existingAppts) {
      existingAppointments.push({
        start_time: appt.start_time.slice(0, 5),
        end_time: appt.end_time.slice(0, 5),
        buffer_minutes: serviceBufferMap.get(appt.service_id) ?? defaultBuffer,
      })
    }
  }

  // 6. Compute slots
  const slots = computeAvailableSlots({
    availabilityWindows: windows,
    existingAppointments,
    serviceDurationMinutes: service.duration_minutes,
    bufferMinutes,
    slotIntervalMinutes: slotInterval,
  })

  return { data: slots }
}
