'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const importRowSchema = z.object({
  full_name: z.string().min(1, 'Student name is required'),
  level: z.string().optional().or(z.literal('')),
  school: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  parent_name: z.string().min(1, 'Parent name is required'),
  parent_email: z.string().email('Invalid parent email'),
  parent_phone: z.string().optional().or(z.literal('')),
})

export type ImportRow = z.infer<typeof importRowSchema>

export interface ImportResult {
  studentsCreated: number
  parentsCreated: number
  rowsSkipped: number
  errors: Array<{ row: number; message: string }>
}

export async function importStudents(rows: ImportRow[]): Promise<{
  data: ImportResult | null
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return { data: null, error: 'Profile not found' }
  }

  const tenantId = profile.tenant_id
  const result: ImportResult = {
    studentsCreated: 0,
    parentsCreated: 0,
    rowsSkipped: 0,
    errors: [],
  }

  // Cache parent lookups by email
  const parentCache: Record<string, string> = {}

  // Pre-fetch existing parents in this tenant
  const { data: existingParents } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('tenant_id', tenantId)
    .eq('role', 'parent')

  for (const p of existingParents ?? []) {
    parentCache[p.email.toLowerCase()] = p.id
  }

  for (let i = 0; i < rows.length; i++) {
    const parsed = importRowSchema.safeParse(rows[i])
    if (!parsed.success) {
      result.errors.push({
        row: i + 1,
        message: parsed.error.issues.map((e) => e.message).join(', '),
      })
      result.rowsSkipped++
      continue
    }

    const row = parsed.data
    const email = row.parent_email.toLowerCase()

    // Find or create parent
    let parentId = parentCache[email]
    if (!parentId) {
      const { data: newParent, error: parentError } = await supabase
        .from('profiles')
        .insert({
          tenant_id: tenantId,
          user_id: null,
          role: 'parent',
          full_name: row.parent_name,
          email: row.parent_email,
          phone: row.parent_phone || null,
          is_active: true,
        })
        .select('id')
        .single()

      if (parentError || !newParent) {
        result.errors.push({
          row: i + 1,
          message: `Failed to create parent: ${parentError?.message ?? 'Unknown error'}`,
        })
        result.rowsSkipped++
        continue
      }

      parentId = newParent.id
      parentCache[email] = parentId
      result.parentsCreated++
    }

    // Check for duplicate student
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('parent_id', parentId)
      .eq('full_name', row.full_name)
      .maybeSingle()

    if (existing) {
      result.errors.push({
        row: i + 1,
        message: `Student "${row.full_name}" already exists for this parent`,
      })
      result.rowsSkipped++
      continue
    }

    // Create student
    const { error: studentError } = await supabase.from('students').insert({
      tenant_id: tenantId,
      parent_id: parentId,
      full_name: row.full_name,
      level: row.level || null,
      school: row.school || null,
      date_of_birth: row.date_of_birth || null,
      notes: row.notes || null,
      is_active: true,
    })

    if (studentError) {
      result.errors.push({
        row: i + 1,
        message: `Failed to create student: ${studentError.message}`,
      })
      result.rowsSkipped++
      continue
    }

    result.studentsCreated++
  }

  revalidatePath('/admin/students')
  return { data: result }
}
