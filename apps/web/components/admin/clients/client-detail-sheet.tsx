'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  CalendarDays,
  Clock,
  Mail,
  Phone,
  User,
} from 'lucide-react'

import { formatDate } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { STATUS_COLORS } from '@/lib/constants'
import { ClientNotes } from '@/components/admin/clients/client-notes'
import {
  getClientAppointments,
  type ClientAppointment,
  type ClientWithStats,
} from '@/app/(dashboard)/admin/clients/actions'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ClientDetailSheetProps {
  client: ClientWithStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDetailSheet({
  client,
  open,
  onOpenChange,
}: ClientDetailSheetProps) {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && client) {
      setAppointments([])
      startTransition(async () => {
        const result = await getClientAppointments(client.id)
        if (result.data) {
          setAppointments(result.data)
        }
      })
    }
  }, [open, client])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>{client?.fullName ?? 'Client Details'}</SheetTitle>
          <SheetDescription>
            View client information and visit history.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
          {!client ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Client info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span>{client.fullName}</span>
                  <Badge
                    variant="secondary"
                    className={
                      client.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {client.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span>{client.phone}</span>
                </div>

                {client.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">{client.email}</span>
                  </div>
                )}

                {client.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="text-muted-foreground h-4 w-4" />
                    <span>
                      {formatDate(client.dateOfBirth, 'DD MMM YYYY')}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Visit history */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Visit History ({appointments.length})
                </h4>
                {isPending ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : appointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No visit history yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {appt.serviceTitle}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(appt.date, 'DD MMM YYYY')} &middot;{' '}
                            {appt.startTime.slice(0, 5)}–
                            {appt.endTime.slice(0, 5)}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {appt.practitionerName}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[appt.status] ?? ''}
                        >
                          {appt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Client notes */}
              <ClientNotes clientId={client.id} canDelete={true} />
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
