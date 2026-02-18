import { Suspense } from 'react'
import { getAllTenants } from '../actions'
import { TenantsPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function TenantsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TenantsData />
    </Suspense>
  )
}

async function TenantsData() {
  const { data } = await getAllTenants()
  return <TenantsPageClient initialTenants={data ?? []} />
}
