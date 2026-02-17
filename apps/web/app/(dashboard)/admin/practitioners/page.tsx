import { Suspense } from 'react'
import { getPractitioners } from './actions'
import { PractitionersPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function PractitionersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <PractitionersData />
    </Suspense>
  )
}

async function PractitionersData() {
  const result = await getPractitioners()
  return <PractitionersPageClient initialPractitioners={result.data} />
}
