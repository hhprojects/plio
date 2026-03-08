'use client'

import { useMemo, useState } from 'react'
import { useCalendarStore } from '@/stores/calendar-store'
import { CalendarView } from '@/components/calendar/calendar-view'
import { SessionDetail } from '@/components/calendar/session-detail'
import { RecurringClassForm } from '@/components/calendar/recurring-class-form'
import { AppointmentForm } from '@/components/calendar/appointment-form'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Columns3,
  LayoutList,
  Palette,
  Filter,
  Plus,
} from 'lucide-react'

interface SessionWithRelations {
  id: string
  tenant_id: string
  service_id: string
  schedule_id: string | null
  team_member_id: string
  room_id: string | null
  date: string
  start_time: string
  end_time: string
  status: string
  type: string
  created_at: string
  updated_at: string
  service: { id: string; name: string; color: string | null } | null
  team_member: { id: string; name: string; color: string | null } | null
}

interface FilterOption {
  id: string
  name: string
  color?: string | null
}

interface ContactOption {
  id: string
  name: string
}

interface CalendarPageClientProps {
  sessions: SessionWithRelations[]
  services: FilterOption[]
  teamMembers: FilterOption[]
  rooms: { id: string; name: string }[]
  contacts: ContactOption[]
  calendarConfig: Record<string, unknown>
  role: string
}

const VIEW_OPTIONS = [
  { value: 'dayGridMonth' as const, label: 'Month', icon: Grid3X3 },
  { value: 'timeGridWeek' as const, label: 'Week', icon: Columns3 },
  { value: 'timeGridDay' as const, label: 'Day', icon: LayoutList },
]

export function CalendarPageClient({
  sessions,
  services,
  teamMembers,
  rooms,
  contacts,
  calendarConfig,
  role,
}: CalendarPageClientProps) {
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const {
    view,
    currentDate,
    selectedSessionId,
    colorBy,
    filters,
    setView,
    setCurrentDate,
    selectSession,
    setColorBy,
    setFilters,
  } = useCalendarStore()

  // Apply filters
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filters.teamMemberId && s.team_member_id !== filters.teamMemberId) return false
      if (filters.serviceId && s.service_id !== filters.serviceId) return false
      if (filters.roomId && s.room_id !== filters.roomId) return false
      return true
    })
  }, [sessions, filters])

  // Map sessions to FullCalendar events
  const events = useMemo(() => {
    return filteredSessions.map((s) => {
      const color =
        colorBy === 'service'
          ? s.service?.color ?? '#6366f1'
          : s.team_member?.color ?? '#6366f1'

      return {
        id: s.id,
        title: s.service?.name ?? 'Session',
        start: `${s.date}T${s.start_time}`,
        end: `${s.date}T${s.end_time}`,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          sessionId: s.id,
          teamMember: s.team_member?.name,
          status: s.status,
          type: s.type,
        },
      }
    })
  }, [filteredSessions, colorBy])

  const selectedSession = selectedSessionId
    ? sessions.find((s) => s.id === selectedSessionId) ?? null
    : null

  // Find the room for the selected session
  const selectedSessionRoom = selectedSession?.room_id
    ? rooms.find((r) => r.id === selectedSession.room_id) ?? null
    : null

  function navigateDate(direction: 'prev' | 'next' | 'today') {
    const d = new Date(currentDate)
    if (direction === 'today') {
      setCurrentDate(new Date())
      return
    }
    if (view === 'dayGridMonth') {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view === 'timeGridWeek') {
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      d.setDate(d.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(d)
  }

  const dateLabel = useMemo(() => {
    const d = currentDate
    const formatter = new Intl.DateTimeFormat('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: 'long',
      ...(view === 'timeGridDay' ? { day: 'numeric', weekday: 'short' } : {}),
    })
    return formatter.format(d)
  }, [currentDate, view])

  const canWrite = ['super_admin', 'admin', 'staff'].includes(role)
  const recurringEnabled = calendarConfig.recurring_enabled !== false
  const appointmentsEnabled = calendarConfig.appointments_enabled !== false

  function handleDateClick(date: Date) {
    if (canWrite && appointmentsEnabled) {
      const dateStr = date.toISOString().split('T')[0]
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const timeStr = hours !== '00' || minutes !== '00' ? `${hours}:${minutes}` : undefined
      setSelectedDate(dateStr)
      setSelectedTime(timeStr)
      setShowAppointmentForm(true)
    }
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && appointmentsEnabled && (
            <button
              onClick={() => {
                setSelectedDate(undefined)
                setSelectedTime(undefined)
                setShowAppointmentForm(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New Appointment
            </button>
          )}
          {canWrite && recurringEnabled && (
            <button
              onClick={() => setShowRecurringForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-md hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              New Recurring Class
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
        {/* Date navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDate('prev')}
            className="p-1.5 rounded hover:bg-gray-100"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigateDate('today')}
            className="px-3 py-1 text-sm font-medium rounded hover:bg-gray-100"
          >
            Today
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="p-1.5 rounded hover:bg-gray-100"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-2 text-sm font-semibold text-gray-800">{dateLabel}</span>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* View buttons */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
          {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded ${
                view === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Color by toggle */}
        <div className="flex items-center gap-1.5 text-xs">
          <Palette className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-gray-500">Color:</span>
          <button
            onClick={() => setColorBy(colorBy === 'service' ? 'team_member' : 'service')}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 font-medium text-gray-700"
          >
            {colorBy === 'service' ? 'Service' : 'Team Member'}
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="h-3.5 w-3.5 text-gray-500" />
          <select
            value={filters.serviceId ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, serviceId: e.target.value || undefined })
            }
            className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            value={filters.teamMemberId ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, teamMemberId: e.target.value || undefined })
            }
            className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">All Team</option>
            {teamMembers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            value={filters.roomId ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, roomId: e.target.value || undefined })
            }
            className="border border-gray-200 rounded px-2 py-1 text-xs bg-white"
          >
            <option value="">All Rooms</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {(filters.serviceId || filters.teamMemberId || filters.roomId) && (
            <button
              onClick={() => setFilters({})}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Calendar + Detail panel */}
      <div className="flex gap-4">
        <div className={`flex-1 min-w-0 ${selectedSession ? 'max-w-[calc(100%-416px)]' : ''}`}>
          <CalendarView
            events={events}
            view={view}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onEventClick={(id) => selectSession(id)}
            onDateClick={handleDateClick}
            canWrite={canWrite}
          />
        </div>
        {selectedSession && (
          <SessionDetail
            session={selectedSession}
            room={selectedSessionRoom}
            onClose={() => selectSession(null)}
          />
        )}
      </div>

      {/* Recurring class form dialog */}
      <RecurringClassForm
        open={showRecurringForm}
        onClose={() => setShowRecurringForm(false)}
        services={services}
        teamMembers={teamMembers}
        rooms={rooms}
      />

      {/* Appointment form dialog */}
      {showAppointmentForm && (
        <AppointmentForm
          services={services}
          teamMembers={teamMembers}
          contacts={contacts}
          initialDate={selectedDate}
          initialTime={selectedTime}
          onClose={() => setShowAppointmentForm(false)}
        />
      )}
    </div>
  )
}
