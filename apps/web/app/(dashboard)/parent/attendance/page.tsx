import { Suspense } from 'react'
import { getAttendanceData } from './actions'
import { AttendancePageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function AttendancePage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} />}>
      <AttendanceData />
    </Suspense>
  )
}

async function AttendanceData() {
  const { data, error } = await getAttendanceData()

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Attendance</h2>
        <p className="text-muted-foreground">Unable to load attendance data.</p>
      </div>
    )
  }

  return <AttendancePageClient data={data} />
}
