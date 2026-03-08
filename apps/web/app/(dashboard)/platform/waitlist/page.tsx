import { requireRole } from '@/lib/auth/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { WaitlistPageClient } from './page-client'

export default async function WaitlistPage() {
  await requireRole(['super_admin'])

  const supabase = createAdminClient()

  const { data: entries } = await supabase
    .from('waitlist')
    .select('*')
    .order('status', { ascending: true }) // pending first
    .order('created_at', { ascending: false })

  return <WaitlistPageClient entries={entries ?? []} />
}
