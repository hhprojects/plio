'use client'

import { useRef, useCallback, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventInput, EventClickArg } from '@fullcalendar/core'

import type { AppointmentWithDetails } from '@/app/(dashboard)/admin/appointments/actions'

// ---------------------------------------------------------------------------
// Transform appointments to FullCalendar events
// ---------------------------------------------------------------------------

function appointmentsToEvents(
  appointments: AppointmentWithDetails[]
): EventInput[] {
  return appointments.map((appt) => ({
    id: appt.id,
    title: `${appt.clientName} — ${appt.serviceTitle}`,
    start: `${appt.date}T${appt.startTime}`,
    end: `${appt.date}T${appt.endTime}`,
    backgroundColor:
      appt.status === 'cancelled' ? '#9ca3af' : appt.serviceColor,
    borderColor:
      appt.status === 'cancelled' ? '#9ca3af' : appt.serviceColor,
    editable: false,
    extendedProps: { ...appt },
  }))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppointmentCalendarProps {
  appointments: AppointmentWithDetails[]
  onEventClick: (appointment: AppointmentWithDetails) => void
  onDateRangeChange?: (from: string, to: string) => void
}

export function AppointmentCalendar({
  appointments,
  onEventClick,
  onDateRangeChange,
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const events = appointmentsToEvents(appointments)

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      const ext = arg.event.extendedProps as AppointmentWithDetails
      onEventClick(ext)
    },
    [onEventClick]
  )

  const handleDatesSet = useCallback(
    (arg: { startStr: string; endStr: string }) => {
      const from = arg.startStr.substring(0, 10)
      const to = arg.endStr.substring(0, 10)
      onDateRangeChange?.(from, to)
    },
    [onDateRangeChange]
  )

  // Keep calendar events in sync
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.refetchEvents()
    }
  }, [appointments])

  return (
    <div className="fc-plio-wrapper rounded-lg border bg-card">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        nowIndicator={true}
        weekends={true}
        expandRows={true}
        height="auto"
        contentHeight="auto"
        eventDurationEditable={false}
        eventResizableFromStart={false}
        dayHeaderFormat={{
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }}
      />
    </div>
  )
}
