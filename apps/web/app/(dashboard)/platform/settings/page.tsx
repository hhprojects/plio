import { requireRole } from '@/lib/auth/module-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlatformSettingsClient } from './page-client'

export default async function PlatformSettingsPage() {
  await requireRole(['super_admin'])

  const supabase = createAdminClient()

  // Fetch all modules (system defaults)
  const { data: modules } = await supabase
    .from('modules')
    .select('id, slug, default_title, always_on')
    .order('slug')

  return <PlatformSettingsClient modules={modules ?? []} />
}
