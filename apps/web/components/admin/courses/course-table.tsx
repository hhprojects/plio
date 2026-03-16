'use client'

import { useMemo, useState } from 'react'
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { CourseWithCounts } from '@/app/(dashboard)/admin/courses/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortKey = 'title' | 'defaultPrice' | 'maxCapacity' | 'scheduleCount'
type SortDirection = 'asc' | 'desc'

interface CourseTableProps {
  courses: CourseWithCounts[]
  onView: (course: CourseWithCounts) => void
  onEdit: (course: CourseWithCounts) => void
  onToggleActive: (courseId: string, isActive: boolean) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(price)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseTable({
  courses,
  onView,
  onEdit,
  onToggleActive,
}: CourseTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('title')
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
    const arr = [...courses]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'defaultPrice':
          cmp = a.defaultPrice - b.defaultPrice
          break
        case 'maxCapacity':
          cmp = a.maxCapacity - b.maxCapacity
          break
        case 'scheduleCount':
          cmp = a.scheduleCount - b.scheduleCount
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return arr
  }, [courses, sortKey, sortDirection])

  if (courses.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No courses found. Add your first course to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">Color</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('title')}
            >
              Title
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('defaultPrice')}
            >
              Price
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('maxCapacity')}
            >
              Capacity
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8 font-medium"
              onClick={() => toggleSort('scheduleCount')}
            >
              Schedules
              <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((course) => (
          <TableRow
            key={course.id}
            className="cursor-pointer"
            onClick={() => onView(course)}
          >
            <TableCell>
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: course.colorCode }}
              />
            </TableCell>
            <TableCell className="font-medium">{course.title}</TableCell>
            <TableCell>{formatPrice(course.defaultPrice)}</TableCell>
            <TableCell>{course.maxCapacity}</TableCell>
            <TableCell>{course.scheduleCount}</TableCell>
            <TableCell>
              <Badge
                variant="secondary"
                className={
                  course.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {course.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div
                className="flex items-center justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(course)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(course)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        onToggleActive(course.id, !course.isActive)
                      }
                    >
                      {course.isActive ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
