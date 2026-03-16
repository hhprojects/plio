import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import { getRecurringSchedules } from './actions'
import { SchedulesPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function SchedulesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <SchedulesData />
    </Suspense>
  )
}

async function SchedulesData() {
  const { tenantId } = await getTenantId()
  const supabase = await createClient()

  const [schedulesResult, servicesResult, tutorsResult, roomsResult] = await Promise.all([
    getRecurringSchedules(),
    tenantId
      ? supabase
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('active', true)
          .order('name')
      : Promise.resolve({ data: [] }),
    tenantId
      ? supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', tenantId)
          .in('role', ['admin', 'staff'])
          .eq('is_active', true)
          .order('full_name')
      : Promise.resolve({ data: [] }),
    tenantId
      ? supabase
          .from('rooms')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <SchedulesPageClient
      schedules={schedulesResult.data}
      services={servicesResult.data ?? []}
      tutors={tutorsResult.data ?? []}
      rooms={roomsResult.data ?? []}
    />
  )
}
