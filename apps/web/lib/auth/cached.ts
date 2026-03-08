import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

export const getSessionProfile = cache(async () => {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role, full_name, email')
    .eq('user_id', user.id)
    .single()

  return profile
})

export const getTenantId = cache(async (): Promise<{
  tenantId: string | null
  profileId: string | null
  role: string | null
  error?: string
}> => {
  const profile = await getSessionProfile()
  if (!profile) {
    return { tenantId: null, profileId: null, role: null, error: 'Not authenticated' }
  }
  return {
    tenantId: profile.tenant_id,
    profileId: profile.id,
    role: profile.role,
  }
})

export const getTenantModules = cache(async () => {
  const auth = await getTenantId()
  if (auth.error || !auth.tenantId) return { modules: [], error: auth.error }
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_modules')
    .select('*, module:modules(*)')
    .eq('tenant_id', auth.tenantId)
    .eq('enabled', true)
    .order('sort_order')
  return { modules: data ?? [], error: null }
})
