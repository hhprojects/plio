'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createStudentSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200),
  parent_id: z.string().uuid('Please select a parent'),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  school: z.string().max(200).optional().or(z.literal('')),
  level: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
})

const updateStudentSchema = createStudentSchema.extend({
  id: z.string().uuid('Student ID is required'),
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

export interface StudentWithDetails {
  id: string
  fullName: string
  dateOfBirth: string | null
  school: string | null
  level: string | null
  notes: string | null
  isActive: boolean
  parentId: string
  parentName: string
  parentPhone: string | null
  parentEmail: string
  courses: Array<{ id: string; title: string; colorCode: string }>
  creditBalance: number
  lastAttendance: string | null
}

export interface StudentDetail {
  id: string
  fullName: string
  dateOfBirth: string | null
  school: string | null
  level: string | null
  notes: string | null
  isActive: boolean
  parentId: string
  parentName: string
  parentPhone: string | null
  parentEmail: string
  creditBalance: number
  enrollmentHistory: Array<{
    id: string
    classDate: string
    courseTitle: string
    courseColor: string
    status: string
    checkedInAt: string | null
  }>
  recentCredits: Array<{
    id: string
    amount: number
    reason: string
    createdAt: string
  }>
}

export interface StudentFilters {
  search?: string
  courseId?: string
  level?: string
  status?: 'active' | 'inactive'
}

// ---------------------------------------------------------------------------
// getStudents
// ---------------------------------------------------------------------------

export async function getStudents(filters?: StudentFilters): Promise<{
  data: StudentWithDetails[]
  error?: string
}> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: [], error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch students with parent join
  let query = supabase
    .from('students')
    .select(
      `
      id,
      full_name,
      date_of_birth,
      school,
      level,
      notes,
      is_active,
      parent_id,
      parent:profiles!students_parent_id_fkey(full_name, phone, email)
    `
    )
    .eq('tenant_id', tenantId)
    .order('full_name', { ascending: true })

  // Apply status filter
  if (filters?.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filters?.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // Apply level filter
  if (filters?.level) {
    query = query.eq('level', filters.level)
  }

  // Apply search filter
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or(`full_name.ilike.${searchTerm}`)
  }

  const { data: students, error: queryError } = await query

  if (queryError) {
    return { data: [], error: queryError.message }
  }

  if (!students || students.length === 0) {
    return { data: [] }
  }

  const studentIds = students.map((s) => s.id)

  // 2. Fetch enrollments with class_instances and courses for each student
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(
      `
      student_id,
      status,
      checked_in_at,
      class_instances!inner(
        course_id,
        courses!inner(id, title, color_code)
      )
    `
    )
    .in('student_id', studentIds)
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled')

  // Build a map of student_id -> unique courses
  const studentCoursesMap: Record<
    string,
    Map<string, { id: string; title: string; colorCode: string }>
  > = {}

  // Build a map of student_id -> last attendance date
  const lastAttendanceMap: Record<string, string> = {}

  for (const enrollment of enrollments ?? []) {
    const studentId = enrollment.student_id
    const classInstance = enrollment.class_instances as unknown as {
      course_id: string
      courses: { id: string; title: string; color_code: string }
    }

    // Track unique courses per student
    if (!studentCoursesMap[studentId]) {
      studentCoursesMap[studentId] = new Map()
    }
    if (classInstance?.courses) {
      const c = classInstance.courses
      studentCoursesMap[studentId].set(c.id, {
        id: c.id,
        title: c.title,
        colorCode: c.color_code,
      })
    }

    // Track last attendance
    if (enrollment.status === 'attended' && enrollment.checked_in_at) {
      const current = lastAttendanceMap[studentId]
      if (!current || enrollment.checked_in_at > current) {
        lastAttendanceMap[studentId] = enrollment.checked_in_at
      }
    }
  }

  // 3. Fetch credit balances
  const { data: creditData } = await supabase
    .from('credit_ledger')
    .select('student_id, amount')
    .in('student_id', studentIds)
    .eq('tenant_id', tenantId)

  const creditBalanceMap: Record<string, number> = {}
  for (const entry of creditData ?? []) {
    creditBalanceMap[entry.student_id] =
      (creditBalanceMap[entry.student_id] ?? 0) + entry.amount
  }

  // 4. If course filter is set, filter students that have that course
  let filteredStudents = students
  if (filters?.courseId) {
    filteredStudents = students.filter((s) => {
      const courseMap = studentCoursesMap[s.id]
      return courseMap?.has(filters.courseId!)
    })
  }

  // If search also applies to parent name, do a secondary filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filteredStudents = filteredStudents.filter((s) => {
      const parentData = s.parent as unknown as { full_name: string } | null
      const parentName = parentData?.full_name ?? ''
      return (
        s.full_name.toLowerCase().includes(searchLower) ||
        parentName.toLowerCase().includes(searchLower)
      )
    })
  }

  // 5. Map to StudentWithDetails
  const mapped: StudentWithDetails[] = filteredStudents.map((s) => {
    const parentData = s.parent as unknown as {
      full_name: string
      phone: string | null
      email: string
    } | null

    return {
      id: s.id,
      fullName: s.full_name,
      dateOfBirth: s.date_of_birth,
      school: s.school,
      level: s.level,
      notes: s.notes,
      isActive: s.is_active,
      parentId: s.parent_id,
      parentName: parentData?.full_name ?? 'Unknown',
      parentPhone: parentData?.phone ?? null,
      parentEmail: parentData?.email ?? '',
      courses: Array.from(studentCoursesMap[s.id]?.values() ?? []),
      creditBalance: creditBalanceMap[s.id] ?? 0,
      lastAttendance: lastAttendanceMap[s.id] ?? null,
    }
  })

  return { data: mapped }
}

