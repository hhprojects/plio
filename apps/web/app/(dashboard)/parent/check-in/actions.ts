'use server'

import { createClient } from '@/lib/supabase/server'
import { createHmac, randomBytes } from 'crypto'

async function getParentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    return { error: 'Not a parent', profile: null }
  }

  return { error: null, profile }
}

export async function getTodayEnrollments() {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { data: [], error }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Get parent's children
  const { data: children } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('tenant_id', profile.tenant_id)
    .eq('parent_id', profile.id)
    .eq('is_active', true)

  const studentIds = (children ?? []).map((c) => c.id)
  if (studentIds.length === 0) return { data: [] }

  // Get today's enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      status,
      checked_in_at,
      class_instances!inner(
        id,
        date,
        start_time,
        end_time,
        courses!inner(title, color_code)
      )
    `)
    .in('student_id', studentIds)
    .eq('tenant_id', profile.tenant_id)
    .in('status', ['confirmed', 'makeup'])
    .eq('class_instances.date', today)

  return {
    data: (enrollments ?? []).map((e) => {
      const ci = e.class_instances as unknown as {
        id: string
        date: string
        start_time: string
        end_time: string
        courses: { title: string; color_code: string }
      }
      return {
        enrollmentId: e.id,
        studentId: e.student_id,
        studentName: (children ?? []).find((c) => c.id === e.student_id)?.full_name ?? 'Unknown',
        classInstanceId: ci.id,
        date: ci.date,
        startTime: ci.start_time,
        endTime: ci.end_time,
        courseTitle: ci.courses?.title ?? 'Unknown',
        courseColor: ci.courses?.color_code ?? '#6366f1',
        checkedIn: !!e.checked_in_at,
      }
    }),
  }
}

export async function generateCheckInToken(enrollmentId: string) {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { token: null, error }

  const supabase = await createClient()

  // Verify enrollment belongs to parent's child
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, student_id, class_instance_id')
    .eq('id', enrollmentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!enrollment) return { token: null, error: 'Enrollment not found' }

  // Verify student belongs to parent
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', enrollment.student_id)
    .eq('parent_id', profile.id)
    .single()

  if (!student) return { token: null, error: 'Not authorized' }

  // Generate signed token
  const nonce = randomBytes(8).toString('hex')
  const timestamp = Date.now()
  const payload = `${enrollment.id}:${enrollment.student_id}:${enrollment.class_instance_id}:${timestamp}:${nonce}`
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

  const [enrollmentId, studentId, classInstanceId, timestampStr, nonce, signature] = parts

  // Verify signature
  const payload = `${enrollmentId}:${studentId}:${classInstanceId}:${timestampStr}:${nonce}`
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
    .select('id, status, checked_in_at, student_id, class_instance_id')
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

  // Fetch student name for confirmation
  const { data: student } = await supabase
    .from('students')
    .select('full_name')
    .eq('id', studentId)
    .single()

  const { data: ci } = await supabase
    .from('class_instances')
    .select('courses!inner(title)')
    .eq('id', classInstanceId)
    .single()

  const courseName = (ci?.courses as unknown as { title: string })?.title ?? 'class'

  return {
    success: true,
    studentName: student?.full_name ?? 'Student',
    courseName,
  }
}
