'use server'

import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateBranding(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const settings = {
    business_name: formData.get('business_name') as string || undefined,
    accent_color: formData.get('accent_color') as string || undefined,
    logo_url: formData.get('logo_url') as string || undefined,
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tenants')
    .update({ settings })
    .eq('id', auth.tenantId)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateModules(modulesJson: string) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  let modules: Array<{
    module_id: string
    enabled: boolean
    custom_title: string | null
    sort_order: number
    config: Record<string, unknown>
  }>

  try {
    modules = JSON.parse(modulesJson)
  } catch {
    return { error: 'Invalid JSON' }
  }

  const supabase = await createClient()

  for (const mod of modules) {
    const { error } = await supabase
      .from('tenant_modules')
      .upsert({
        tenant_id: auth.tenantId,
        module_id: mod.module_id,
        enabled: mod.enabled,
        custom_title: mod.custom_title,
        sort_order: mod.sort_order,
        config: mod.config,
      }, { onConflict: 'tenant_id,module_id' })

    if (error) return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
