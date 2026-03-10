import { getTenantId, getTenantModules } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = await getTenantId()
  if (auth.error || !auth.tenantId) redirect('/login')

  const { modules } = await getTenantModules()

  // Fetch tenant for branding + active status
  const supabase = await createClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, settings, active')
    .eq('id', auth.tenantId)
    .single()

  // Block disabled tenants (super_admin bypasses this)
  if (tenant && !tenant.active && auth.role !== 'super_admin') {
    redirect('/disabled')
  }

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
