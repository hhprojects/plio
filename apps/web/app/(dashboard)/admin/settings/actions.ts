'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  default_buffer_minutes: z.coerce.number().min(0).max(60),
  slot_interval_minutes: z.coerce.number().refine((v) => [15, 30].includes(v)),
  cancellation_window_hours: z.coerce.number().min(0).max(48),
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
// getTenantSettings
// ---------------------------------------------------------------------------

export async function getTenantSettings(): Promise<{
  data: { settings: Record<string, unknown> | null; business_type: string } | null
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: null, error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: tenant, error: queryError } = await supabase
    .from('tenants')
    .select('settings, business_type')
    .eq('id', tenantResult.tenantId)
    .single()

  if (queryError) {
    return { data: null, error: queryError.message }
  }

  return {
    data: {
      settings: tenant.settings as Record<string, unknown> | null,
      business_type: tenant.business_type,
    },
  }
}

// ---------------------------------------------------------------------------
// updateTenantSettings
// ---------------------------------------------------------------------------

export async function updateTenantSettings(formData: FormData) {
  const raw = {
    default_buffer_minutes: formData.get('default_buffer_minutes'),
    slot_interval_minutes: formData.get('slot_interval_minutes'),
    cancellation_window_hours: formData.get('cancellation_window_hours'),
  }

  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  // Fetch existing settings to merge
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenantResult.tenantId)
    .single()

  const existingSettings = (tenant?.settings as Record<string, unknown>) ?? {}

  const mergedSettings = {
    ...existingSettings,
    default_buffer_minutes: data.default_buffer_minutes,
    slot_interval_minutes: data.slot_interval_minutes,
    cancellation_window_hours: data.cancellation_window_hours,
  }

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ settings: mergedSettings })
    .eq('id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/settings')

  return { success: true }
}
