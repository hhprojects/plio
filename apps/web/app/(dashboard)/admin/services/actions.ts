'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createServiceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  duration_minutes: z.coerce.number().int().min(1, 'Duration is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  buffer_minutes: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.coerce.number().int().min(0).nullable()
  ),
  color_code: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code'),
})

const updateServiceSchema = createServiceSchema.extend({
  id: z.string().uuid('Service ID is required'),
})

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

export interface ServiceWithCounts {
  id: string
  title: string
  description: string | null
  category: string | null
  durationMinutes: number
  price: number
  bufferMinutes: number | null
  colorCode: string
  isActive: boolean
  createdAt: string
  appointmentCount: number
}

// ---------------------------------------------------------------------------
// getServices
// ---------------------------------------------------------------------------

export async function getServices(): Promise<{
  data: ServiceWithCounts[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch all services for this tenant
  const { data: services, error: queryError } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('title', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!services || services.length === 0) {
    return { data: [] }
  }

  const serviceIds = services.map((s) => s.id)

  // 2. Fetch count of upcoming confirmed appointments per service
  const today = new Date().toISOString().slice(0, 10)
  const { data: appointments } = await supabase
    .from('appointments')
    .select('service_id')
    .in('service_id', serviceIds)
    .eq('tenant_id', tenantId)
    .in('status', ['confirmed'])
    .gte('date', today)

  const appointmentCountMap: Record<string, number> = {}
  for (const a of appointments ?? []) {
    appointmentCountMap[a.service_id] = (appointmentCountMap[a.service_id] ?? 0) + 1
  }

  // 3. Map to ServiceWithCounts
  const mapped: ServiceWithCounts[] = services.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    durationMinutes: s.duration_minutes,
    price: s.price,
    bufferMinutes: s.buffer_minutes,
    colorCode: s.color_code,
    isActive: s.is_active,
    createdAt: s.created_at,
    appointmentCount: appointmentCountMap[s.id] ?? 0,
  }))

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// createService
// ---------------------------------------------------------------------------

export async function createService(formData: FormData) {
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    duration_minutes: formData.get('duration_minutes'),
    price: formData.get('price'),
    buffer_minutes: formData.get('buffer_minutes'),
    color_code: formData.get('color_code'),
  }

  const parsed = createServiceSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase.from('services').insert({
    tenant_id: tenantResult.tenantId,
    title: data.title,
    description: data.description || null,
    category: data.category || null,
    duration_minutes: data.duration_minutes,
    price: data.price,
    buffer_minutes: data.buffer_minutes,
    color_code: data.color_code,
    is_active: true,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/services')

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateService
// ---------------------------------------------------------------------------

export async function updateService(formData: FormData) {
  const raw = {
    id: formData.get('id'),
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    duration_minutes: formData.get('duration_minutes'),
    price: formData.get('price'),
    buffer_minutes: formData.get('buffer_minutes'),
    color_code: formData.get('color_code'),
  }

  const parsed = updateServiceSchema.safeParse(raw)
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
    .from('services')
    .update({
      title: data.title,
      description: data.description || null,
      category: data.category || null,
      duration_minutes: data.duration_minutes,
      price: data.price,
      buffer_minutes: data.buffer_minutes,
      color_code: data.color_code,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/services')

  return { success: true }
}

// ---------------------------------------------------------------------------
// toggleServiceActive
// ---------------------------------------------------------------------------

export async function toggleServiceActive(serviceId: string, isActive: boolean) {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', serviceId)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/services')

  return { success: true }
}
