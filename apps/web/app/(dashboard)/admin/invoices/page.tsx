import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import { requireRole } from '@/lib/auth/module-guard'
import { getInvoices } from './actions'
import { InvoicesPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function InvoicesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <InvoicesData />
    </Suspense>
  )
}

async function InvoicesData() {
  await requireRole(['admin', 'super_admin'])
  const { tenantId } = await getTenantId()
  const supabase = await createClient()

  const [invoicesResult, parentsResult] = await Promise.all([
    getInvoices(),
    tenantId
      ? supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('tenant_id', tenantId)
          .eq('role', 'parent')
          .eq('is_active', true)
          .order('full_name')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <InvoicesPageClient
      initialInvoices={invoicesResult.data}
      parents={parentsResult.data ?? []}
    />
  )
}
