import { Suspense } from 'react'
import { requireRole } from '@/lib/auth/module-guard'
import { getRooms } from './actions'
import { RoomsPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function RoomsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <RoomsData />
    </Suspense>
  )
}

async function RoomsData() {
  await requireRole(['admin', 'super_admin'])
  const roomsResult = await getRooms()
  return <RoomsPageClient initialRooms={roomsResult.data} />
}
