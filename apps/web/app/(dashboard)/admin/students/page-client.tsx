'use client'

import { useCallback, useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'

import type { Profile } from '@plio/db'

import { Button } from '@/components/ui/button'
import { StudentTable } from '@/components/admin/students/student-table'
import { StudentFiltersBar } from '@/components/admin/students/student-filters'
import { StudentDetailSheet } from '@/components/admin/students/student-detail-sheet'
import { StudentForm } from '@/components/admin/students/student-form'
import {
  getStudents,
  type StudentFilters,
  type StudentWithDetails,
} from './actions'

interface StudentsPageClientProps {
  initialStudents: StudentWithDetails[]
  courses: Array<{ id: string; title: string; color_code: string }>
  parents: Profile[]
  levels: string[]
}

export function StudentsPageClient({
  initialStudents,
  courses,
  parents,
  levels,
}: StudentsPageClientProps) {
  const [students, setStudents] = useState<StudentWithDetails[]>(initialStudents)
  const [isFiltering, startFiltering] = useTransition()

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editStudent, setEditStudent] = useState<StudentWithDetails | null>(null)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null)
  const [detailStudentName, setDetailStudentName] = useState<string | null>(null)

  const handleFiltersChange = useCallback(
    (filters: StudentFilters) => {
      // Normalize "all" sentinel values to undefined
      const normalized: StudentFilters = { ...filters }
      if (normalized.courseId === '__all__') normalized.courseId = undefined
      if (normalized.level === '__all__') normalized.level = undefined
      if (normalized.status === ('__all__' as string)) normalized.status = undefined

      startFiltering(async () => {
        const result = await getStudents(normalized)
        setStudents(result.data)
      })
    },
    []
  )

  const handleViewDetail = useCallback((studentId: string, studentName: string) => {
    setDetailStudentId(studentId)
    setDetailStudentName(studentName)
    setDetailOpen(true)
  }, [])

  const handleEdit = useCallback((student: StudentWithDetails) => {
    setEditStudent(student)
    setFormMode('edit')
    setFormOpen(true)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditStudent(null)
    setFormMode('create')
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditStudent(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage your students, view enrollment history, and contact parents.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/students/import">
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <StudentFiltersBar
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        levels={levels}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <div className={isFiltering ? 'opacity-50 transition-opacity' : ''}>
        <StudentTable
          students={students}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
        />
      </div>

      {/* Detail sheet */}
      <StudentDetailSheet
        studentId={detailStudentId}
        studentName={detailStudentName}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Create/Edit form */}
      <StudentForm
        open={formOpen}
        onOpenChange={handleFormClose}
        parents={parents}
        mode={formMode}
        defaultValues={
          editStudent
            ? {
                id: editStudent.id,
                full_name: editStudent.fullName,
                parent_id: editStudent.parentId,
                date_of_birth: editStudent.dateOfBirth,
                school: editStudent.school,
                level: editStudent.level,
                notes: editStudent.notes,
              }
            : undefined
        }
      />
    </div>
  )
}
