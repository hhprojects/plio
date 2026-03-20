import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/module-guard'
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
  await requireRole(['admin', 'super_admin'])
  const tutorsResult = await getTutors()
  return <TutorsPageClient initialTutors={tutorsResult.data} />
}
