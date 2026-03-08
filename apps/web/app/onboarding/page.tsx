import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingPageClient } from './page-client'

export default async function OnboardingPage() {
  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  // Fetch all system modules
  const supabase = await createClient()
  const { data: modules } = await supabase
    .from('modules')
    .select('*')
    .order('always_on', { ascending: false })

  // Check if already onboarded
  const { data: existingModules } = await supabase
    .from('tenant_modules')
    .select('id')
    .eq('tenant_id', auth.tenantId)
    .limit(1)

  if (existingModules && existingModules.length > 0) {
    redirect('/dashboard')
  }

  return <OnboardingPageClient modules={modules ?? []} tenantId={auth.tenantId} />
}
