'use server'

import { requireRole } from '@/lib/auth/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function approveWaitlist(id: string) {
  const auth = await requireRole(['super_admin'])
  const supabase = createAdminClient()

  // Fetch the waitlist entry
  const { data: entry, error: fetchError } = await supabase
    .from('waitlist')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !entry) {
    return { error: 'Waitlist entry not found' }
  }

  if (entry.status !== 'pending') {
    return { error: 'Entry has already been reviewed' }
  }

  // Create a slug from the business name
  const slug = entry.business_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Create the tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: entry.business_name,
      slug,
      subscription_tier: 'free',
    })
    .select()
    .single()

  if (tenantError || !tenant) {
    return { error: 'Failed to create tenant' }
  }

  // Mark waitlist entry as approved
  await supabase
    .from('waitlist')
    .update({
      status: 'approved',
      reviewed_by: auth.profileId,
      reviewed_at: new Date().toISOString(),
      tenant_id: tenant.id,
    })
    .eq('id', id)

  revalidatePath('/platform/waitlist')
  revalidatePath('/platform')
  return { success: true, tenantId: tenant.id }
}

export async function rejectWaitlist(id: string) {
  const auth = await requireRole(['super_admin'])
  const supabase = createAdminClient()

  // Fetch the waitlist entry
  const { data: entry, error: fetchError } = await supabase
    .from('waitlist')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !entry) {
    return { error: 'Waitlist entry not found' }
  }

  if (entry.status !== 'pending') {
    return { error: 'Entry has already been reviewed' }
  }

  await supabase
    .from('waitlist')
    .update({
      status: 'rejected',
      reviewed_by: auth.profileId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/platform/waitlist')
  revalidatePath('/platform')
  return { success: true }
}
