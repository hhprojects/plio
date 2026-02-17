'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getAvailableSlots } from '@/lib/scheduling/slot-engine'

export async function getTenantBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, business_type, settings')
    .eq('slug', slug)
    .eq('business_type', 'wellness')
    .single()

  if (error || !data) return { data: null, error: 'Tenant not found' }
  return { data }
}

export async function getPublicServices(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('id, title, description, category, duration_minutes, price, color_code')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('title', { ascending: true })

  return { data: data ?? [] }
}

export async function getPublicPractitioners(tenantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'practitioner')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  return { data: data ?? [] }
}

export async function getPublicSlots(
  tenantId: string,
  serviceId: string,
  practitionerId: string,
  date: string
) {
  return getAvailableSlots({ tenantId, serviceId, practitionerId, date })
}

const bookingSchema = z.object({
  tenant_id: z.string().uuid(),
  service_id: z.string().uuid(),
  practitioner_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  client_name: z.string().min(1, 'Name is required').max(200),
  client_phone: z.string().min(1, 'Phone number is required').max(20),
  client_email: z.string().email().optional().or(z.literal('')),
})

export async function createBooking(formData: FormData) {
  const raw = {
    tenant_id: formData.get('tenant_id'),
    service_id: formData.get('service_id'),
    practitioner_id: formData.get('practitioner_id'),
    date: formData.get('date'),
    start_time: formData.get('start_time'),
    client_name: formData.get('client_name'),
    client_phone: formData.get('client_phone'),
    client_email: formData.get('client_email'),
  }

  const parsed = bookingSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  // 1. Re-check slot availability (race condition guard)
  const slotsResult = await getAvailableSlots({
    tenantId: data.tenant_id,
    serviceId: data.service_id,
    practitionerId: data.practitioner_id,
    date: data.date,
  })

  const slotAvailable = slotsResult.data.some(
    (slot) => slot.start === data.start_time
  )

  if (!slotAvailable) {
    return { error: 'This time slot is no longer available. Please select another time.' }
  }

  // 2. Get service duration to compute end_time
  const { data: service } = await supabase
    .from('services')
    .select('duration_minutes')
    .eq('id', data.service_id)
    .single()

  if (!service) return { error: 'Service not found' }

  // Compute end_time
  const [hours, minutes] = data.start_time.split(':').map(Number)
  const startMinutes = hours * 60 + minutes
  const endMinutes = startMinutes + service.duration_minutes
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

  // 3. Find or create client by (tenant_id, phone)
  let clientId: string

  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('tenant_id', data.tenant_id)
    .eq('phone', data.client_phone)
    .single()

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        tenant_id: data.tenant_id,
        full_name: data.client_name,
        phone: data.client_phone,
        email: data.client_email || null,
      })
      .select('id')
      .single()

    if (clientError || !newClient) return { error: 'Failed to create client record' }
    clientId = newClient.id
  }

  // 4. Insert appointment
  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .insert({
      tenant_id: data.tenant_id,
      service_id: data.service_id,
      practitioner_id: data.practitioner_id,
      client_id: clientId,
      date: data.date,
      start_time: data.start_time,
      end_time: endTime,
      status: 'confirmed',
    })
    .select('id')
    .single()

  if (apptError || !appointment) return { error: 'Failed to create appointment' }

  return {
    success: true,
    appointmentId: appointment.id,
    endTime,
  }
}
