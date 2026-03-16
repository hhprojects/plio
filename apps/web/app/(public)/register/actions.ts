'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const waitlistFormSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200),
  contact_email: z.string().email('Please enter a valid email'),
  contact_phone: z.string().min(8, 'Phone number is required').max(20),
  business_type: z.enum(['tuition', 'yoga', 'music', 'enrichment', 'other']),
  message: z.string().max(2000).optional().or(z.literal('')),
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)
}

async function ensureUniqueSlug(slug: string): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('tenants')
    .select('slug')
    .like('slug', `${slug}%`)

  if (!data || data.length === 0) return slug

  const existing = new Set(data.map((t) => t.slug))
  if (!existing.has(slug)) return slug

  let counter = 2
  while (existing.has(`${slug}-${counter}`)) {
    counter++
  }
  return `${slug}-${counter}`
}

export async function submitWaitlistForm(formData: FormData) {
  const raw = {
    business_name: formData.get('business_name'),
    contact_email: formData.get('contact_email'),
    contact_phone: formData.get('contact_phone'),
    business_type: formData.get('business_type'),
    message: formData.get('message'),
  }

  const parsed = waitlistFormSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const admin = createAdminClient()

  // Check if email already registered
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  if (existingUsers?.users?.some((u) => u.email === data.contact_email)) {
    return { error: 'An account with this email already exists. Please log in instead.' }
  }

  // 1. Generate unique slug
  const baseSlug = generateSlug(data.business_name)
  const slug = await ensureUniqueSlug(baseSlug || 'business')

  // 2. Create the tenant
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({
      name: data.business_name,
      slug,
      settings: {
        timezone: 'Asia/Singapore',
        currency: 'SGD',
        cancellation_hours: 24,
        gst_registered: false,
        gst_rate: 9,
      },
      subscription_tier: 'free',
    })
    .select()
    .single()

  if (tenantError || !tenant) {
    console.error('[register] Failed to create tenant:', tenantError)
    return { error: 'Failed to create your account. Please try again.' }
  }

  // 3. Create auth user with default password
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email: data.contact_email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        tenant_id: tenant.id,
        role: 'admin',
        full_name: data.business_name,
      },
    })

  if (authError || !authUser?.user) {
    // Rollback: delete tenant
    await admin.from('tenants').delete().eq('id', tenant.id)
    console.error('[register] Failed to create user:', authError)
    return { error: 'Failed to create your account. Please try again.' }
  }

  // 4. Also record in waitlist for tracking (auto-approved)
  await admin.from('waitlist').insert({
    business_name: data.business_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    business_type: data.business_type,
    message: data.message || null,
    status: 'approved',
    tenant_id: tenant.id,
  })

  return { success: true, email: data.contact_email }
}
