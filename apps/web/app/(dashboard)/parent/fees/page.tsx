import { Suspense } from 'react'
import { getParentInvoices } from './actions'
import { ParentFeesClient } from './page-client'

export default function ParentFeesPage() {
  return (
    <Suspense fallback={<div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="h-32 animate-pulse rounded bg-gray-200" />
    </div>}>
      <FeesData />
    </Suspense>
  )
}

async function FeesData() {
  const { data } = await getParentInvoices()
  return <ParentFeesClient invoices={data} />
}
