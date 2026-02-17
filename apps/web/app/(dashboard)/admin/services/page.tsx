import { Suspense } from 'react'
import { getServices } from './actions'
import { ServicesPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function ServicesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ServicesData />
    </Suspense>
  )
}

async function ServicesData() {
  const result = await getServices()
  return <ServicesPageClient initialServices={result.data} />
}
