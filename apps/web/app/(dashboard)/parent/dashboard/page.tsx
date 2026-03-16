import { Suspense } from 'react'
import { getParentDashboardData } from './actions'
import { ParentDashboardClient } from './page-client'
import { CardsSkeleton } from '@/components/ui/table-skeleton'

export default function ParentDashboardPage() {
  return (
    <Suspense fallback={<CardsSkeleton cards={4} />}>
      <DashboardData />
    </Suspense>
  )
}

async function DashboardData() {
  const { data, error } = await getParentDashboardData()

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">Unable to load dashboard.</p>
      </div>
    )
  }

  return <ParentDashboardClient data={data} />
}
