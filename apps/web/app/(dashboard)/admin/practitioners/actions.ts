'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Helper: get tenant ID for the current user
// ---------------------------------------------------------------------------

async function getTenantId(): Promise<{ tenantId: string | null; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { tenantId: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { tenantId: null, error: 'Profile not found' }
  }

  return { tenantId: profile.tenant_id }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PractitionerWithCounts {
  id: string
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  appointmentCount: number
}

export interface PractitionerAvailabilityRow {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface AvailabilityOverrideRow {
  id: string
  date: string
  isAvailable: boolean
  startTime: string | null
  endTime: string | null
  reason: string | null
}

export interface UpcomingAppointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  serviceTitle: string
  clientName: string
}

// ---------------------------------------------------------------------------
// getPractitioners
// ---------------------------------------------------------------------------

export async function getPractitioners(): Promise<{
  data: PractitionerWithCounts[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch profiles where role is practitioner
  const { data: practitioners, error: queryError } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at')
    .eq('tenant_id', tenantId)
    .eq('role', 'practitioner')
    .order('full_name', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!practitioners || practitioners.length === 0) {
    return { data: [] }
  }

  const practitionerIds = practitioners.map((p) => p.id)

  // 2. Count upcoming confirmed appointments for each practitioner
  const today = new Date().toISOString().split('T')[0]!

  const { data: appointments } = await supabase
    .from('appointments')
    .select('practitioner_id')
    .in('practitioner_id', practitionerIds)
    .eq('tenant_id', tenantId)
    .eq('status', 'confirmed')
    .gte('date', today)

  const appointmentCountMap: Record<string, number> = {}
  for (const appt of appointments ?? []) {
    appointmentCountMap[appt.practitioner_id] =
      (appointmentCountMap[appt.practitioner_id] ?? 0) + 1
  }

  // 3. Map to PractitionerWithCounts
  const mapped: PractitionerWithCounts[] = practitioners.map((p) => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    phone: p.phone,
    isActive: p.is_active,
    createdAt: p.created_at,
    appointmentCount: appointmentCountMap[p.id] ?? 0,
  }))

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// getPractitionerAvailability
// ---------------------------------------------------------------------------

export async function getPractitionerAvailability(
  practitionerId: string
): Promise<{ data: PractitionerAvailabilityRow[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('practitioner_availability')
    .select('id, day_of_week, start_time, end_time')
    .eq('practitioner_id', practitionerId)
    .eq('tenant_id', tenantResult.tenantId)
    .order('day_of_week', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
    })),
  }
}

// ---------------------------------------------------------------------------
// getAvailabilityOverrides
// ---------------------------------------------------------------------------

export async function getAvailabilityOverrides(
  practitionerId: string
): Promise<{ data: AvailabilityOverrideRow[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('availability_overrides')
    .select('id, date, is_available, start_time, end_time, reason')
    .eq('practitioner_id', practitionerId)
    .eq('tenant_id', tenantResult.tenantId)
    .order('date', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      date: row.date,
      isAvailable: row.is_available,
      startTime: row.start_time,
      endTime: row.end_time,
      reason: row.reason,
    })),
  }
}

// ---------------------------------------------------------------------------
// getUpcomingAppointments
// ---------------------------------------------------------------------------

export async function getUpcomingAppointments(
  practitionerId: string
): Promise<{ data: UpcomingAppointment[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]!

  const { data, error } = await supabase
    .from('appointments')
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      services!inner(title),
      clients!inner(full_name)
    `
    )
    .eq('practitioner_id', practitionerId)
    .eq('tenant_id', tenantResult.tenantId)
    .eq('status', 'confirmed')
    .gte('date', today)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(10)

  if (error) {
    return { data: [], error: error.message }
  }

  return {
    data: (data ?? []).map((row) => {
      const service = row.services as unknown as { title: string }
      const client = row.clients as unknown as { full_name: string }
      return {
        id: row.id,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        serviceTitle: service?.title ?? 'Unknown',
        clientName: client?.full_name ?? 'Unknown',
      }
    }),
  }
}

// ---------------------------------------------------------------------------
// upsertAvailability
// ---------------------------------------------------------------------------

const availabilityEntrySchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
})

export async function upsertAvailability(formData: FormData): Promise<{ error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const practitionerId = formData.get('practitioner_id') as string
  const entriesJson = formData.get('entries') as string

  if (!practitionerId || !entriesJson) {
    return { error: 'Missing required fields' }
  }

  let entries: unknown[]
  try {
    entries = JSON.parse(entriesJson)
  } catch {
    return { error: 'Invalid JSON' }
  }

  const parsed = z.array(availabilityEntrySchema).safeParse(entries)
  if (!parsed.success) {
    return { error: parsed.error.message }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // Delete all existing availability for this practitioner
  const { error: deleteError } = await supabase
    .from('practitioner_availability')
    .delete()
    .eq('practitioner_id', practitionerId)
    .eq('tenant_id', tenantId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Insert new rows
  if (parsed.data.length > 0) {
    const rows = parsed.data.map((entry) => ({
      tenant_id: tenantId,
      practitioner_id: practitionerId,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
    }))

    const { error: insertError } = await supabase
      .from('practitioner_availability')
      .insert(rows)

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath('/admin/practitioners')
  return {}
}

// ---------------------------------------------------------------------------
// createOverride
// ---------------------------------------------------------------------------

const overrideSchema = z.object({
  practitioner_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_available: z.boolean(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  reason: z.string().nullable(),
})

export async function createOverride(formData: FormData): Promise<{ error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const raw = {
    practitioner_id: formData.get('practitioner_id') as string,
    date: formData.get('date') as string,
    is_available: formData.get('is_available') === 'true',
    start_time: (formData.get('start_time') as string) || null,
    end_time: (formData.get('end_time') as string) || null,
    reason: (formData.get('reason') as string) || null,
  }

  const parsed = overrideSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.message }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('availability_overrides').insert({
    tenant_id: tenantResult.tenantId,
    practitioner_id: parsed.data.practitioner_id,
    date: parsed.data.date,
    is_available: parsed.data.is_available,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time,
    reason: parsed.data.reason,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/practitioners')
  return {}
}

// ---------------------------------------------------------------------------
// deleteOverride
// ---------------------------------------------------------------------------

export async function deleteOverride(overrideId: string): Promise<{ error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('availability_overrides')
    .delete()
    .eq('id', overrideId)
    .eq('tenant_id', tenantResult.tenantId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/practitioners')
  return {}
}
