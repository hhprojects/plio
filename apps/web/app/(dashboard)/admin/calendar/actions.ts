'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { detectConflicts, type Conflict } from '@/lib/scheduling/conflict-detection'
import type { ClassInstanceWithDetails } from '@/lib/scheduling/calendar-helpers'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const rescheduleSchema = z.object({
  classInstanceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  tutorId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional().nullable(),
})

const cancelSchema = z.object({
  classInstanceId: z.string().uuid(),
  reason: z.string().min(1, 'Cancellation reason is required'),
})

// ---------------------------------------------------------------------------
// Helper: get tenant ID for the current user
// ---------------------------------------------------------------------------

async function getTenantId(): Promise<{ tenantId: string | null; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { tenantId: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { tenantId: null, error: 'Profile not found' }
  }

  return { tenantId: profile.tenant_id }
}

// ---------------------------------------------------------------------------
// getClassInstances
// ---------------------------------------------------------------------------

export async function getClassInstances(
  dateFrom: string,
  dateTo: string
): Promise<{ data: ClassInstanceWithDetails[]; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // Fetch class instances with course, tutor, and room joins
  const { data: instances, error: queryError } = await supabase
    .from('class_instances')
    .select(
      `
      id,
      date,
      start_time,
      end_time,
      status,
      max_capacity,
      override_notes,
      tutor_id,
      room_id,
      course_id,
      courses(title, color_code),
      tutor:profiles!class_instances_tutor_id_fkey(full_name),
      rooms(name)
    `
    )
    .eq('tenant_id', tenantId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!instances || instances.length === 0) {
    return { data: [] }
  }

  // Fetch enrollment counts for all instances in one query
  const instanceIds = instances.map((i) => i.id)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('class_instance_id')
    .in('class_instance_id', instanceIds)
    .neq('status', 'cancelled')

  // Build a count map
  const enrollmentCountMap: Record<string, number> = {}
  for (const enrollment of enrollments ?? []) {
    const key = enrollment.class_instance_id
    enrollmentCountMap[key] = (enrollmentCountMap[key] ?? 0) + 1
  }

  // Map to ClassInstanceWithDetails
  const mapped: ClassInstanceWithDetails[] = instances.map((instance) => {
    const courseData = instance.courses as unknown as { title: string; color_code: string } | null
    const tutorData = instance.tutor as unknown as { full_name: string } | null
    const roomData = instance.rooms as unknown as { name: string } | null

    return {
      id: instance.id,
      date: instance.date,
      start_time: instance.start_time,
      end_time: instance.end_time,
      status: instance.status,
      max_capacity: instance.max_capacity,
      override_notes: instance.override_notes,
      tutor_id: instance.tutor_id,
      room_id: instance.room_id,
      course_id: instance.course_id,
      course: courseData,
      tutor: tutorData,
      room: roomData,
      enrollment_count: enrollmentCountMap[instance.id] ?? 0,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// getHolidays
// ---------------------------------------------------------------------------

export async function getHolidays(
  dateFrom: string,
  dateTo: string
): Promise<{ data: Array<{ id: string; tenant_id: string; date: string; name: string; is_national: boolean; created_at: string }>; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { data: holidays, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('tenant_id', tenantResult.tenantId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: holidays ?? [] }
}

// ---------------------------------------------------------------------------
// rescheduleClassInstance
// ---------------------------------------------------------------------------

export async function rescheduleClassInstance(input: {
  classInstanceId: string
  date: string
  startTime: string
  endTime: string
  tutorId?: string
  roomId?: string | null
}): Promise<{ success: boolean; conflicts: Conflict[]; error?: string }> {
  // 1. Validate
  const parsed = rescheduleSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      conflicts: [],
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  const data = parsed.data

  // Normalize time strings to HH:MM format
  const startTime = data.startTime.substring(0, 5)
  const endTime = data.endTime.substring(0, 5)

  // 2. Auth
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { success: false, conflicts: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 3. Get the current instance details (to get tutorId and roomId if not provided)
  const { data: currentInstance, error: fetchError } = await supabase
    .from('class_instances')
    .select('tutor_id, room_id')
    .eq('id', data.classInstanceId)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchError || !currentInstance) {
    return { success: false, conflicts: [], error: 'Class instance not found' }
  }

  const tutorId = data.tutorId ?? currentInstance.tutor_id
  const roomId = data.roomId !== undefined ? data.roomId : currentInstance.room_id

  // 4. Run conflict detection (exclude current instance)
  const conflicts = await detectConflicts(supabase, {
    tenantId,
    date: data.date,
    startTime,
    endTime,
    tutorId,
    roomId: roomId ?? undefined,
    excludeInstanceId: data.classInstanceId,
  })

  if (conflicts.length > 0) {
    return { success: false, conflicts }
  }

  // 5. Update the class instance
  const { error: updateError } = await supabase
    .from('class_instances')
    .update({
      date: data.date,
      start_time: startTime,
      end_time: endTime,
      tutor_id: tutorId,
      room_id: roomId,
    })
    .eq('id', data.classInstanceId)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { success: false, conflicts: [], error: updateError.message }
  }

  // 6. Revalidate
  revalidatePath('/admin/calendar')

  return { success: true, conflicts: [] }
}

// ---------------------------------------------------------------------------
// cancelClassInstance
// ---------------------------------------------------------------------------

export async function cancelClassInstance(input: {
  classInstanceId: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  // 1. Validate
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(', '),
    }
  }

  // 2. Auth
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { success: false, error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 3. Update status and notes
  const { error: updateError } = await supabase
    .from('class_instances')
    .update({
      status: 'cancelled',
      override_notes: parsed.data.reason,
    })
    .eq('id', parsed.data.classInstanceId)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // 4. Revalidate
  revalidatePath('/admin/calendar')

  return { success: true }
}
