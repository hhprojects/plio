'use server'

import { createClient } from '@/lib/supabase/server'
import { createHmac, randomBytes } from 'crypto'

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

export async function getTodayEnrollments() {
  const { profile, email, error } = await getParentProfile()
  if (error || !profile || !email) return { data: [], error }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Find contact by email
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!contact) return { data: [] }

  // Get dependents
  const { data: children } = await supabase
    .from('contact_dependents')
    .select('id, name')
    .eq('contact_id', contact.id)
    .eq('tenant_id', profile.tenant_id)

  const dependentIds = (children ?? []).map((c) => c.id)
  if (dependentIds.length === 0) return { data: [] }

  // Get today's enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      dependent_id,
      status,
      checked_in_at,
      session:sessions!inner(
        id,
        date,
        start_time,
        end_time,
        service:services(name, color)
      )
    `)
    .in('dependent_id', dependentIds)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['confirmed', 'makeup'])
    .eq('sessions.date', today)

  return {
    data: (enrollments ?? []).map((e) => {
      const session = e.session as unknown as {
        id: string
        date: string
        start_time: string
        end_time: string
        service: { name: string; color: string } | null
      }
      return {
        enrollmentId: e.id,
        dependentId: e.dependent_id,
        dependentName: (children ?? []).find((c) => c.id === e.dependent_id)?.name ?? 'Unknown',
        sessionId: session.id,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
        serviceName: session.service?.name ?? 'Unknown',
        serviceColor: session.service?.color ?? '#6366f1',
        checkedIn: !!e.checked_in_at,
      }
    }),
  }
}

export async function generateCheckInToken(enrollmentId: string) {
  const { profile, email, error } = await getParentProfile()
  if (error || !profile || !email) return { token: null, error }

  const supabase = await createClient()

  // Verify enrollment belongs to parent's dependent
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, dependent_id, session_id')
    .eq('id', enrollmentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!enrollment) return { token: null, error: 'Enrollment not found' }

  // Find contact by email
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('email', email)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!contact) return { token: null, error: 'Not authorized' }

  // Verify dependent belongs to this contact
  const { data: dependent } = await supabase
    .from('contact_dependents')
    .select('id')
    .eq('id', enrollment.dependent_id)
    .eq('contact_id', contact.id)
    .single()

  if (!dependent) return { token: null, error: 'Not authorized' }

  // Generate signed token
  const nonce = randomBytes(8).toString('hex')
  const timestamp = Date.now()
  const payload = `${enrollment.id}:${enrollment.dependent_id}:${enrollment.session_id}:${timestamp}:${nonce}`
  const secret = process.env.CHECKIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'plio-checkin-secret'
  const signature = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)
  const token = `${payload}:${signature}`

  return { token }
}

export async function verifyCheckIn(token: string) {
  const supabase = await createClient()

  // Parse the token
  const parts = token.split(':')
  if (parts.length !== 6) return { error: 'Invalid token format' }

  const [enrollmentId, dependentId, sessionId, timestampStr, nonce, signature] = parts

  // Verify signature
  const payload = `${enrollmentId}:${dependentId}:${sessionId}:${timestampStr}:${nonce}`
  const secret = process.env.CHECKIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'plio-checkin-secret'
  const expectedSig = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16)

  if (signature !== expectedSig) return { error: 'Invalid token signature' }

  // Check timestamp (5 minute validity)
  const timestamp = parseInt(timestampStr, 10)
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    return { error: 'Token expired. Please generate a new QR code.' }
  }

  // Fetch enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, status, checked_in_at, dependent_id, session_id')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return { error: 'Enrollment not found' }
  if (enrollment.checked_in_at) return { error: 'Already checked in' }

  // Mark as attended
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      status: 'attended',
      checked_in_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)

  if (updateError) return { error: updateError.message }

  // Fetch dependent name for confirmation
  const { data: dependent } = await supabase
    .from('contact_dependents')
    .select('name')
    .eq('id', dependentId)
    .single()

  const { data: session } = await supabase
    .from('sessions')
    .select('service:services(name)')
    .eq('id', sessionId)
    .single()

  const serviceName = (session?.service as unknown as { name: string })?.name ?? 'class'

  return {
    success: true,
    dependentName: dependent?.name ?? 'Student',
    serviceName,
  }
}
