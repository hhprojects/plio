'use client'

import { useTransition } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { formatTime, formatDate } from '@plio/utils'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  deleteRecurringSchedule,
  type ScheduleWithDetails,
} from '@/app/(dashboard)/admin/schedules/actions'

// ---------------------------------------------------------------------------
// Day names
// ---------------------------------------------------------------------------

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ScheduleListProps {
  schedules: ScheduleWithDetails[]
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        No schedules yet. Create one to get started.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead>Day</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Team Member</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Period</TableHead>
          <TableHead className="w-[60px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schedules.map((schedule) => (
          <ScheduleRow key={schedule.id} schedule={schedule} />
        ))}
      </TableBody>
    </Table>
  )
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function ScheduleRow({ schedule }: { schedule: ScheduleWithDetails }) {
  const [isPending, startTransition] = useTransition()

  const timeRange = `${formatTime(schedule.startTime)} \u2013 ${formatTime(schedule.endTime)}`

  const fromDate = formatDate(new Date(schedule.effectiveFrom + 'T00:00:00'), 'DD MMM YYYY')
  const untilDate = schedule.effectiveUntil
    ? formatDate(new Date(schedule.effectiveUntil + 'T00:00:00'), 'DD MMM YYYY')
    : 'Ongoing'
  const period = schedule.effectiveUntil ? `${fromDate} \u2013 ${untilDate}` : `${fromDate} \u2013 Ongoing`

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRecurringSchedule(schedule.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Schedule deleted')
      }
    })
  }

  return (
    <TableRow>
      {/* Service */}
      <TableCell>
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: schedule.serviceColor }}
          />
          {schedule.serviceName}
        </span>
      </TableCell>

      {/* Day */}
      <TableCell>{DAY_NAMES[schedule.dayOfWeek]}</TableCell>

      {/* Time */}
      <TableCell>{timeRange}</TableCell>

      {/* Team Member */}
      <TableCell>{schedule.teamMemberName}</TableCell>

      {/* Room */}
      <TableCell>{schedule.roomName ?? '\u2014'}</TableCell>

      {/* Period */}
      <TableCell>{period}</TableCell>

      {/* Actions */}
      <TableCell>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Delete schedule"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  )
}
