import { Suspense } from 'react'
import { getTutors } from './actions'
import { TutorsPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function TutorsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TutorsData />
    </Suspense>
  )
}

async function TutorsData() {
  const tutorsResult = await getTutors()
  return <TutorsPageClient initialTutors={tutorsResult.data} />
}
