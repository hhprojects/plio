import { requireModule } from '@/lib/auth/module-guard'
import { getTenantId } from '@/lib/auth/cached'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarPageClient } from './page-client'

export default async function CalendarPage() {
  const mod = await requireModule('calendar')
  const auth = await getTenantId()
  if (!auth.tenantId) redirect('/login')

  const supabase = await createClient()

  // Fetch sessions for current month range (expanded ±1 month for calendar edges)
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0]

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*, service:services(id, name, color), team_member:team_members(id, name, color)')
    .eq('tenant_id', auth.tenantId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('start_time')

  // Fetch services, team members, rooms, and contacts
  const [servicesResult, teamResult, roomsResult, contactsResult] = await Promise.all([
    supabase.from('services').select('id, name, color, duration_minutes').eq('tenant_id', auth.tenantId).eq('active', true),
    supabase.from('team_members').select('id, name, color').eq('tenant_id', auth.tenantId),
    supabase.from('rooms').select('id, name').eq('tenant_id', auth.tenantId).eq('is_active', true),
    supabase.from('contacts').select('id, name').eq('tenant_id', auth.tenantId),
  ])

  const calendarConfig = (mod.config as Record<string, unknown>) ?? {}

  return (
    <CalendarPageClient
      sessions={sessions ?? []}
      services={servicesResult.data ?? []}
      teamMembers={teamResult.data ?? []}
      rooms={roomsResult.data ?? []}
      contacts={contactsResult.data ?? []}
      calendarConfig={calendarConfig}
      role={auth.role!}
    />
  )
}
