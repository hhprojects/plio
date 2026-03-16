import type { EventInput } from '@fullcalendar/core'
import type { Holiday } from '@plio/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClassInstanceWithDetails {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  max_capacity: number
  override_notes: string | null
  tutor_id: string
  room_id: string | null
  course_id: string
  course: { title: string; color_code: string } | null
  tutor: { full_name: string } | null
  room: { name: string } | null
  enrollment_count: number
}

// ---------------------------------------------------------------------------
// classInstancesToEvents
// ---------------------------------------------------------------------------

/**
 * Transform ClassInstanceWithDetails[] into FullCalendar EventInput[].
 *
 * Each class instance becomes a timed event on the calendar, color-coded
 * by the course's color_code. Extended properties carry additional metadata
 * for the custom event renderer and detail panel.
 */
export function classInstancesToEvents(
  instances: ClassInstanceWithDetails[]
): EventInput[] {
  return instances.map((instance) => {
    const isCancelled = instance.status === 'cancelled'
    const colorCode = instance.course?.color_code ?? '#6366f1'

    return {
      id: instance.id,
      title: instance.course?.title ?? 'Untitled Class',
      start: `${instance.date}T${instance.start_time}`,
      end: `${instance.date}T${instance.end_time}`,
      backgroundColor: isCancelled ? '#9ca3af' : colorCode,
      borderColor: isCancelled ? '#6b7280' : colorCode,
      editable: !isCancelled,
      extendedProps: {
        instanceId: instance.id,
        tutorName: instance.tutor?.full_name ?? 'Unassigned',
        tutorId: instance.tutor_id,
        roomName: instance.room?.name ?? null,
        roomId: instance.room_id,
        courseId: instance.course_id,
        enrollmentCount: instance.enrollment_count,
        maxCapacity: instance.max_capacity,
        status: instance.status,
        overrideNotes: instance.override_notes,
        date: instance.date,
        startTime: instance.start_time,
        endTime: instance.end_time,
      },
    }
  })
}

// ---------------------------------------------------------------------------
// holidaysToEvents
// ---------------------------------------------------------------------------

/**
 * Transform Holiday[] into FullCalendar background EventInput[].
 *
 * These render as greyed-out all-day background events so users can
 * visually see which days are holidays.
 */
export function holidaysToEvents(holidays: Holiday[]): EventInput[] {
  return holidays.map((holiday) => ({
    id: `holiday-${holiday.id}`,
    title: holiday.name,
    start: holiday.date,
    allDay: true,
    display: 'background',
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
    extendedProps: {
      isHoliday: true,
      isNational: holiday.is_national,
    },
  }))
}
