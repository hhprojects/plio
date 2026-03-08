'use client'

import { useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateClickArg, EventInput } from '@fullcalendar/core'

interface CalendarViewProps {
  events: EventInput[]
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  currentDate: Date
  onDateChange: (date: Date) => void
  onEventClick: (sessionId: string) => void
  canWrite: boolean
}

export function CalendarView({
  events,
  view,
  currentDate,
  onDateChange,
  onEventClick,
  canWrite,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar | null>(null)

  // Sync view and date from store to FullCalendar
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    if (api.view.type !== view) {
      api.changeView(view)
    }
    // Only navigate if date is significantly different (avoid loops)
    const currentApiDate = api.getDate()
    if (Math.abs(currentApiDate.getTime() - currentDate.getTime()) > 60_000) {
      api.gotoDate(currentDate)
    }
  }, [view, currentDate])

  function handleEventClick(info: EventClickArg) {
    const sessionId = info.event.id
    if (sessionId) {
      onEventClick(sessionId)
    }
  }

  function handleDateClick(info: DateClickArg) {
    // Future: open appointment creation for this date/time slot
    // For now, navigate to day view on that date
    if (view !== 'timeGridDay') {
      onDateChange(info.date)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        initialDate={currentDate}
        events={events}
        headerToolbar={false}
        height="auto"
        contentHeight={650}
        timeZone="Asia/Singapore"
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        nowIndicator
        selectable={canWrite}
        editable={false}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventDisplay="block"
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        dayHeaderFormat={{
          weekday: 'short',
          day: 'numeric',
        }}
        eventContent={(arg) => {
          const teamMember = arg.event.extendedProps.teamMember
          return (
            <div className="px-1 py-0.5 text-xs leading-tight overflow-hidden">
              <div className="font-medium truncate">{arg.event.title}</div>
              {teamMember && (
                <div className="opacity-80 truncate">{teamMember}</div>
              )}
              <div className="opacity-70">{arg.timeText}</div>
            </div>
          )
        }}
      />
      <style>{`
        .calendar-wrapper .fc {
          font-family: inherit;
          font-size: 0.8125rem;
        }
        .calendar-wrapper .fc-theme-standard td,
        .calendar-wrapper .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        .calendar-wrapper .fc-theme-standard .fc-scrollgrid {
          border-color: #e5e7eb;
        }
        .calendar-wrapper .fc-col-header-cell {
          padding: 8px 0;
          background-color: #f9fafb;
          font-weight: 500;
          color: #6b7280;
        }
        .calendar-wrapper .fc-timegrid-slot {
          height: 2.5rem;
        }
        .calendar-wrapper .fc-event {
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }
        .calendar-wrapper .fc-event:hover {
          opacity: 0.9;
          filter: brightness(0.95);
        }
        .calendar-wrapper .fc-now-indicator-line {
          border-color: #ef4444;
        }
        .calendar-wrapper .fc-day-today {
          background-color: #eef2ff !important;
        }
        .calendar-wrapper .fc-daygrid-day-number {
          padding: 4px 8px;
          color: #374151;
        }
        .calendar-wrapper .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background-color: #6366f1;
          color: white;
          border-radius: 9999px;
          width: 1.75rem;
          height: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  )
}
