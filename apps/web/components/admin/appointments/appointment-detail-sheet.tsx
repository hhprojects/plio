'use client'

import { useState, useTransition } from 'react'
import {
  Calendar,
  Clock,
  Phone,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatTime } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  updateAppointmentStatus,
  type AppointmentWithDetails,
} from '@/app/(dashboard)/admin/appointments/actions'

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

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(price)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppointmentDetailSheetProps {
  appointment: AppointmentWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChanged?: () => void
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onOpenChange,
  onStatusChanged,
}: AppointmentDetailSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handleStatusUpdate = (status: string) => {
    if (!appointment) return

    startTransition(async () => {
      const result = await updateAppointmentStatus({
        appointment_id: appointment.id,
        status,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Appointment marked as ${STATUS_LABELS[status]?.toLowerCase() ?? status}`)
        onOpenChange(false)
        onStatusChanged?.()
      }
    })
  }

  const handleCancel = () => {
    if (!appointment) return
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason')
      return
    }

    startTransition(async () => {
      const result = await updateAppointmentStatus({
        appointment_id: appointment.id,
        status: 'cancelled',
        cancellation_reason: cancelReason,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Appointment cancelled')
        setShowCancelForm(false)
        setCancelReason('')
        onOpenChange(false)
        onStatusChanged?.()
      }
    })
  }

  // Reset cancel form when sheet closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setShowCancelForm(false)
      setCancelReason('')
    }
    onOpenChange(isOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {appointment && (
              <div
                className="h-5 w-5 rounded-full border"
                style={{ backgroundColor: appointment.serviceColor }}
              />
            )}
            <SheetTitle>
              {appointment?.serviceTitle ?? 'Appointment Details'}
            </SheetTitle>
          </div>
          <SheetDescription>
            View appointment details and manage status.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
          {appointment && (
            <div className="space-y-6 pt-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Status:</span>
                <Badge
                  variant="secondary"
                  className={STATUS_BADGE_CLASSES[appointment.status] ?? ''}
                >
                  {STATUS_LABELS[appointment.status] ?? appointment.status}
                </Badge>
              </div>

              <Separator />

              {/* Service info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Service</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className="h-3 w-3 rounded-full border"
                      style={{ backgroundColor: appointment.serviceColor }}
                    />
                    <span className="font-medium">
                      {appointment.serviceTitle}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{appointment.serviceDurationMinutes} minutes</span>
                    <span className="mx-1">|</span>
                    <span>{formatPrice(appointment.servicePrice)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Practitioner */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Practitioner</h4>
                <div className="flex items-center gap-2 text-sm">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span>{appointment.practitionerName}</span>
                </div>
              </div>

              <Separator />

              {/* Client */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Client</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="text-muted-foreground h-4 w-4" />
                    <span>{appointment.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <span>{appointment.clientPhone}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Date and Time */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Schedule</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span>{formatDate(appointment.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span>
                      {formatTime(appointment.startTime)} -{' '}
                      {formatTime(appointment.endTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancellation reason (if cancelled) */}
              {appointment.status === 'cancelled' &&
                appointment.cancellationReason && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Cancellation Reason
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {appointment.cancellationReason}
                      </p>
                    </div>
                  </>
                )}

              {/* Status action buttons (only for confirmed appointments) */}
              {appointment.status === 'confirmed' && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Actions</h4>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={isPending}
                      >
                        <CheckCircle className="mr-1.5 h-4 w-4" />
                        Mark Complete
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleStatusUpdate('no_show')}
                        disabled={isPending}
                      >
                        <AlertTriangle className="mr-1.5 h-4 w-4" />
                        Mark No-Show
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowCancelForm(true)}
                        disabled={isPending || showCancelForm}
                      >
                        <XCircle className="mr-1.5 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>

                    {showCancelForm && (
                      <div className="space-y-2 rounded-md border border-gray-200 p-3">
                        <label className="text-sm font-medium">
                          Cancellation Reason
                        </label>
                        <Textarea
                          placeholder="Enter the reason for cancellation..."
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={isPending || !cancelReason.trim()}
                          >
                            Confirm Cancellation
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowCancelForm(false)
                              setCancelReason('')
                            }}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
