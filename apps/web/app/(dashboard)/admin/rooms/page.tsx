import { Suspense } from 'react'
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
  const roomsResult = await getRooms()
  return <RoomsPageClient initialRooms={roomsResult.data} />
}
