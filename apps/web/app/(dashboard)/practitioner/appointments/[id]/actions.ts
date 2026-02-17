'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getPractitionerProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'practitioner') {
    return { error: 'Not a practitioner', profile: null }
  }

  return { error: null, profile }
}

export async function getAppointmentDetail(id: string) {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { data: null, error }

  const supabase = await createClient()

  // Fetch appointment with service and client
  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      cancellation_reason,
      client_id,
      service:services!appointments_service_id_fkey(title, color_code, duration_minutes),
      client:clients!appointments_client_id_fkey(id, full_name, phone)
    `)
    .eq('id', id)
    .eq('practitioner_id', profile.id)
    .single()

  if (apptError || !appt) {
    return { data: null, error: 'Appointment not found or not assigned to you' }
  }

  const service = appt.service as unknown as { title: string; color_code: string; duration_minutes: number } | null
  const client = appt.client as unknown as { id: string; full_name: string; phone: string } | null

  // Count total visits for this client
  const { count: visitCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', appt.client_id)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['completed', 'confirmed'])

  // Fetch client notes for this client
  const { data: notes } = await supabase
    .from('client_notes')
    .select(`
      id,
      content,
      created_at,
      appointment_id,
      practitioner:profiles!client_notes_practitioner_id_fkey(full_name)
    `)
    .eq('client_id', appt.client_id)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  return {
    data: {
      id: appt.id,
      date: appt.date,
      startTime: appt.start_time,
      endTime: appt.end_time,
      status: appt.status,
      cancellationReason: appt.cancellation_reason,
      serviceTitle: service?.title ?? 'Unknown',
      serviceColor: service?.color_code ?? '#6366f1',
      serviceDuration: service?.duration_minutes ?? 0,
      clientId: client?.id ?? '',
      clientName: client?.full_name ?? 'Unknown',
      clientPhone: client?.phone ?? '',
      visitCount: visitCount ?? 0,
      notes: (notes ?? []).map((n) => {
        const practitioner = n.practitioner as unknown as { full_name: string } | null
        return {
          id: n.id,
          content: n.content,
          createdAt: n.created_at,
          appointmentId: n.appointment_id,
          practitionerName: practitioner?.full_name ?? 'Unknown',
        }
      }),
    },
  }
}

export async function updateAppointmentStatus(id: string, status: string, cancellationReason?: string) {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { error }

  const supabase = await createClient()

  // Verify the appointment belongs to this practitioner
  const { data: appt } = await supabase
    .from('appointments')
    .select('id')
    .eq('id', id)
    .eq('practitioner_id', profile.id)
    .single()

  if (!appt) return { error: 'Not authorized' }

  const updateData: Record<string, string> = { status }
  if (status === 'cancelled' && cancellationReason) {
    updateData.cancellation_reason = cancellationReason
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/practitioner/appointments/${id}`)
  revalidatePath('/practitioner/schedule')
  return { success: true }
}

export async function addPractitionerNote(formData: FormData) {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { error }

  const appointmentId = formData.get('appointmentId') as string
  const clientId = formData.get('clientId') as string
  const content = formData.get('content') as string

  if (!content?.trim()) return { error: 'Note content is required' }

  const supabase = await createClient()

  // Verify the appointment belongs to this practitioner
  const { data: appt } = await supabase
    .from('appointments')
    .select('id')
    .eq('id', appointmentId)
    .eq('practitioner_id', profile.id)
    .single()

  if (!appt) return { error: 'Not authorized' }

  const { error: insertError } = await supabase
    .from('client_notes')
    .insert({
      tenant_id: profile.tenant_id,
      client_id: clientId,
      appointment_id: appointmentId,
      practitioner_id: profile.id,
      content: content.trim(),
    })

  if (insertError) return { error: insertError.message }

  revalidatePath(`/practitioner/appointments/${appointmentId}`)
  return { success: true }
}
