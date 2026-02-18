'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import type { TenantSettings } from '@plio/db'

// ---------------------------------------------------------------------------
// Zod schema for all settings
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  // Feature toggles
  credits_enabled: z.coerce.boolean().optional(),
  makeup_booking_enabled: z.coerce.boolean().optional(),
  qr_checkin_enabled: z.coerce.boolean().optional(),

  // Branding
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),

  // Cancellation policy
  cancellation_hours: z.coerce.number().min(0).max(72).optional(),
  auto_refund_on_cancel: z.coerce.boolean().optional(),

  // Notifications
  email_class_reminders: z.coerce.boolean().optional(),
  email_cancellation_notices: z.coerce.boolean().optional(),
  email_payment_receipts: z.coerce.boolean().optional(),
  reminder_hours_before: z.coerce.number().min(1).max(72).optional(),

  // Scheduling (education)
  default_class_duration_minutes: z.coerce.number().min(15).max(240).optional(),
  max_students_per_class: z.coerce.number().min(1).max(100).optional().nullable(),
  booking_lead_time_hours: z.coerce.number().min(0).max(72).optional(),

  // Scheduling (wellness)
  default_buffer_minutes: z.coerce.number().min(0).max(60).optional(),
  slot_interval_minutes: z.coerce.number().refine((v) => [15, 30].includes(v)).optional(),
  cancellation_window_hours: z.coerce.number().min(0).max(48).optional(),
})

// ---------------------------------------------------------------------------
// getTenantSettings
// ---------------------------------------------------------------------------

export async function getTenantSettings(): Promise<{
  data: {
    settings: TenantSettings
    business_type: string
    tenant_name: string
  } | null
  error?: string
}> {
  const { tenantId, error } = await getTenantId()
  if (error || !tenantId) return { data: null, error: error ?? 'No tenant' }

  const supabase = await createClient()
  const { data: tenant, error: queryError } = await supabase
    .from('tenants')
    .select('name, settings, business_type')
    .eq('id', tenantId)
    .single()

  if (queryError || !tenant) return { data: null, error: queryError?.message ?? 'Tenant not found' }

  return {
    data: {
      settings: (tenant.settings as TenantSettings) ?? {},
      business_type: tenant.business_type,
      tenant_name: tenant.name,
    },
  }
}

// ---------------------------------------------------------------------------
// updateTenantSettings
// ---------------------------------------------------------------------------

export async function updateTenantSettings(newSettings: Record<string, unknown>) {
  const parsed = settingsSchema.safeParse(newSettings)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const { tenantId, role, error } = await getTenantId()
  if (error || !tenantId) return { error: error ?? 'No tenant' }
  if (role !== 'admin' && role !== 'super_admin') return { error: 'Not authorized' }

  const supabase = await createClient()

  // Fetch existing settings to merge
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  const existingSettings = (tenant?.settings as Record<string, unknown>) ?? {}

  // Remove undefined values from parsed data, then merge
  const cleanData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) cleanData[key] = value
  }

  const mergedSettings = { ...existingSettings, ...cleanData }

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ settings: mergedSettings })
    .eq('id', tenantId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/parent')
  revalidatePath('/tutor')

  return { success: true }
}

// ---------------------------------------------------------------------------
// uploadLogo
// ---------------------------------------------------------------------------

export async function uploadLogo(formData: FormData) {
  const { tenantId, role, error } = await getTenantId()
  if (error || !tenantId) return { error: error ?? 'No tenant' }
  if (role !== 'admin' && role !== 'super_admin') return { error: 'Not authorized' }

  const file = formData.get('logo') as File | null
  if (!file) return { error: 'No file provided' }
  if (file.size > 2 * 1024 * 1024) return { error: 'File must be under 2MB' }
  if (!file.type.startsWith('image/')) return { error: 'File must be an image' }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${tenantId}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('tenant-assets')
    .upload(path, file, { upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from('tenant-assets')
    .getPublicUrl(path)

  // Save URL to tenant settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantId)
    .single()

  const existingSettings = (tenant?.settings as Record<string, unknown>) ?? {}
  const mergedSettings = { ...existingSettings, logo_url: urlData.publicUrl }

  await supabase
    .from('tenants')
    .update({ settings: mergedSettings })
    .eq('id', tenantId)

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/parent')
  revalidatePath('/tutor')

  return { success: true, url: urlData.publicUrl }
}
