import { requireRole } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsPageClient } from './page-client'

export default async function SettingsPage() {
  await requireRole(['super_admin', 'admin'])

  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const supabase = await createClient()

  const [tenantResult, modulesResult] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, settings')
      .eq('id', auth.tenantId)
      .single(),
    supabase
      .from('tenant_modules')
      .select('*, module:modules(*)')
      .eq('tenant_id', auth.tenantId)
      .order('sort_order'),
  ])

  const tenant = tenantResult.data
  const tenantModules = modulesResult.data ?? []

  return (
    <SettingsPageClient
      tenant={tenant}
      tenantModules={tenantModules}
    />
  )
}
