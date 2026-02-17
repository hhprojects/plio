'use client'

import {
  CalendarDays,
  Clock,
  DollarSign,
  Tag,
  Timer,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { ServiceWithCounts } from '@/app/(dashboard)/admin/services/actions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(price)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ServiceDetailSheetProps {
  service: ServiceWithCounts | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceDetailSheet({
  service,
  open,
  onOpenChange,
}: ServiceDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {service && (
              <div
                className="h-5 w-5 rounded-full border"
                style={{ backgroundColor: service.colorCode }}
              />
            )}
            <SheetTitle>{service?.title ?? 'Service Details'}</SheetTitle>
          </div>
          <SheetDescription>
            View service information and statistics.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
          {service && (
            <div className="space-y-6 pt-4">
              {/* Description */}
              {service.description && (
                <div className="space-y-2">
                  <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                    {service.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Details */}
              <div className="space-y-3">
                {service.category && (
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="text-muted-foreground h-4 w-4" />
                    <span>{service.category}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>{service.durationMinutes} minutes</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span>{formatPrice(service.price)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Timer className="text-muted-foreground h-4 w-4" />
                  <span>
                    Buffer:{' '}
                    {service.bufferMinutes === null
                      ? 'Default'
                      : `${service.bufferMinutes} min`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <Badge
                    variant="secondary"
                    className={
                      service.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {service.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Upcoming Appointments section */}
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4" />
                  Upcoming Appointments
                </h4>
                <p className="text-muted-foreground text-sm">
                  {service.appointmentCount === 0
                    ? 'No upcoming appointments.'
                    : `${service.appointmentCount} upcoming appointment${service.appointmentCount === 1 ? '' : 's'}.`}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
