import { Suspense } from 'react'
import { getCourses } from './actions'
import { CoursesPageClient } from './page-client'
import { TableSkeleton } from '@/components/ui/table-skeleton'

export default function CoursesPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CoursesData />
    </Suspense>
  )
}

async function CoursesData() {
  const coursesResult = await getCourses()
  return <CoursesPageClient initialCourses={coursesResult.data} />
}
