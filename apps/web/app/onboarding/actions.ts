'use server'

import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(formData: FormData) {
  const auth = await getTenantId()
  if (!auth.tenantId) return { error: 'Not authenticated' }

  const modulesJson = formData.get('modules') as string
  const businessName = formData.get('business_name') as string
  const accentColor = formData.get('accent_color') as string
  const logoUrl = formData.get('logo_url') as string

  const modules = JSON.parse(modulesJson)
  const supabase = await createClient()

  // Update tenant settings (branding)
  await supabase
    .from('tenants')
    .update({
      settings: {
        business_name: businessName || undefined,
        accent_color: accentColor || undefined,
        logo_url: logoUrl || undefined,
      },
    })
    .eq('id', auth.tenantId)

  // Insert tenant_modules
  const moduleRecords = modules.map((mod: { module_id: string; enabled: boolean; custom_title?: string; config?: Record<string, unknown> }, index: number) => ({
    tenant_id: auth.tenantId!,
    module_id: mod.module_id,
    enabled: mod.enabled,
    custom_title: mod.custom_title || null,
    sort_order: index,
    config: mod.config || {},
  }))

  await supabase.from('tenant_modules').insert(moduleRecords)

  revalidatePath('/dashboard')
  return { success: true }
}
