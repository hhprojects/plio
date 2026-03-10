'use server'

import { requireRole } from '@/lib/auth/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateTenantTier(tenantId: string, tier: string) {
  await requireRole(['super_admin'])
  const supabase = createAdminClient()

  const validTiers = ['free', 'starter', 'pro']
  if (!validTiers.includes(tier)) {
    return { error: 'Invalid subscription tier' }
  }

  const { error } = await supabase
    .from('tenants')
    .update({ subscription_tier: tier })
    .eq('id', tenantId)

  if (error) {
    return { error: 'Failed to update subscription tier' }
  }

  revalidatePath('/platform/tenants')
  return { success: true }
}

export async function toggleTenantActive(tenantId: string, active: boolean) {
  await requireRole(['super_admin'])
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('tenants')
    .update({ active })
    .eq('id', tenantId)

  if (error) {
    return { error: 'Failed to update tenant status' }
  }

  revalidatePath('/platform/tenants')
  return { success: true }
}

export async function fetchTenantDetails(tenantId: string) {
  await requireRole(['super_admin'])
  const supabase = createAdminClient()

  const [modulesRes, usersRes] = await Promise.all([
    supabase
      .from('tenant_modules')
      .select('*, module:modules(slug, default_title, always_on)')
      .eq('tenant_id', tenantId)
      .order('sort_order'),
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('tenant_id', tenantId)
      .order('role')
      .order('full_name'),
  ])

  return {
    modules: modulesRes.data ?? [],
    users: usersRes.data ?? [],
  }
}
