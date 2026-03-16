import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingPageClient } from './page-client'

export default async function BookingPage() {
  await requireModule('booking')

  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const canWrite = !!auth.role && ['super_admin', 'admin'].includes(auth.role)

  const supabase = await createClient()

  // Fetch appointments with related data
  const { data: appointments } = await supabase
    .from('sessions')
    .select(`
      *,
      service:services(id, name, color, duration_minutes, price, currency),
      team_member:team_members(id, name)
    `)
    .eq('tenant_id', auth.tenantId)
    .eq('type', 'appointment')
    .order('date', { ascending: false })
    .order('start_time', { ascending: false })

  // Fetch enrollments to get client info for each appointment
  const sessionIds = (appointments ?? []).map((a) => a.id)
  let enrollmentsWithContacts: Array<{
    session_id: string
    contact: { id: string; name: string; email: string; phone: string | null } | null
  }> = []

  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from('enrollments')
      .select('session_id, contact:contacts(id, name, email, phone)')
      .eq('tenant_id', auth.tenantId)
      .in('session_id', sessionIds)

    enrollmentsWithContacts = (data ?? []) as unknown as typeof enrollmentsWithContacts
  }

  // Build a map of session_id -> contact
  const contactBySession = new Map(
    enrollmentsWithContacts.map((e) => [e.session_id, e.contact])
  )

  // Merge into appointment data
  const bookings = (appointments ?? []).map((a) => ({
    ...a,
    client: contactBySession.get(a.id) ?? null,
  }))

  // ── Settings data ─────────────────────────────────────────────────────

  // Fetch tenant for slug and settings
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug, settings')
    .eq('id', auth.tenantId)
    .single()

  // Fetch all services for bookable toggles
  const { data: services } = await supabase
    .from('services')
    .select('id, name, type, duration_minutes, price, currency, active')
    .eq('tenant_id', auth.tenantId)
    .eq('active', true)
    .order('name')

  // Fetch team members and their availability
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('id, name')
    .eq('tenant_id', auth.tenantId)
    .order('name')

  const { data: availability } = await supabase
    .from('team_availability')
    .select('*')
    .eq('tenant_id', auth.tenantId)
    .order('day_of_week')
    .order('start_time')

  return (
    <BookingPageClient
      bookings={bookings}
      tenant={{
        slug: tenant?.slug ?? '',
        settings: tenant?.settings ?? null,
      }}
      services={services ?? []}
      teamMembers={teamMembers ?? []}
      availability={availability ?? []}
      canWrite={canWrite}
    />
  )
}
