import { Suspense } from 'react'
import { getAppointments } from './actions'
import { AppointmentsPageClient } from './page-client'

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading appointments...</div>}>
      <AppointmentsData />
    </Suspense>
  )
}

async function AppointmentsData() {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - 14)
  const to = new Date(today)
  to.setDate(to.getDate() + 28)

  const dateFrom = from.toISOString().substring(0, 10)
  const dateTo = to.toISOString().substring(0, 10)

  const result = await getAppointments(dateFrom, dateTo)

  return (
    <AppointmentsPageClient
      initialAppointments={result.data}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
    />
  )
}
