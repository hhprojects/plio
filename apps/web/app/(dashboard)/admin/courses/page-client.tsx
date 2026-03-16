'use client'

import { useCallback, useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CourseTable } from '@/components/admin/courses/course-table'
import { CourseForm } from '@/components/admin/courses/course-form'
import { CourseDetailSheet } from '@/components/admin/courses/course-detail-sheet'
import {
  toggleCourseActive,
  type CourseWithCounts,
} from './actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CoursesPageClientProps {
  initialCourses: CourseWithCounts[]
}

export function CoursesPageClient({ initialCourses }: CoursesPageClientProps) {
  const [courses] = useState<CourseWithCounts[]>(initialCourses)
  const [, startTransition] = useTransition()

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editCourse, setEditCourse] = useState<CourseWithCounts | null>(null)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailCourse, setDetailCourse] = useState<CourseWithCounts | null>(null)

  const handleView = useCallback((course: CourseWithCounts) => {
    setDetailCourse(course)
    setDetailOpen(true)
  }, [])

  const handleEdit = useCallback((course: CourseWithCounts) => {
    setEditCourse(course)
    setFormMode('edit')
    setFormOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditCourse(null)
    setFormMode('create')
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditCourse(null)
    }
  }, [])

  const handleToggleActive = useCallback(
    (courseId: string, isActive: boolean) => {
      startTransition(async () => {
        const result = await toggleCourseActive(courseId, isActive)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success(
            isActive ? 'Course activated.' : 'Course deactivated.'
          )
        }
      })
    },
    []
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your courses, pricing, and capacity.
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Table */}
      <CourseTable
        courses={courses}
        onView={handleView}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      {/* Detail sheet */}
      <CourseDetailSheet
        course={detailCourse}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Create/Edit form */}
      <CourseForm
        open={formOpen}
        onOpenChange={handleFormClose}
        mode={formMode}
        defaultValues={
          editCourse
            ? {
                id: editCourse.id,
                title: editCourse.title,
                description: editCourse.description,
                default_price: editCourse.defaultPrice,
                max_capacity: editCourse.maxCapacity,
                color_code: editCourse.colorCode,
              }
            : undefined
        }
      />
    </div>
  )
}
