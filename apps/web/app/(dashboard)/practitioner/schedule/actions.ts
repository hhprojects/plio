'use server'

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

export async function getPractitionerAppointments(date: string) {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { data: [], error }

  const supabase = await createClient()

  const { data, error: queryError } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      start_time,
      end_time,
      status,
      service:services!appointments_service_id_fkey(title, color_code, duration_minutes),
      client:clients!appointments_client_id_fkey(full_name, phone)
    `)
    .eq('practitioner_id', profile.id)
    .eq('tenant_id', profile.tenant_id)
    .eq('date', date)
    .order('start_time', { ascending: true })

  if (queryError) return { data: [], error: queryError.message }

  return {
    data: (data ?? []).map((a) => {
      const service = a.service as unknown as { title: string; color_code: string; duration_minutes: number } | null
      const client = a.client as unknown as { full_name: string; phone: string } | null
      return {
        id: a.id,
        date: a.date,
        startTime: a.start_time,
        endTime: a.end_time,
        status: a.status,
        serviceTitle: service?.title ?? 'Unknown',
        serviceColor: service?.color_code ?? '#6366f1',
        clientName: client?.full_name ?? 'Unknown',
        clientPhone: client?.phone ?? '',
      }
    }),
  }
}
