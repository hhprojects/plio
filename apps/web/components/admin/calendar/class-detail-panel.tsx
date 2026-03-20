'use client'

import { useState, useTransition } from 'react'
import { formatTime } from '@plio/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCalendarStore } from '@/stores/calendar-store'
import { cancelSession } from '@/app/(dashboard)/admin/calendar/actions'
import { toast } from 'sonner'
import { Clock, MapPin, User, Users, XCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Status badge variant mapping
// ---------------------------------------------------------------------------

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'scheduled':
      return 'default'
    case 'cancelled':
      return 'destructive'
    case 'holiday':
      return 'secondary'
    default:
      return 'outline'
  }
}

// ---------------------------------------------------------------------------
// ClassDetailPanel
// ---------------------------------------------------------------------------

interface ClassDetailPanelProps {
  /** Called after a successful cancellation so the calendar can refresh */
  onCancelled?: () => void
}

export function ClassDetailPanel({ onCancelled }: ClassDetailPanelProps) {
  const { isDetailPanelOpen, selectedInstance, toggleDetailPanel, selectInstance } =
    useCalendarStore()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const instance = selectedInstance

  if (!instance) {
    return (
      <Sheet open={isDetailPanelOpen} onOpenChange={(open) => toggleDetailPanel(open)}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>No class selected</SheetTitle>
            <SheetDescription>Click on a class event to view details.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    )
  }

  const title = instance.courseTitle ?? 'Untitled Class'
  const date = instance.date ?? ''
  const startTime = instance.startTime ?? ''
  const endTime = instance.endTime ?? ''
  const tutorName = instance.tutorName ?? 'Unassigned'
  const roomName = instance.roomName ?? null
  const status = instance.status ?? 'scheduled'
  const enrollmentCount = instance.enrollmentCount ?? 0
  const maxCapacity = instance.maxCapacity ?? 0
  const overrideNotes = instance.overrideNotes ?? null
  const instanceId = instance.sessionId ?? instance.instanceId ?? instance.id ?? ''

  const isCancelled = status === 'cancelled'

  function handleClose() {
    toggleDetailPanel(false)
    selectInstance(null)
  }

  function handleCancelClass() {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    startTransition(async () => {
      const result = await cancelSession({
        sessionId: instanceId,
        reason: cancelReason.trim(),
      })

      if (result.success) {
        toast.success('Class cancelled successfully')
        setShowCancelDialog(false)
        setCancelReason('')
        handleClose()
        onCancelled?.()
      } else {
        toast.error(result.error ?? 'Failed to cancel class')
      }
    })
  }

  // Format the date for display
  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-SG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <>
      <Sheet open={isDetailPanelOpen} onOpenChange={(open) => {
        if (!open) handleClose()
        else toggleDetailPanel(true)
      }}>
        <SheetContent side="right" className="w-[380px] sm:max-w-[420px]">
          <SheetHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <SheetTitle className="text-lg">{title}</SheetTitle>
                <SheetDescription>{formattedDate}</SheetDescription>
              </div>
              <Badge variant={statusVariant(status)} className="capitalize">
                {status}
              </Badge>
            </div>
          </SheetHeader>

          <Separator />

          {/* Details section */}
          <div className="space-y-4 px-4">
            {/* Time */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {startTime ? formatTime(startTime) : '--'} &ndash;{' '}
                {endTime ? formatTime(endTime) : '--'}
              </span>
            </div>

            {/* Tutor */}
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{tutorName}</span>
            </div>

            {/* Room */}
            {roomName && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{roomName}</span>
              </div>
            )}

            {/* Enrollment */}
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {enrollmentCount} / {maxCapacity} enrolled
              </span>
              {enrollmentCount >= maxCapacity && maxCapacity > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  Full
                </Badge>
              )}
            </div>

            {/* Override notes */}
            {overrideNotes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{overrideNotes}</p>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Quick actions */}
          <div className="space-y-2 px-4 pb-4">
            <p className="text-xs font-medium text-muted-foreground">Actions</p>
            {!isCancelled && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Class
              </Button>
            )}
            {isCancelled && (
              <p className="text-center text-sm text-muted-foreground">
                This class has been cancelled.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel &ldquo;{title}&rdquo; on {formattedDate}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label htmlFor="cancel-reason" className="text-sm font-medium">
              Reason for cancellation
            </label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Tutor is unavailable"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setCancelReason('')
              }}
            >
              Keep Class
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelClass}
              disabled={isPending || !cancelReason.trim()}
            >
              {isPending ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
