import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamPageClient } from './page-client'

export default async function TeamPage() {
  await requireModule('team')

  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const canWrite = !!auth.role && ['super_admin', 'admin'].includes(auth.role)

  const supabase = await createClient()

  const { data: members } = await supabase
    .from('team_members')
    .select('*, team_availability(*)')
    .eq('tenant_id', auth.tenantId)
    .order('name')

  return <TeamPageClient members={members ?? []} canWrite={canWrite} />
}
