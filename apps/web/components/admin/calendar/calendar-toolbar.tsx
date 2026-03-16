'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCalendarStore } from '@/stores/calendar-store'
import type { CalendarApi } from '@fullcalendar/core'

// ---------------------------------------------------------------------------
// View type mapping
// ---------------------------------------------------------------------------

type ViewKey = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

const VIEW_LABELS: { key: ViewKey; label: string }[] = [
  { key: 'timeGridDay', label: 'Day' },
  { key: 'timeGridWeek', label: 'Week' },
  { key: 'dayGridMonth', label: 'Month' },
]

// ---------------------------------------------------------------------------
// CalendarToolbar
// ---------------------------------------------------------------------------

interface CalendarToolbarProps {
  calendarApi: CalendarApi | null
}

export function CalendarToolbar({ calendarApi }: CalendarToolbarProps) {
  const { view, setView } = useCalendarStore()

  // Navigation handlers that sync both FullCalendar and Zustand store
  function handlePrev() {
    if (!calendarApi) return
    calendarApi.prev()
    useCalendarStore.getState().setCurrentDate(calendarApi.getDate())
  }

  function handleNext() {
    if (!calendarApi) return
    calendarApi.next()
    useCalendarStore.getState().setCurrentDate(calendarApi.getDate())
  }

  function handleToday() {
    if (!calendarApi) return
    calendarApi.today()
    useCalendarStore.getState().setCurrentDate(calendarApi.getDate())
  }

  function handleViewChange(newView: ViewKey) {
    if (!calendarApi) return
    calendarApi.changeView(newView)
    setView(newView)
  }

  // Get the title from FullCalendar API (e.g. "Feb 15 - 21, 2026")
  const title = calendarApi?.view.title ?? ''

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
      {/* Left: Today + navigation arrows */}
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      {/* Center: Date range label */}
      <h2 className="text-lg font-semibold">{title}</h2>

      {/* Right: View switcher */}
      <div className="flex items-center rounded-md border bg-muted p-0.5">
        {VIEW_LABELS.map(({ key, label }) => (
          <Button
            key={key}
            variant={view === key ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handleViewChange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
