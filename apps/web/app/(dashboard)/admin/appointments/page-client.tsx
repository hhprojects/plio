'use client'

import { useCallback, useState, useTransition } from 'react'
import { CalendarDays, List, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AppointmentCalendar } from '@/components/admin/appointments/appointment-calendar'
import { AppointmentTable } from '@/components/admin/appointments/appointment-table'
import { AppointmentForm } from '@/components/admin/appointments/appointment-form'
import { AppointmentDetailSheet } from '@/components/admin/appointments/appointment-detail-sheet'
import {
  getAppointments,
  type AppointmentWithDetails,
} from './actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppointmentsPageClientProps {
  initialAppointments: AppointmentWithDetails[]
  initialDateFrom: string
  initialDateTo: string
}

export function AppointmentsPageClient({
  initialAppointments,
  initialDateFrom,
  initialDateTo,
}: AppointmentsPageClientProps) {
  const [, startTransition] = useTransition()

  // View mode
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // Data
  const [appointments, setAppointments] =
    useState<AppointmentWithDetails[]>(initialAppointments)
  const [dateRange, setDateRange] = useState({
    from: initialDateFrom,
    to: initialDateTo,
  })

  // Form state
  const [formOpen, setFormOpen] = useState(false)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentWithDetails | null>(null)

  // Refetch appointments
  const refetchAppointments = useCallback(
    (from?: string, to?: string) => {
      const fetchFrom = from ?? dateRange.from
      const fetchTo = to ?? dateRange.to
      startTransition(async () => {
        const result = await getAppointments(fetchFrom, fetchTo)
        if (result.error) {
          toast.error(result.error)
        } else {
          setAppointments(result.data)
        }
      })
    },
    [dateRange.from, dateRange.to, startTransition]
  )

  // Calendar date range changes
  const handleDateRangeChange = useCallback(
    (from: string, to: string) => {
      if (from !== dateRange.from || to !== dateRange.to) {
        setDateRange({ from, to })
        refetchAppointments(from, to)
      }
    },
    [dateRange.from, dateRange.to, refetchAppointments]
  )

  // Event click opens detail sheet
  const handleEventClick = useCallback((appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment)
    setDetailOpen(true)
  }, [])

  // When appointment is created or status changes, refetch
  const handleDataChanged = useCallback(() => {
    refetchAppointments()
  }, [refetchAppointments])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage wellness appointments and bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="mr-1.5 h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="mr-1.5 h-4 w-4" />
              List
            </Button>
          </div>

          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'calendar' ? (
        <AppointmentCalendar
          appointments={appointments}
          onEventClick={handleEventClick}
          onDateRangeChange={handleDateRangeChange}
        />
      ) : (
        <AppointmentTable
          appointments={appointments}
          onView={handleEventClick}
        />
      )}

      {/* Detail sheet */}
      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChanged={handleDataChanged}
      />

      {/* Booking form */}
      <AppointmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={handleDataChanged}
      />
    </div>
  )
}
