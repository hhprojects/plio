'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Eye, Pencil } from 'lucide-react'

import { formatDate } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { WhatsAppLink } from '@/components/admin/students/whatsapp-link'
import type { StudentWithDetails } from '@/app/(dashboard)/admin/students/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'fullName' | 'creditBalance' | 'lastAttendance'
type SortDirection = 'asc' | 'desc'

interface StudentTableProps {
  students: StudentWithDetails[]
  onViewDetail: (studentId: string, studentName: string) => void
  onEdit: (student: StudentWithDetails) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StudentTable({
  students,
  onViewDetail,
  onEdit,
}: StudentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('fullName')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sorted = useMemo(() => {
    const arr = [...students]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'fullName':
          cmp = a.fullName.localeCompare(b.fullName)
          break
        case 'creditBalance':
          cmp = a.creditBalance - b.creditBalance
          break
        case 'lastAttendance':
          cmp = (a.lastAttendance ?? '').localeCompare(b.lastAttendance ?? '')
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return arr
  }, [students, sortKey, sortDirection])

  if (students.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No students found. Add your first student to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('fullName')}
            >
              Name
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Parent</TableHead>
          <TableHead>Courses</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('creditBalance')}
            >
              Credits
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('lastAttendance')}
            >
              Last Attendance
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((student) => (
          <TableRow
            key={student.id}
            className="cursor-pointer"
            onClick={() => onViewDetail(student.id, student.fullName)}
          >
            <TableCell className="font-medium">{student.fullName}</TableCell>
            <TableCell>
              <div>
                <p className="text-sm">{student.parentName}</p>
                {student.parentPhone && (
                  <p className="text-muted-foreground text-xs">
                    {student.parentPhone}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {student.courses.length === 0 ? (
                  <span className="text-muted-foreground text-xs">None</span>
                ) : (
                  student.courses.map((course) => (
                    <Badge
                      key={course.id}
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: course.colorCode + '20',
                        color: course.colorCode,
                        borderColor: course.colorCode + '40',
                      }}
                    >
                      {course.title}
                    </Badge>
                  ))
                )}
              </div>
            </TableCell>
            <TableCell>
              <span
                className={
                  student.creditBalance > 0
                    ? 'font-medium text-green-600'
                    : student.creditBalance < 0
                      ? 'font-medium text-red-600'
                      : 'text-muted-foreground'
                }
              >
                {student.creditBalance}
              </span>
            </TableCell>
            <TableCell>
              {student.lastAttendance ? (
                <span className="text-sm">
                  {formatDate(student.lastAttendance, 'DD MMM YYYY')}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">Never</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  student.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {student.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewDetail(student.id, student.fullName)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View details</span>
                </Button>
                {student.parentPhone && (
                  <WhatsAppLink
                    phone={student.parentPhone}
                    parentName={student.parentName}
                    studentName={student.fullName}
                    variant="icon"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(student)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit student</span>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
