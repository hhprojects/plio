'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatTime, formatDate, toSGDate } from '@plio/utils'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import {
  getRoomUtilization,
  type RoomUtilizationSlot,
} from '@/app/(dashboard)/admin/rooms/actions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Timeline start: 8 AM = 480 minutes from midnight */
const TIMELINE_START = 480
/** Timeline end: 10 PM = 1320 minutes from midnight */
const TIMELINE_END = 1320
/** Total span in minutes */
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START

/** Hour labels for the timeline */
const HOUR_LABELS = Array.from({ length: 15 }, (_, i) => {
  const hour = 8 + i
  const label =
    hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`
  return { hour, label }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  d.setDate(d.getDate() + days)
  return toSGDate(d)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RoomUtilizationProps {
  roomId: string
  roomName: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoomUtilization({ roomId, roomName }: RoomUtilizationProps) {
  const today = toSGDate(new Date())
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState<RoomUtilizationSlot[]>([])
  const [isPending, startTransition] = useTransition()

  const fetchUtilization = useCallback(
    (targetDate: string) => {
      startTransition(async () => {
        const result = await getRoomUtilization(roomId, targetDate)
        if (result.data) {
          setSlots(result.data)
        }
      })
    },
    [roomId]
  )

  useEffect(() => {
    fetchUtilization(date)
  }, [date, fetchUtilization])

  const handlePrevDay = () => {
    setDate((d) => addDaysToDate(d, -1))
  }

  const handleNextDay = () => {
    setDate((d) => addDaysToDate(d, 1))
  }

  const handleToday = () => {
    setDate(today)
  }

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            disabled={date === today}
          >
            Today
          </Button>
        </div>
        <div className="text-sm font-medium">
          {roomName} &mdash; {formatDate(date, 'DD MMM YYYY')}
        </div>
      </div>

      {/* Timeline */}
      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-[500px] w-full" />
        </div>
      ) : (
        <div className="relative rounded-md border" style={{ height: '500px' }}>
          {/* Hour gridlines and labels */}
          {HOUR_LABELS.map(({ hour, label }) => {
            const top =
              ((hour * 60 - TIMELINE_START) / TIMELINE_SPAN) * 100
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-dashed border-border"
                style={{ top: `${top}%` }}
              >
                <span className="text-muted-foreground absolute -top-2.5 left-1 text-[10px]">
                  {label}
                </span>
              </div>
            )
          })}

          {/* Class blocks */}
          {slots.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              No classes scheduled
            </div>
          ) : (
            slots.map((slot, index) => {
              const startMin = parseTimeToMinutes(slot.startTime)
              const endMin = parseTimeToMinutes(slot.endTime)
              const top =
                ((startMin - TIMELINE_START) / TIMELINE_SPAN) * 100
              const height =
                ((endMin - startMin) / TIMELINE_SPAN) * 100

              return (
                <div
                  key={`${slot.startTime}-${index}`}
                  className="absolute left-12 right-2 overflow-hidden rounded-md px-2 py-1 text-xs text-white"
                  style={{
                    top: `${top}%`,
                    height: `${height}%`,
                    backgroundColor: slot.color,
                    minHeight: '24px',
                  }}
                >
                  <div className="font-medium truncate">
                    {slot.serviceName}
                  </div>
                  <div className="truncate opacity-90">{slot.teamMemberName}</div>
                  <div className="truncate opacity-80">
                    {formatTime(slot.startTime)} &ndash;{' '}
                    {formatTime(slot.endTime)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
