'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, EventContentArg } from '@fullcalendar/core'
import type { Holiday } from '@plio/db'
import { toast } from 'sonner'

import { useCalendarStore } from '@/stores/calendar-store'
import {
  sessionsToEvents,
  holidaysToEvents,
  type SessionWithDetails,
} from '@/lib/scheduling/calendar-helpers'
import { rescheduleSession, getSessions, getHolidays } from '@/app/(dashboard)/admin/calendar/actions'
import { CalendarToolbar } from './calendar-toolbar'
import { ClassEventContent } from './class-event'
import { ClassDetailPanel } from './class-detail-panel'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// CalendarView
// ---------------------------------------------------------------------------

interface CalendarViewProps {
  initialInstances: SessionWithDetails[]
  initialHolidays: Holiday[]
  initialDateFrom: string
  initialDateTo: string
}

export function CalendarView({
  initialInstances,
  initialHolidays,
  initialDateFrom,
  initialDateTo,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const { view, selectInstance } = useCalendarStore()
  const [, startTransition] = useTransition()

  // Local state for events data
  const [instances, setInstances] = useState<SessionWithDetails[]>(initialInstances)
  const [holidays, setHolidays] = useState<Holiday[]>(initialHolidays)
  const [dateRange, setDateRange] = useState({ from: initialDateFrom, to: initialDateTo })

  // Conflict dialog state
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [conflictMessages, setConflictMessages] = useState<string[]>([])

  // Compute FullCalendar events
  const classEvents = sessionsToEvents(instances)
  const holidayEvents = holidaysToEvents(holidays)
  const allEvents = [...classEvents, ...holidayEvents]

  // Get the FullCalendar API
  const getCalendarApi = useCallback(() => {
    return calendarRef.current?.getApi() ?? null
  }, [])

  // Refetch data for the current visible date range
  const refetchData = useCallback(
    async (from: string, to: string) => {
      const [instancesResult, holidaysResult] = await Promise.all([
        getSessions(from, to),
        getHolidays(from, to),
      ])

      if (instancesResult.data) {
        setInstances(instancesResult.data)
      }
      if (holidaysResult.data) {
        setHolidays(holidaysResult.data)
      }

      setDateRange({ from, to })
    },
    []
  )

  // When FullCalendar navigates to a new date range, refetch data
  function handleDatesSet(arg: { startStr: string; endStr: string }) {
    // FullCalendar returns ISO strings; extract just the date part
    const from = arg.startStr.substring(0, 10)
    const to = arg.endStr.substring(0, 10)

    // Only refetch if the range actually changed
    if (from !== dateRange.from || to !== dateRange.to) {
      startTransition(() => {
        refetchData(from, to)
      })
    }
  }

  // Sync the FullCalendar view when Zustand store view changes
  useEffect(() => {
    const api = getCalendarApi()
    if (api) {
      if (api.view.type !== view) {
        api.changeView(view)
      }
    }
  }, [view, getCalendarApi])

  // ---------------------------------------------------------------------------
  // Event click: open detail panel
  // ---------------------------------------------------------------------------

  function handleEventClick(arg: EventClickArg) {
    const { event } = arg
    const ext = event.extendedProps

    // Skip holiday background events
    if (ext.isHoliday) return

    // Store instance data in the Zustand store (as a plain object for the panel)
    selectInstance({
      id: event.id,
      sessionId: ext.sessionId,
      courseTitle: event.title,
      date: ext.date,
      startTime: ext.startTime,
      endTime: ext.endTime,
      tutorName: ext.teamMemberName,
      tutorId: ext.teamMemberId,
      roomName: ext.roomName,
      roomId: ext.roomId,
      enrollmentCount: ext.enrollmentCount,
      status: ext.status,
    })
  }

  // ---------------------------------------------------------------------------
  // Drag and drop: reschedule
  // ---------------------------------------------------------------------------

  function handleEventDrop(arg: EventDropArg) {
    const { event, revert } = arg
    const ext = event.extendedProps

    // Extract new date and times from the dropped position
    if (!event.start) {
      revert()
      return
    }

    const newDate = event.start.toISOString().substring(0, 10)
    const newStartTime = event.start.toTimeString().substring(0, 5)
    const newEndTime = event.end
      ? event.end.toTimeString().substring(0, 5)
      : ext.endTime

    // Optimistic update is already applied by FullCalendar
    startTransition(async () => {
      const result = await rescheduleSession({
        sessionId: ext.sessionId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        teamMemberId: ext.teamMemberId,
        roomId: ext.roomId,
      })

      if (!result.success) {
        // Revert the drag
        revert()

        if (result.conflicts.length > 0) {
          // Show conflict dialog
          const messages = result.conflicts.map((c) => {
            const typeLabel = c.type === 'tutor' ? 'Tutor' : 'Room'
            return `${typeLabel} conflict with "${c.serviceName}" (${c.startTime} - ${c.endTime})`
          })
          setConflictMessages(messages)
          setConflictDialogOpen(true)
        } else {
          toast.error(result.error ?? 'Failed to reschedule class')
        }
      } else {
        toast.success('Class rescheduled successfully')
        // Refetch to get the latest data
        refetchData(dateRange.from, dateRange.to)
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Custom event renderer
  // ---------------------------------------------------------------------------

  function renderEventContent(eventInfo: EventContentArg) {
    // Skip rendering custom content for background events (holidays)
    if (eventInfo.event.display === 'background') {
      return (
        <div className="px-1 text-xs text-muted-foreground">
          {eventInfo.event.title}
        </div>
      )
    }
    return <ClassEventContent eventInfo={eventInfo} />
  }

  // ---------------------------------------------------------------------------
  // Handle cancellation callback
  // ---------------------------------------------------------------------------

  function handleCancelled() {
    refetchData(dateRange.from, dateRange.to)
  }

  return (
    <div className="flex flex-col">
      <CalendarToolbar calendarApi={getCalendarApi()} />

      <div className="fc-plio-wrapper rounded-lg border bg-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          headerToolbar={false}
          events={allEvents}
          editable={true}
          droppable={false}
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          datesSet={handleDatesSet}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          allDaySlot={true}
          nowIndicator={true}
          dayMaxEvents={3}
          weekends={true}
          expandRows={true}
          stickyHeaderDates={true}
          height="auto"
          contentHeight="auto"
          eventResizableFromStart={false}
          eventDurationEditable={false}
          selectMirror={true}
          dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'short' }}
        />
      </div>

      {/* Detail panel */}
      <ClassDetailPanel onCancelled={handleCancelled} />

      {/* Conflict dialog */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scheduling Conflict</DialogTitle>
            <DialogDescription>
              The class cannot be rescheduled to this time slot due to the following conflicts:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {conflictMessages.map((msg, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm"
              >
                <span className="mt-0.5 block h-2 w-2 flex-shrink-0 rounded-full bg-destructive" />
                {msg}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setConflictDialogOpen(false)}>Understood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
