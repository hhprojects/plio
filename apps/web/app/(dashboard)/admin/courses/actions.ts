'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  default_price: z.coerce.number().min(0, 'Price must be 0 or more'),
  color_code: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color code'),
  max_capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
})

const updateCourseSchema = createCourseSchema.extend({
  id: z.string().uuid('Course ID is required'),
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
// Types
// ---------------------------------------------------------------------------

export interface CourseWithCounts {
  id: string
  title: string
  description: string | null
  defaultPrice: number
  colorCode: string
  maxCapacity: number
  isActive: boolean
  createdAt: string
  scheduleCount: number
  studentCount: number
}

// ---------------------------------------------------------------------------
// getCourses
// ---------------------------------------------------------------------------

export async function getCourses(): Promise<{
  data: CourseWithCounts[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch all courses for this tenant
  const { data: courses, error: queryError } = await supabase
    .from('courses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('title', { ascending: true })

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!courses || courses.length === 0) {
    return { data: [] }
  }

  const courseIds = courses.map((c) => c.id)

  // 2. Fetch count of active recurring_schedules per course
  const { data: schedules } = await supabase
    .from('recurring_schedules')
    .select('course_id')
    .in('course_id', courseIds)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  const scheduleCountMap: Record<string, number> = {}
  for (const s of schedules ?? []) {
    scheduleCountMap[s.course_id] = (scheduleCountMap[s.course_id] ?? 0) + 1
  }

  // 3. Fetch distinct enrolled students via enrollments -> class_instances -> course_id
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(
      `
      student_id,
      class_instances!inner(course_id)
    `
    )
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')

  const studentCountMap: Record<string, Set<string>> = {}
  for (const enrollment of enrollments ?? []) {
    const classInstance = enrollment.class_instances as unknown as {
      course_id: string
    }
    if (classInstance?.course_id && courseIds.includes(classInstance.course_id)) {
      if (!studentCountMap[classInstance.course_id]) {
        studentCountMap[classInstance.course_id] = new Set()
      }
      studentCountMap[classInstance.course_id].add(enrollment.student_id)
    }
  }

  // 4. Map to CourseWithCounts
  const mapped: CourseWithCounts[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    defaultPrice: c.default_price,
    colorCode: c.color_code,
    maxCapacity: c.max_capacity,
    isActive: c.is_active,
    createdAt: c.created_at,
    scheduleCount: scheduleCountMap[c.id] ?? 0,
    studentCount: studentCountMap[c.id]?.size ?? 0,
  }))

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// createCourse
// ---------------------------------------------------------------------------

export async function createCourse(formData: FormData) {
  const raw = {
    title: formData.get('title'),
    description: formData.get('description'),
    default_price: formData.get('default_price'),
    color_code: formData.get('color_code'),
    max_capacity: formData.get('max_capacity'),
  }

  const parsed = createCourseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase.from('courses').insert({
    tenant_id: tenantResult.tenantId,
    title: data.title,
    description: data.description || null,
    default_price: data.default_price,
    color_code: data.color_code,
    max_capacity: data.max_capacity,
    is_active: true,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/courses')

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateCourse
// ---------------------------------------------------------------------------

export async function updateCourse(formData: FormData) {
  const raw = {
    id: formData.get('id'),
    title: formData.get('title'),
    description: formData.get('description'),
    default_price: formData.get('default_price'),
    color_code: formData.get('color_code'),
    max_capacity: formData.get('max_capacity'),
  }

  const parsed = updateCourseSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('courses')
    .update({
      title: data.title,
      description: data.description || null,
      default_price: data.default_price,
      color_code: data.color_code,
      max_capacity: data.max_capacity,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/courses')

  return { success: true }
}

// ---------------------------------------------------------------------------
// toggleCourseActive
// ---------------------------------------------------------------------------

export async function toggleCourseActive(courseId: string, isActive: boolean) {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('courses')
    .update({ is_active: isActive })
    .eq('id', courseId)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/courses')

  return { success: true }
}
