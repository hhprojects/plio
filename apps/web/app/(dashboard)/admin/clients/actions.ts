'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createClientSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200),
  phone: z.string().min(1, 'Phone number is required').max(20),
  email: z.string().email('Invalid email').max(200).optional().or(z.literal('')),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

const updateClientSchema = createClientSchema.extend({
  id: z.string().uuid('Client ID is required'),
})

const addClientNoteSchema = z.object({
  client_id: z.string().uuid('Client ID is required'),
  content: z.string().min(1, 'Note content is required').max(5000),
  appointment_id: z.string().uuid().optional().or(z.literal('')),
})

// ---------------------------------------------------------------------------
// Helper: get tenant ID for the current user
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

export interface ClientWithStats {
  id: string
  fullName: string
  phone: string
  email: string | null
  dateOfBirth: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  lastVisit: string | null
  totalVisits: number
}

export interface ClientAppointment {
  id: string
  date: string
  startTime: string
  endTime: string
  serviceTitle: string
  practitionerName: string
  status: string
}

export interface ClientNoteWithDetails {
  id: string
  content: string
  practitionerName: string
  appointmentId: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// getClients
// ---------------------------------------------------------------------------

export async function getClients(): Promise<{
  data: ClientWithStats[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch all clients for this tenant
  const { data: clients, error: queryError } = await supabase
    .from('clients')
    .select('id, full_name, phone, email, date_of_birth, notes, is_active, created_at')
    .eq('tenant_id', tenantId)
    .order('full_name', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!clients || clients.length === 0) {
    return { data: [] }
  }

  const clientIds = clients.map((c) => c.id)

  // 2. Fetch appointments to compute totalVisits and lastVisit per client
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, client_id, date')
    .in('client_id', clientIds)
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')

  // Build maps
  const totalVisitsMap: Record<string, number> = {}
  const lastVisitMap: Record<string, string> = {}

  for (const appt of appointments ?? []) {
    const clientId = appt.client_id
    totalVisitsMap[clientId] = (totalVisitsMap[clientId] ?? 0) + 1

    if (!lastVisitMap[clientId] || appt.date > lastVisitMap[clientId]) {
      lastVisitMap[clientId] = appt.date
    }
  }

  // 3. Map to ClientWithStats
  const mapped: ClientWithStats[] = clients.map((c) => ({
    id: c.id,
    fullName: c.full_name,
    phone: c.phone,
    email: c.email,
    dateOfBirth: c.date_of_birth,
    notes: c.notes,
    isActive: c.is_active,
    createdAt: c.created_at,
    lastVisit: lastVisitMap[c.id] ?? null,
    totalVisits: totalVisitsMap[c.id] ?? 0,
  }))

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// createClient
// ---------------------------------------------------------------------------

export async function createClientAction(formData: FormData) {
  const raw = {
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    date_of_birth: formData.get('date_of_birth'),
    notes: formData.get('notes'),
  }

  const parsed = createClientSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase.from('clients').insert({
    tenant_id: tenantResult.tenantId,
    full_name: data.full_name,
    phone: data.phone,
    email: data.email || null,
    date_of_birth: data.date_of_birth || null,
    notes: data.notes || null,
    is_active: true,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/clients')

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateClient
// ---------------------------------------------------------------------------

export async function updateClientAction(formData: FormData) {
  const raw = {
    id: formData.get('id'),
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    date_of_birth: formData.get('date_of_birth'),
    notes: formData.get('notes'),
  }

  const parsed = updateClientSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('clients')
    .update({
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || null,
      date_of_birth: data.date_of_birth || null,
      notes: data.notes || null,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/clients')

  return { success: true }
}

// ---------------------------------------------------------------------------
// toggleClientActive
// ---------------------------------------------------------------------------

export async function toggleClientActive(clientId: string, isActive: boolean) {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('clients')
    .update({ is_active: isActive })
    .eq('id', clientId)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/clients')

  return { success: true }
}

// ---------------------------------------------------------------------------
// getClientNotes
// ---------------------------------------------------------------------------

export async function getClientNotes(clientId: string): Promise<{
  data: ClientNoteWithDetails[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: notes, error: queryError } = await supabase
    .from('client_notes')
    .select(
      `
      id,
      content,
      appointment_id,
      created_at,
      practitioner:profiles!client_notes_practitioner_id_fkey(full_name)
    `
    )
    .eq('client_id', clientId)
    .eq('tenant_id', tenantResult.tenantId)
    .order('created_at', { ascending: false })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: ClientNoteWithDetails[] = (notes ?? []).map((n) => {
    const practitioner = n.practitioner as unknown as { full_name: string } | null

    return {
      id: n.id,
      content: n.content,
      practitionerName: practitioner?.full_name ?? 'Unknown',
      appointmentId: n.appointment_id,
      createdAt: n.created_at,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// addClientNote
// ---------------------------------------------------------------------------

export async function addClientNote(formData: FormData) {
  const raw = {
    client_id: formData.get('client_id'),
    content: formData.get('content'),
    appointment_id: formData.get('appointment_id'),
  }

  const parsed = addClientNoteSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId || !tenantResult.profileId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase.from('client_notes').insert({
    tenant_id: tenantResult.tenantId,
    client_id: data.client_id,
    practitioner_id: tenantResult.profileId,
    content: data.content,
    appointment_id: data.appointment_id || null,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/clients')

  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteClientNote
// ---------------------------------------------------------------------------

export async function deleteClientNote(noteId: string) {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', noteId)
    .eq('tenant_id', tenantResult.tenantId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath('/admin/clients')

  return { success: true }
}

// ---------------------------------------------------------------------------
// getClientAppointments
// ---------------------------------------------------------------------------

export async function getClientAppointments(clientId: string): Promise<{
  data: ClientAppointment[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: appointments, error: queryError } = await supabase
    .from('appointments')
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      service:services!appointments_service_id_fkey(title),
      practitioner:profiles!appointments_practitioner_id_fkey(full_name)
    `
    )
    .eq('client_id', clientId)
    .eq('tenant_id', tenantResult.tenantId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(50)

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  const mapped: ClientAppointment[] = (appointments ?? []).map((a) => {
    const service = a.service as unknown as { title: string } | null
    const practitioner = a.practitioner as unknown as { full_name: string } | null

    return {
      id: a.id,
      date: a.date,
      startTime: a.start_time,
      endTime: a.end_time,
      serviceTitle: service?.title ?? 'Unknown',
      practitionerName: practitioner?.full_name ?? 'Unknown',
      status: a.status,
    }
  })

  return { data: mapped }
}
