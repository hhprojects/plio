import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/module-guard'
import { getSessions, getHolidays } from './actions'
import { CalendarView } from '@/components/admin/calendar/calendar-view'
import { CalendarSkeleton } from '@/components/ui/table-skeleton'

export default function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage all class schedules. Drag events to reschedule.
        </p>
      </div>
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarData />
      </Suspense>
    </div>
  )
}

async function CalendarData() {
  await requireRole(['admin', 'super_admin'])
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 14)
  const to = new Date(today)
  to.setDate(to.getDate() + 28)

  const dateFrom = from.toISOString().substring(0, 10)
  const dateTo = to.toISOString().substring(0, 10)

  const [instancesResult, holidaysResult] = await Promise.all([
    getSessions(dateFrom, dateTo),
    getHolidays(dateFrom, dateTo),
  ])

  return (
    <CalendarView
      initialInstances={instancesResult.data}
      initialHolidays={holidaysResult.data}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
    />
  )
}
