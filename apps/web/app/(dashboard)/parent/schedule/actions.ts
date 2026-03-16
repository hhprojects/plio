'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CANCELLATION_HOURS } from '@/lib/constants'

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

export async function getParentSchedule() {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { data: null, error }

  const supabase = await createClient()

  // Get children
  const { data: children } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('tenant_id', profile.tenant_id)
    .eq('parent_id', profile.id)
    .eq('is_active', true)

  const studentIds = (children ?? []).map((c) => c.id)
  if (studentIds.length === 0) return { data: { children: [], upcoming: [], past: [] } }

  // Get all enrollments
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      status,
      checked_in_at,
      cancelled_at,
      class_instances!inner(
        id,
        date,
        start_time,
        end_time,
        status,
        courses!inner(title, color_code),
        tutor:profiles!class_instances_tutor_id_fkey(full_name),
        room:rooms(name)
      )
    `)
    .in('student_id', studentIds)
    .eq('tenant_id', profile.tenant_id)
    .order('class_instances(date)', { ascending: false })
    .limit(100)

  const today = new Date().toISOString().split('T')[0]
  const upcoming: Array<{
    enrollmentId: string
    studentId: string
    studentName: string
    classInstanceId: string
    date: string
    startTime: string
    endTime: string
    courseTitle: string
    courseColor: string
    tutorName: string
    roomName: string | null
    status: string
    classStatus: string
  }> = []
  const past: typeof upcoming = []

  for (const e of enrollments ?? []) {
    const ci = e.class_instances as unknown as {
      id: string
      date: string
      start_time: string
      end_time: string
      status: string
      courses: { title: string; color_code: string }
      tutor: { full_name: string } | null
      room: { name: string } | null
    }

    const entry = {
      enrollmentId: e.id,
      studentId: e.student_id,
      studentName: (children ?? []).find((c) => c.id === e.student_id)?.full_name ?? 'Unknown',
      classInstanceId: ci.id,
      date: ci.date,
      startTime: ci.start_time,
      endTime: ci.end_time,
      courseTitle: ci.courses?.title ?? 'Unknown',
      courseColor: ci.courses?.color_code ?? '#6366f1',
      tutorName: ci.tutor?.full_name ?? 'TBD',
      roomName: ci.room?.name ?? null,
      status: e.status,
      classStatus: ci.status,
    }

    if (ci.date >= today && e.status !== 'cancelled') {
      upcoming.push(entry)
    } else {
      past.push(entry)
    }
  }

  // Sort upcoming ascending
  upcoming.sort((a, b) => a.date.localeCompare(b.date))

  return {
    data: {
      children: (children ?? []).map((c) => ({ id: c.id, fullName: c.full_name })),
      upcoming,
      past,
    },
  }
}

export async function cancelEnrollment(enrollmentId: string) {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { error }

  const supabase = await createClient()

  // Fetch enrollment with class instance
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`
      id,
      student_id,
      status,
      tenant_id,
      class_instances!inner(date, start_time)
    `)
    .eq('id', enrollmentId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!enrollment) return { error: 'Enrollment not found' }
  if (!['confirmed', 'makeup'].includes(enrollment.status)) {
    return { error: 'Cannot cancel this enrollment' }
  }

  // Verify student belongs to parent
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', enrollment.student_id)
    .eq('parent_id', profile.id)
    .single()

  if (!student) return { error: 'Not authorized' }

  // Check cancellation policy
  const ci = enrollment.class_instances as unknown as { date: string; start_time: string }
  const classDateTime = new Date(`${ci.date}T${ci.start_time}+08:00`)
  const now = new Date()
  const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Fetch tenant cancellation hours
  const { data: tenant } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', profile.tenant_id)
    .single()

  const cancellationHours = (tenant?.settings as Record<string, unknown>)?.cancellation_hours as number ?? DEFAULT_CANCELLATION_HOURS
  const eligibleForRefund = hoursUntilClass > cancellationHours

  // Cancel the enrollment
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Cancelled by parent',
    })
    .eq('id', enrollmentId)

  if (updateError) return { error: updateError.message }

  // Refund credit if eligible
  if (eligibleForRefund) {
    await supabase.from('credit_ledger').insert({
      tenant_id: profile.tenant_id,
      student_id: enrollment.student_id,
      amount: 1,
      reason: 'cancellation_refund',
      class_instance_id: null,
      created_by: profile.id,
    })
  }

  revalidatePath('/parent/schedule')
  return { success: true, creditRefunded: eligibleForRefund }
}

export async function getAvailableMakeupSlots(studentId: string) {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { data: [], error }

  const supabase = await createClient()

  // Verify student belongs to parent
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', profile.id)
    .single()

  if (!student) return { data: [], error: 'Not authorized' }

  const today = new Date().toISOString().split('T')[0]

  // Get scheduled classes with capacity
  const { data: classes } = await supabase
    .from('class_instances')
    .select(`
      id,
      date,
      start_time,
      end_time,
      max_capacity,
      courses!inner(title, color_code),
      tutor:profiles!class_instances_tutor_id_fkey(full_name),
      room:rooms(name)
    `)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'scheduled')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(50)

  if (!classes || classes.length === 0) return { data: [] }

  // Count current enrollments per class
  const classIds = classes.map((c) => c.id)
  const { data: enrollmentCounts } = await supabase
    .from('enrollments')
    .select('class_instance_id')
    .in('class_instance_id', classIds)
    .eq('tenant_id', profile.tenant_id)
    .neq('status', 'cancelled')

  const countMap: Record<string, number> = {}
  for (const e of enrollmentCounts ?? []) {
    countMap[e.class_instance_id] = (countMap[e.class_instance_id] ?? 0) + 1
  }

  const slots = classes
    .map((c) => {
      const current = countMap[c.id] ?? 0
      const available = c.max_capacity - current
      const course = c.courses as unknown as { title: string; color_code: string }
      const tutor = c.tutor as unknown as { full_name: string } | null
      const room = c.room as unknown as { name: string } | null

      return {
        classInstanceId: c.id,
        date: c.date,
        startTime: c.start_time,
        endTime: c.end_time,
        courseTitle: course?.title ?? 'Unknown',
        courseColor: course?.color_code ?? '#6366f1',
        tutorName: tutor?.full_name ?? 'TBD',
        roomName: room?.name ?? null,
        currentEnrollment: current,
        maxCapacity: c.max_capacity,
        availableSpots: available,
      }
    })
    .filter((s) => s.availableSpots > 0)

  return { data: slots }
}

export async function bookMakeupClass(studentId: string, classInstanceId: string) {
  const { profile, error } = await getParentProfile()
  if (error || !profile) return { error }

  const supabase = await createClient()

  // Verify student belongs to parent
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', profile.id)
    .single()

  if (!student) return { error: 'Not authorized' }

  // Check credit balance
  const { data: credits } = await supabase
    .from('credit_ledger')
    .select('amount')
    .eq('student_id', studentId)
    .eq('tenant_id', profile.tenant_id)

  const balance = (credits ?? []).reduce((sum, c) => sum + c.amount, 0)
  if (balance <= 0) return { error: 'No credits available. Contact your centre to purchase more.' }

  // Check class capacity
  const { data: existingCount } = await supabase
    .from('enrollments')
    .select('id')
    .eq('class_instance_id', classInstanceId)
    .eq('tenant_id', profile.tenant_id)
    .neq('status', 'cancelled')

  const { data: classInstance } = await supabase
    .from('class_instances')
    .select('max_capacity')
    .eq('id', classInstanceId)
    .single()

  if (!classInstance) return { error: 'Class not found' }
  if ((existingCount?.length ?? 0) >= classInstance.max_capacity) {
    return { error: 'Class is full' }
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('class_instance_id', classInstanceId)
    .neq('status', 'cancelled')
    .single()

  if (existing) return { error: 'Already enrolled in this class' }

  // Create enrollment
  const { error: enrollError } = await supabase.from('enrollments').insert({
    student_id: studentId,
    class_instance_id: classInstanceId,
    tenant_id: profile.tenant_id,
    status: 'makeup',
  })

  if (enrollError) return { error: enrollError.message }

  // Deduct credit
  await supabase.from('credit_ledger').insert({
    tenant_id: profile.tenant_id,
    student_id: studentId,
    amount: -1,
    reason: 'makeup_booking',
    class_instance_id: classInstanceId,
    created_by: profile.id,
  })

  revalidatePath('/parent/schedule')
  return { success: true }
}
