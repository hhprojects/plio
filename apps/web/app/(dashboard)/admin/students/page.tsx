import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/auth/cached'
import { getStudents } from './actions'
import { StudentsPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function StudentsPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={8} />}>
      <StudentsData />
    </Suspense>
  )
}

async function StudentsData() {
  const { tenantId } = await getTenantId()
  const supabase = await createClient()

  const [studentsResult, coursesResult, parentsResult] = await Promise.all([
    getStudents(),
    tenantId
      ? supabase
          .from('courses')
          .select('id, title, color_code')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('title')
      : Promise.resolve({ data: [] }),
    tenantId
      ? supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('role', 'parent')
          .eq('is_active', true)
          .order('full_name')
      : Promise.resolve({ data: [] }),
  ])

  const levels = Array.from(
    new Set(
      studentsResult.data
        .map((s) => s.level)
        .filter((l): l is string => l !== null && l !== '')
    )
  ).sort()

  return (
    <StudentsPageClient
      initialStudents={studentsResult.data}
      courses={coursesResult.data ?? []}
      parents={parentsResult.data ?? []}
      levels={levels}
    />
  )
}
