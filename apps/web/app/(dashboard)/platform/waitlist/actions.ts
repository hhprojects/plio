'use server'

import { requireRole } from '@/lib/auth/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendEmail, WaitlistApprovedEmail } from '@plio/email'
import crypto from 'crypto'

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

  // 1. Create the tenant
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

  // 2. Seed default tenant_modules
  const { data: allModules } = await supabase
    .from('modules')
    .select('id, slug, always_on')

  if (allModules && allModules.length > 0) {
    const disabledByDefault = ['rooms', 'invoicing']
    const moduleInserts = allModules.map((mod, idx) => ({
      tenant_id: tenant.id,
      module_id: mod.id,
      enabled: mod.always_on || !disabledByDefault.includes(mod.slug),
      sort_order: idx,
    }))

    await supabase.from('tenant_modules').insert(moduleInserts)
  }

  // 3. Create invitation
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await supabase.from('invitations').insert({
    tenant_id: tenant.id,
    email: entry.contact_email,
    full_name: entry.business_name,
    role: 'admin',
    invited_by: auth.profileId,
    token,
    status: 'pending',
    expires_at: expiresAt.toISOString(),
  })

  // 4. Mark waitlist entry as approved
  await supabase
    .from('waitlist')
    .update({
      status: 'approved',
      reviewed_by: auth.profileId,
      reviewed_at: new Date().toISOString(),
      tenant_id: tenant.id,
    })
    .eq('id', id)

  // 5. Send approval email (best-effort, don't block)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`

  try {
    await sendEmail({
      to: entry.contact_email,
      subject: `Your Plio account for ${entry.business_name} is ready!`,
      react: WaitlistApprovedEmail({
        businessName: entry.business_name,
        contactName: entry.business_name,
        loginUrl: inviteUrl,
      }),
    })
  } catch (err) {
    console.error('[waitlist] Failed to send approval email:', err)
  }

  revalidatePath('/platform/waitlist')
  revalidatePath('/platform/tenants')
  revalidatePath('/dashboard')
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
  revalidatePath('/dashboard')
  return { success: true }
}
