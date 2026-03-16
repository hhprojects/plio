'use client'

import type { EventContentArg } from '@fullcalendar/core'
import { cn } from '@/lib/utils'

/**
 * Custom event content renderer for FullCalendar.
 *
 * Displays the course title, tutor name, and enrollment count badge.
 * Cancelled classes show a strikethrough title with a muted appearance.
 */
export function ClassEventContent({ eventInfo }: { eventInfo: EventContentArg }) {
  const { event } = eventInfo
  const { extendedProps } = event

  const isCancelled = extendedProps.status === 'cancelled'
  const enrollmentCount = extendedProps.enrollmentCount ?? 0
  const maxCapacity = extendedProps.maxCapacity ?? 0
  const isFull = enrollmentCount >= maxCapacity && maxCapacity > 0

  return (
    <div className="flex h-full flex-col overflow-hidden px-1 py-0.5 text-xs leading-tight">
      {/* Course title */}
      <div
        className={cn(
          'truncate font-semibold text-white',
          isCancelled && 'line-through opacity-70'
        )}
      >
        {event.title}
      </div>

      {/* Tutor name */}
      <div className="truncate text-white/80">
        {extendedProps.tutorName}
      </div>

      {/* Enrollment count and room */}
      <div className="mt-auto flex items-center gap-1">
        <span
          className={cn(
            'inline-flex items-center rounded px-1 text-[10px] font-medium',
            isFull
              ? 'bg-white/30 text-white'
              : 'bg-white/20 text-white/90'
          )}
        >
          {enrollmentCount}/{maxCapacity}
        </span>
        {extendedProps.roomName && (
          <span className="truncate text-[10px] text-white/70">
            {extendedProps.roomName}
          </span>
        )}
      </div>

      {/* Cancelled overlay label */}
      {isCancelled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className="rounded bg-red-600/80 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            Cancelled
          </span>
        </div>
      )}
    </div>
  )
}
