import { Suspense } from 'react'
import { getClients } from './actions'
import { ClientsPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function ClientsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <ClientsData />
    </Suspense>
  )
}

async function ClientsData() {
  const clientsResult = await getClients()

  return <ClientsPageClient initialClients={clientsResult.data} />
}
