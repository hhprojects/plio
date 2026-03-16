'use client'

import { useMemo } from 'react'

import { formatTime } from '@plio/utils'

import { Card, CardContent } from '@/components/ui/card'
import { STATUS_COLORS } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'

import type { ClassInstanceWithDetails } from '@/app/(dashboard)/admin/tutors/actions'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TutorScheduleProps {
  classes: ClassInstanceWithDetails[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay()
  return DAY_NAMES[dayOfWeek] ?? 'Unknown'
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate()
  const month = date.toLocaleDateString('en-SG', { month: 'short' })
  return `${day} ${month}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TutorSchedule({ classes }: TutorScheduleProps) {
  // Group classes by date
  const groupedByDay = useMemo(() => {
    const map = new Map<string, ClassInstanceWithDetails[]>()

    for (const cls of classes) {
      const existing = map.get(cls.date) ?? []
      existing.push(cls)
      map.set(cls.date, existing)
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({
        date,
        dayName: getDayLabel(date),
        dateLabel: formatDateLabel(date),
        classes: items,
      }))
  }, [classes])

  if (classes.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center rounded-md border text-sm">
        No classes scheduled for this week.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groupedByDay.map((day) => (
        <div key={day.date} className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">{day.dayName}</h4>
            <span className="text-muted-foreground text-xs">{day.dateLabel}</span>
          </div>

          <div className="space-y-2">
            {day.classes.map((cls) => (
              <Card key={cls.id} className="py-3">
                <CardContent className="px-4 py-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cls.courseColor }}
                      />
                      <div>
                        <p className="text-sm font-medium">{cls.courseTitle}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                          {cls.roomName && (
                            <span className="ml-2">| {cls.roomName}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[cls.status] ?? ''}
                    >
                      {cls.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
