import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { BookingPageClient } from './page-client'

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  // Lookup tenant by slug
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, settings')
    .eq('slug', slug)
    .single()

  if (!tenant) notFound()

  // Check if booking module is enabled
  const { data: tenantModules } = await supabase
    .from('tenant_modules')
    .select('*, module:modules(*)')
    .eq('tenant_id', tenant.id)
    .eq('enabled', true)

  const isBookingEnabled = tenantModules?.some(
    (tm: any) => tm.module?.slug === 'booking'
  )
  if (!isBookingEnabled) notFound()

  // Fetch bookable services
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price, currency, buffer_minutes, color')
    .eq('tenant_id', tenant.id)
    .eq('type', 'bookable')
    .eq('active', true)

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name, color')
    .eq('tenant_id', tenant.id)

  return (
    <BookingPageClient
      tenant={{ id: tenant.id, name: tenant.name, settings: tenant.settings }}
      services={services ?? []}
      teamMembers={teamMembers ?? []}
      slug={slug}
    />
  )
}