// ---------------------------------------------------------------------------
// createStudent
// ---------------------------------------------------------------------------

export async function createStudent(formData: FormData) {
  const raw = {
    full_name: formData.get('full_name'),
    parent_id: formData.get('parent_id'),
    date_of_birth: formData.get('date_of_birth'),
    school: formData.get('school'),
    level: formData.get('level'),
    notes: formData.get('notes'),
  }

  const parsed = createStudentSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') }
  }

  const data = parsed.data
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()

  const { error: insertError } = await supabase.from('students').insert({
    tenant_id: tenantResult.tenantId,
    parent_id: data.parent_id,
    full_name: data.full_name,
    date_of_birth: data.date_of_birth || null,
    school: data.school || null,
    level: data.level || null,
    notes: data.notes || null,
    is_active: true,
  })

  if (insertError) {
    return { error: insertError.message }
  }

  revalidatePath('/admin/students')

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateStudent
// ---------------------------------------------------------------------------

export async function updateStudent(formData: FormData) {
  const raw = {
    id: formData.get('id'),
    full_name: formData.get('full_name'),
    parent_id: formData.get('parent_id'),
    date_of_birth: formData.get('date_of_birth'),
    school: formData.get('school'),
    level: formData.get('level'),
    notes: formData.get('notes'),
  }

  const parsed = updateStudentSchema.safeParse(raw)
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
    .from('students')
    .update({
      full_name: data.full_name,
      parent_id: data.parent_id,
      date_of_birth: data.date_of_birth || null,
      school: data.school || null,
      level: data.level || null,
      notes: data.notes || null,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantResult.tenantId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/admin/students')

  return { success: true }
}

// ---------------------------------------------------------------------------
// getStudentDetail
// ---------------------------------------------------------------------------

export async function getStudentDetail(
  studentId: string
): Promise<{ data: StudentDetail | null; error?: string }> {
  const tenantResult = await getTenantId()
  if (tenantResult.error || !tenantResult.tenantId) {
    return { data: null, error: tenantResult.error ?? 'No tenant' }
  }

  const supabase = await createClient()
  const tenantId = tenantResult.tenantId

  // 1. Fetch student with parent
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select(
      `
      id,
      full_name,
      date_of_birth,
      school,
      level,
      notes,
      is_active,
      parent_id,
      parent:profiles!students_parent_id_fkey(full_name, phone, email)
    `
    )
    .eq('id', studentId)
    .eq('tenant_id', tenantId)
    .single()

  if (studentError || !student) {
    return { data: null, error: studentError?.message ?? 'Student not found' }
  }

  // 2. Fetch enrollment history
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(
      `
      id,
      status,
      checked_in_at,
      class_instances!inner(
        date,
        courses!inner(title, color_code)
      )
    `
    )
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const enrollmentHistory = (enrollments ?? []).map((e) => {
    const classInstance = e.class_instances as unknown as {
      date: string
      courses: { title: string; color_code: string }
    }

    return {
      id: e.id,
      classDate: classInstance?.date ?? '',
      courseTitle: classInstance?.courses?.title ?? 'Unknown',
      courseColor: classInstance?.courses?.color_code ?? '#6366f1',
      status: e.status,
      checkedInAt: e.checked_in_at,
    }
  })

  // Sort by date descending
  enrollmentHistory.sort((a, b) => b.classDate.localeCompare(a.classDate))

  // 3. Fetch credit balance and recent transactions
  const { data: creditData } = await supabase
    .from('credit_ledger')
    .select('id, amount, reason, created_at')
    .eq('student_id', studentId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(20)

  const credits = creditData ?? []
  const creditBalance = credits.reduce((sum, c) => sum + c.amount, 0)

  const parentData = student.parent as unknown as {
    full_name: string
    phone: string | null
    email: string
  } | null

  return {
    data: {
      id: student.id,
      fullName: student.full_name,
      dateOfBirth: student.date_of_birth,
      school: student.school,
      level: student.level,
      notes: student.notes,
      isActive: student.is_active,
      parentId: student.parent_id,
      parentName: parentData?.full_name ?? 'Unknown',
      parentPhone: parentData?.phone ?? null,
      parentEmail: parentData?.email ?? '',
      creditBalance,
      enrollmentHistory,
      recentCredits: credits.map((c) => ({
        id: c.id,
        amount: c.amount,
        reason: c.reason,
        createdAt: c.created_at,
      })),
    },
  }
}
