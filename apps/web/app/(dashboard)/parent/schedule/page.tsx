import { Suspense } from 'react'
import { getParentSchedule } from './actions'
import { SchedulePageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function ParentSchedulePage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} />}>
      <ScheduleData />
    </Suspense>
  )
}

async function ScheduleData() {
  const { data, error } = await getParentSchedule()

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Schedule</h2>
        <p className="text-muted-foreground">Unable to load schedule.</p>
      </div>
    )
  }

  return <SchedulePageClient data={data} />
}
