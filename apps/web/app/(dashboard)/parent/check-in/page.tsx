import { Suspense } from 'react'
import { getTodayEnrollments } from './actions'
import { CheckInPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function CheckInPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={3} />}>
      <CheckInData />
    </Suspense>
  )
}

async function CheckInData() {
  const { data, error } = await getTodayEnrollments()

  return <CheckInPageClient enrollments={data ?? []} error={error} />
}
