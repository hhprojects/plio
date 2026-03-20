'use server'

import { createClient } from '@/lib/supabase/server'

async function getParentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null, email: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'client') {
    return { error: 'Not a client', profile: null, email: null }
  }

  return { error: null, profile, email: user.email! }
}

export async function getAttendanceData(dependentId?: string) {
  const { profile, email, error } = await getParentProfile()
  if (error || !profile || !email) return { data: null, error }

  const supabase = await createClient()

  // Find contact by email
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!contact) return { data: { children: [], entries: [], summary: null } }

  // Get dependents
  const { data: children } = await supabase
    .from('contact_dependents')
    .select('id, name')
    .eq('contact_id', contact.id)
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  if (!children || children.length === 0) {
    return { data: { children: [], entries: [], summary: null } }
  }

  const targetDependentId = dependentId || children[0].id

  // Verify dependent belongs to parent
  const isOwn = children.some((c) => c.id === targetDependentId)
  if (!isOwn) return { data: null, error: 'Not authorized' }

  // Fetch enrollments for this dependent
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      checked_in_at,
      session:sessions!inner(
        date,
        start_time,
        end_time,
        service:services(name, color)
      )
    `)
    .eq('dependent_id', targetDependentId)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(200)

  const entries = (enrollments ?? []).map((e) => {
    const session = e.session as unknown as {
      date: string
      start_time: string
      end_time: string
      service: { name: string; color: string } | null
    }
    return {
      id: e.id,
      date: session.date,
      startTime: session.start_time,
      endTime: session.end_time,
      serviceName: session.service?.name ?? 'Unknown',
      serviceColor: session.service?.color ?? '#6366f1',
      status: e.status,
      checkedInAt: e.checked_in_at,
    }
  })

  // Compute summary
  const total = entries.length
  const attended = entries.filter((e) => e.status === 'attended').length
  const noShow = entries.filter((e) => e.status === 'no_show').length
  const cancelled = entries.filter((e) => e.status === 'cancelled').length
  const makeup = entries.filter((e) => e.status === 'makeup').length
  const attendanceRate = attended + noShow > 0 ? Math.round((attended / (attended + noShow)) * 100) : 0
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

  return {
    data: {
      children: children.map((c) => ({ id: c.id, fullName: c.name })),
      entries,
      summary: {
        total,
        attended,
        noShow,
        cancelled,
        makeup,
        attendanceRate,
        cancellationRate,
      },
    },
  }
}
