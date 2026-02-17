'use client'

import { useMemo, useState } from 'react'
import { Eye, MoreHorizontal } from 'lucide-react'
import { formatTime } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { AppointmentWithDetails } from '@/app/(dashboard)/admin/appointments/actions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_CLASSES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  no_show: 'bg-red-100 text-red-800',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppointmentTableProps {
  appointments: AppointmentWithDetails[]
  onView: (appointment: AppointmentWithDetails) => void
}

export function AppointmentTable({
  appointments,
  onView,
}: AppointmentTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return appointments
    return appointments.filter((a) => a.status === statusFilter)
  }, [appointments, statusFilter])

  if (appointments.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center rounded-md border text-sm">
        No appointments found for this date range.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Filter:</span>
        {['all', 'confirmed', 'completed', 'cancelled', 'no_show'].map(
          (status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : STATUS_LABELS[status]}
            </Button>
          )
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Practitioner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((appt) => (
            <TableRow
              key={appt.id}
              className="cursor-pointer"
              onClick={() => onView(appt)}
            >
              <TableCell>{formatDate(appt.date)}</TableCell>
              <TableCell>
                {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
              </TableCell>
              <TableCell className="font-medium">{appt.clientName}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: appt.serviceColor }}
                  />
                  {appt.serviceTitle}
                </div>
              </TableCell>
              <TableCell>{appt.practitionerName}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={STATUS_BADGE_CLASSES[appt.status] ?? ''}
                >
                  {STATUS_LABELS[appt.status] ?? appt.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div
                  className="flex items-center justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(appt)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
