'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Not authorized')
  }

  return profile.id
}

export async function getPlatformStats() {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const [tenants, profiles, waitlist] = await Promise.all([
    admin.from('tenants').select('id, business_type, subscription_tier, created_at'),
    admin.from('profiles').select('id, role', { count: 'exact', head: true }),
    admin.from('waitlist').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const tenantData = tenants.data ?? []
  const educationCount = tenantData.filter((t) => t.business_type === 'education').length
  const wellnessCount = tenantData.filter((t) => t.business_type === 'wellness').length

  // Recent tenants (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentTenants = tenantData.filter(
    (t) => new Date(t.created_at) >= thirtyDaysAgo
  ).length

  return {
    totalTenants: tenantData.length,
    educationCount,
    wellnessCount,
    totalUsers: profiles.count ?? 0,
    pendingWaitlist: waitlist.count ?? 0,
    recentTenants,
  }
}

export async function getAllTenants() {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('tenants')
    .select('id, name, slug, business_type, subscription_tier, settings, created_at')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data }
}

export async function getTenantDetail(tenantId: string) {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const [tenant, userCount, studentCount] = await Promise.all([
    admin
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single(),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    admin
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
  ])

  if (tenant.error || !tenant.data) return { data: null, error: 'Tenant not found' }

  return {
    data: {
      ...tenant.data,
      userCount: userCount.count ?? 0,
      studentCount: studentCount.count ?? 0,
    },
  }
}

export async function updateTenantSubscription(tenantId: string, tier: string) {
  await requireSuperAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('tenants')
    .update({ subscription_tier: tier })
    .eq('id', tenantId)

  if (error) return { error: error.message }
  revalidatePath('/admin/platform/tenants')
  return { error: null }
}
