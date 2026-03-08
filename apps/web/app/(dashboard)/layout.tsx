import { getTenantId, getTenantModules } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getTenantId()
  if (auth.error || !auth.tenantId) redirect('/login')

  const { modules } = await getTenantModules()

  // Fetch tenant for branding
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, settings')
    .eq('id', auth.tenantId)
    .single()

  return (
    <DashboardShell
      modules={modules ?? []}
      role={auth.role!}
      tenantName={tenant?.name ?? 'Plio'}
      tenantSettings={tenant?.settings ?? {}}
    >
      {children}
    </DashboardShell>
  )
}
