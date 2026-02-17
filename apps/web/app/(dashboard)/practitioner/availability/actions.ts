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

export async function getMyAvailability() {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { availability: [], overrides: [], error }

  const supabase = await createClient()

  const { data: availability } = await supabase
    .from('practitioner_availability')
    .select('id, day_of_week, start_time, end_time')
    .eq('practitioner_id', profile.id)
    .eq('tenant_id', profile.tenant_id)
    .order('day_of_week', { ascending: true })

  const today = new Date().toISOString().split('T')[0]
  const { data: overrides } = await supabase
    .from('availability_overrides')
    .select('id, date, is_available, start_time, end_time, reason')
    .eq('practitioner_id', profile.id)
    .eq('tenant_id', profile.tenant_id)
    .gte('date', today)
    .order('date', { ascending: true })

  return {
    availability: (availability ?? []).map((a) => ({
      id: a.id,
      dayOfWeek: a.day_of_week,
      startTime: a.start_time,
      endTime: a.end_time,
    })),
    overrides: (overrides ?? []).map((o) => ({
      id: o.id,
      date: o.date,
      isAvailable: o.is_available,
      startTime: o.start_time,
      endTime: o.end_time,
      reason: o.reason,
    })),
  }
}

export async function saveMyAvailability(formData: FormData) {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { error }

  const entriesJson = formData.get('entries') as string
  if (!entriesJson) return { error: 'No entries provided' }

  let entries: { day_of_week: number; start_time: string; end_time: string }[]
  try {
    entries = JSON.parse(entriesJson)
  } catch {
    return { error: 'Invalid entries format' }
  }

  const supabase = await createClient()

  // Delete existing availability for this practitioner
  const { error: deleteError } = await supabase
    .from('practitioner_availability')
    .delete()
    .eq('practitioner_id', profile.id)
    .eq('tenant_id', profile.tenant_id)

  if (deleteError) return { error: deleteError.message }

  // Insert new entries
  if (entries.length > 0) {
    const rows = entries.map((e) => ({
      tenant_id: profile.tenant_id,
      practitioner_id: profile.id,
      day_of_week: e.day_of_week,
      start_time: e.start_time,
      end_time: e.end_time,
    }))

    const { error: insertError } = await supabase
      .from('practitioner_availability')
      .insert(rows)

    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/practitioner/availability')
  return { success: true }
}

export async function addMyOverride(formData: FormData) {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { error }

  const date = formData.get('date') as string
  const isAvailable = formData.get('isAvailable') === 'true'
  const startTime = formData.get('startTime') as string || null
  const endTime = formData.get('endTime') as string || null
  const reason = formData.get('reason') as string || null

  if (!date) return { error: 'Date is required' }

  const supabase = await createClient()

  const { error: insertError } = await supabase
    .from('availability_overrides')
    .insert({
      tenant_id: profile.tenant_id,
      practitioner_id: profile.id,
      date,
      is_available: isAvailable,
      start_time: startTime,
      end_time: endTime,
      reason: reason?.trim() || null,
    })

  if (insertError) return { error: insertError.message }

  revalidatePath('/practitioner/availability')
  return { success: true }
}

export async function removeMyOverride(overrideId: string) {
  const { profile, error } = await getPractitionerProfile()
  if (error || !profile) return { error }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('availability_overrides')
    .delete()
    .eq('id', overrideId)
    .eq('practitioner_id', profile.id)
    .eq('tenant_id', profile.tenant_id)

  if (deleteError) return { error: deleteError.message }

  revalidatePath('/practitioner/availability')
  return { success: true }
}
