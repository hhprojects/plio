'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/scheduling/slot-engine'

// ---------------------------------------------------------------------------
// Helper: get tenant ID + profile ID for the current user
// ---------------------------------------------------------------------------

async function getTenantId(): Promise<{
  tenantId: string | null
  profileId: string | null
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { tenantId: null, profileId: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { tenantId: null, profileId: null, error: 'Profile not found' }
  }

  return { tenantId: profile.tenant_id, profileId: profile.id }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppointmentWithDetails {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  cancellationReason: string | null
  serviceId: string
  serviceTitle: string
  serviceColor: string
  serviceDurationMinutes: number
  servicePrice: number
  practitionerId: string
  practitionerName: string
  clientId: string
  clientName: string
  clientPhone: string
}

export interface ServiceOption {
  id: string
  title: string
  durationMinutes: number
  price: number
}

export interface PractitionerOption {
  id: string
  fullName: string
}

export interface ClientOption {
  id: string
  fullName: string
  phone: string
}

// ---------------------------------------------------------------------------
// getAppointments
// ---------------------------------------------------------------------------

export async function getAppointments(
  dateFrom: string,
  dateTo: string
): Promise<{ data: AppointmentWithDetails[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: appointments, error: queryError } = await supabase
    .from('appointments')
    .select(
      `
      id, date, start_time, end_time, status, cancellation_reason,
      service:services!appointments_service_id_fkey(id, title, color_code, duration_minutes, price),
      practitioner:profiles!appointments_practitioner_id_fkey(id, full_name),
      client:clients!appointments_client_id_fkey(id, full_name, phone)
    `
    )
    .eq('tenant_id', tenantResult.tenantId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: AppointmentWithDetails[] = (appointments ?? []).map(
    (a: Record<string, unknown>) => {
      const service = a.service as Record<string, unknown> | null
      const practitioner = a.practitioner as Record<string, unknown> | null
      const client = a.client as Record<string, unknown> | null

      return {
        id: a.id as string,
        date: a.date as string,
        startTime: (a.start_time as string).slice(0, 5),
        endTime: (a.end_time as string).slice(0, 5),
        status: a.status as string,
        cancellationReason: a.cancellation_reason as string | null,
        serviceId: (service?.id as string) ?? '',
        serviceTitle: (service?.title as string) ?? '',
        serviceColor: (service?.color_code as string) ?? '#6366f1',
        serviceDurationMinutes: (service?.duration_minutes as number) ?? 0,
        servicePrice: (service?.price as number) ?? 0,
        practitionerId: (practitioner?.id as string) ?? '',
        practitionerName: (practitioner?.full_name as string) ?? '',
        clientId: (client?.id as string) ?? '',
        clientName: (client?.full_name as string) ?? '',
        clientPhone: (client?.phone as string) ?? '',
      }
    }
  )

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// createAppointment
// ---------------------------------------------------------------------------

const createAppointmentSchema = z.object({
  client_id: z.string().uuid('Client is required'),
  service_id: z.string().uuid('Service is required'),
  practitioner_id: z.string().uuid('Practitioner is required'),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Time slot is required'),
})

export async function createAppointment(data: {
  client_id: string
  service_id: string
  practitioner_id: string
  date: string
  start_time: string
}): Promise<{ success?: boolean; error?: string }> {
  const parsed = createAppointmentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const { client_id, service_id, practitioner_id, date, start_time } =
    parsed.data

  // Fetch service to get duration
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', service_id)
    .single()

  if (serviceError || !service) {
    return { error: 'Service not found' }
  }

  // Compute end_time
  const [h, m] = start_time.split(':').map(Number)
  const totalMinutes = h * 60 + m + service.duration_minutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMins = totalMinutes % 60
  const end_time = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`

  // RACE CONDITION GUARD: Re-check slot availability before insert
  const slotsResult = await getAvailableSlots({
    tenantId: tenantResult.tenantId,
    serviceId: service_id,
    practitionerId: practitioner_id,
    date,
  })

  const isSlotAvailable = slotsResult.data.some(
    (slot) => slot.start === start_time
  )

  if (!isSlotAvailable) {
    return {
      error:
        'This time slot is no longer available. Please select another time.',
    }
  }

  // Insert appointment
  const { error: insertError } = await supabase.from('appointments').insert({
    tenant_id: tenantResult.tenantId,
    service_id,
    practitioner_id,
    client_id,
    date,
    start_time,
    end_time,
    status: 'confirmed',
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/appointments')

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateAppointmentStatus
// ---------------------------------------------------------------------------

const updateStatusSchema = z.object({
  appointment_id: z.string().uuid(),
  status: z.enum(['confirmed', 'completed', 'no_show', 'cancelled']),
  cancellation_reason: z.string().optional(),
})

export async function updateAppointmentStatus(data: {
  appointment_id: string
  status: string
  cancellation_reason?: string
}): Promise<{ success?: boolean; error?: string }> {
  const parsed = updateStatusSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  if (parsed.data.status === 'cancelled' && !parsed.data.cancellation_reason) {
    return { error: 'Cancellation reason is required' }
  }

  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    status: parsed.data.status,
  }

  if (parsed.data.status === 'cancelled') {
    updateData.cancellation_reason = parsed.data.cancellation_reason
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', parsed.data.appointment_id)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/appointments')

  return { success: true }
}

// ---------------------------------------------------------------------------
// getAvailableSlotsAction
// ---------------------------------------------------------------------------

export async function getAvailableSlotsAction(
  serviceId: string,
  practitionerId: string,
  date: string
): Promise<{ data: { start: string; end: string }[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const result = await getAvailableSlots({
    tenantId: tenantResult.tenantId,
    serviceId,
    practitionerId,
    date,
  })

  return result
}

// ---------------------------------------------------------------------------
// getServicesForForm
// ---------------------------------------------------------------------------

export async function getServicesForForm(): Promise<{
  data: ServiceOption[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: services, error } = await supabase
    .from('services')
    .select('id, title, duration_minutes, price')
    .eq('tenant_id', tenantResult.tenantId)
    .eq('is_active', true)
    .order('title', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return {
    data: (services ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      durationMinutes: s.duration_minutes,
      price: s.price,
    })),
  }
}

// ---------------------------------------------------------------------------
// getPractitionersForForm
// ---------------------------------------------------------------------------

export async function getPractitionersForForm(): Promise<{
  data: PractitionerOption[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: practitioners, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('tenant_id', tenantResult.tenantId)
    .eq('role', 'practitioner')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return {
    data: (practitioners ?? []).map((p) => ({
      id: p.id,
      fullName: p.full_name,
    })),
  }
}

// ---------------------------------------------------------------------------
// getClientsForForm
// ---------------------------------------------------------------------------

export async function getClientsForForm(): Promise<{
  data: ClientOption[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, full_name, phone')
    .eq('tenant_id', tenantResult.tenantId)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return {
    data: (clients ?? []).map((c) => ({
      id: c.id,
      fullName: c.full_name,
      phone: c.phone,
    })),
  }
}
