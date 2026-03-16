'use client'

import {
  CalendarDays,
  DollarSign,
  Users,
  Hash,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { CourseWithCounts } from '@/app/(dashboard)/admin/courses/actions'

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

interface CourseDetailSheetProps {
  course: CourseWithCounts | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseDetailSheet({
  course,
  open,
  onOpenChange,
}: CourseDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {course && (
              <div
                className="h-5 w-5 rounded-full border"
                style={{ backgroundColor: course.colorCode }}
              />
            )}
            <SheetTitle>{course?.title ?? 'Course Details'}</SheetTitle>
          </div>
          <SheetDescription>
            View course information and statistics.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
          {course && (
            <div className="space-y-6 pt-4">
              {/* Description */}
              {course.description && (
                <div className="space-y-2">
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                    {course.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span>
                    {formatPrice(course.defaultPrice)} per session
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Hash className="text-muted-foreground h-4 w-4" />
                  <span>Max capacity: {course.maxCapacity}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground text-sm">Status:</span>
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
                </div>
              </div>

              <Separator />

              {/* Schedules section */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Schedules
                </h4>
                <p className="text-muted-foreground text-sm">
                  {course.scheduleCount === 0
                    ? 'No active schedules.'
                    : `${course.scheduleCount} active schedule${course.scheduleCount === 1 ? '' : 's'}.`}
                </p>
              </div>

              <Separator />

              {/* Enrolled Students section */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Enrolled Students
                </h4>
                <p className="text-muted-foreground text-sm">
                  {course.studentCount === 0
                    ? 'No students enrolled.'
                    : `${course.studentCount} student${course.studentCount === 1 ? '' : 's'} enrolled.`}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
