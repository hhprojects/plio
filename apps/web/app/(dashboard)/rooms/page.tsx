import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RoomsPageClient } from './page-client'

export default async function RoomsPage() {
  await requireModule('rooms')
  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const supabase = await createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('name')

  return <RoomsPageClient rooms={rooms ?? []} />
}
