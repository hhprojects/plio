import type { EventInput } from '@fullcalendar/core'
import type { Holiday } from '@plio/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionWithDetails {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  team_member_id: string
  room_id: string | null
  service_id: string
  service: { name: string; color: string } | null
  team_member: { name: string } | null
  room: { name: string } | null
  enrollment_count: number
}

// ---------------------------------------------------------------------------
// sessionsToEvents
// ---------------------------------------------------------------------------

/**
 * Transform SessionWithDetails[] into FullCalendar EventInput[].
 *
 * Each session becomes a timed event on the calendar, color-coded
 * by the service's color. Extended properties carry additional metadata
 * for the custom event renderer and detail panel.
 */
export function sessionsToEvents(
  sessions: SessionWithDetails[]
): EventInput[] {
  return sessions.map((session) => {
    const isCancelled = session.status === 'cancelled'
    const color = session.service?.color ?? '#6366f1'

    return {
      id: session.id,
      title: session.service?.name ?? 'Untitled Session',
      start: `${session.date}T${session.start_time}`,
      end: `${session.date}T${session.end_time}`,
      backgroundColor: isCancelled ? '#9ca3af' : color,
      borderColor: isCancelled ? '#6b7280' : color,
      editable: !isCancelled,
      extendedProps: {
        sessionId: session.id,
        teamMemberName: session.team_member?.name ?? 'Unassigned',
        teamMemberId: session.team_member_id,
        roomName: session.room?.name ?? null,
        roomId: session.room_id,
        serviceId: session.service_id,
        enrollmentCount: session.enrollment_count,
        status: session.status,
        date: session.date,
        startTime: session.start_time,
        endTime: session.end_time,
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
