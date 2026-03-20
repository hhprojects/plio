'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { STATUS_COLORS } from '@/lib/constants'
import { useParentStore } from '@/stores/parent-store'
import { StudentSelector } from '@/components/parent/student-selector'
import { cancelEnrollment, getParentSchedule } from './actions'

interface ScheduleEntry {
  enrollmentId: string
  dependentId: string
  dependentName: string
  sessionId: string
  date: string
  startTime: string
  endTime: string
  serviceName: string
  serviceColor: string
  teamMemberName: string
  roomName: string | null
  status: string
  sessionStatus: string
}

interface ScheduleData {
  children: Array<{ id: string; fullName: string }>
  upcoming: ScheduleEntry[]
  past: ScheduleEntry[]
}

export function SchedulePageClient({ data }: { data: ScheduleData }) {
  const { selectedStudentId, setStudents } = useParentStore()
  const [upcoming, setUpcoming] = useState(data.upcoming as ScheduleEntry[])
  const [past] = useState(data.past as ScheduleEntry[])
  const [cancelDialog, setCancelDialog] = useState<ScheduleEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setStudents(data.children)
  }, [data.children, setStudents])

  const filteredUpcoming = selectedStudentId
    ? upcoming.filter((e) => e.dependentId === selectedStudentId)
    : upcoming

  const filteredPast = selectedStudentId
    ? past.filter((e) => e.dependentId === selectedStudentId)
    : past

  function handleCancel() {
    if (!cancelDialog) return
    startTransition(async () => {
      const result = await cancelEnrollment(cancelDialog.enrollmentId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Class cancelled successfully.')
        // Refresh data
        const refreshed = await getParentSchedule()
        if (refreshed.data) {
          setUpcoming(refreshed.data.upcoming as ScheduleEntry[])
        }
      }
      setCancelDialog(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Schedule</h2>
          <Button size="sm" asChild>
            <Link href="/parent/schedule/makeup">
              <Plus className="mr-1 h-4 w-4" />
              Book Makeup
            </Link>
          </Button>
        </div>
        {data.children.length > 1 && <StudentSelector />}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({filteredUpcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({filteredPast.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-2">
          {filteredUpcoming.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No upcoming classes</p>
            </div>
          ) : (
            filteredUpcoming.map((entry) => (
              <div
                key={entry.enrollmentId}
                className="rounded-lg border bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.serviceColor }}
                      />
                      <span className="font-medium">{entry.serviceName}</span>
                      <Badge
                        variant="secondary"
                        className={STATUS_COLORS[entry.status] ?? ''}
                      >
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-500">
                      <p>{entry.dependentName}</p>
                      <p>
                        {new Date(entry.date).toLocaleDateString('en-SG', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                        {' '}{entry.startTime.slice(0, 5)} - {entry.endTime.slice(0, 5)}
                      </p>
                      <p>Tutor: {entry.teamMemberName}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setCancelDialog(entry)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-2">
          {filteredPast.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <p className="text-gray-500">No past classes</p>
            </div>
          ) : (
            filteredPast.slice(0, 20).map((entry) => (
              <div
                key={entry.enrollmentId}
                className="rounded-lg border bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entry.serviceColor }}
                  />
                  <span className="font-medium">{entry.serviceName}</span>
                  <Badge
                    variant="secondary"
                    className={STATUS_COLORS[entry.status] ?? ''}
                  >
                    {entry.status}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  <p>
                    {entry.dependentName} &middot;{' '}
                    {new Date(entry.date).toLocaleDateString('en-SG', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Class</DialogTitle>
            <DialogDescription>
              Cancel {cancelDialog?.serviceName} on{' '}
              {cancelDialog?.date
                ? new Date(cancelDialog.date).toLocaleDateString('en-SG', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : ''}
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog(null)}
              disabled={isPending}
            >
              Keep Class
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? 'Cancelling...' : 'Cancel Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
