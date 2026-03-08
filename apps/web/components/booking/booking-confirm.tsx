'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// TODO: reconnect when public booking page is rebuilt
// import { createBooking } from '@/app/(public)/book/[slug]/actions'
const createBooking = async (
  _formData: FormData
): Promise<{ error?: string; success?: boolean; appointmentId?: string; endTime?: string }> => ({
  error: 'Booking not yet available',
})

interface BookingConfirmProps {
  tenantId: string
  service: {
    id: string
    title: string
    duration_minutes: number
    price: number
  }
  practitionerName: string
  practitionerId: string
  date: string
  startTime: string
  onConfirmed: (data: { appointmentId: string; endTime: string }) => void
  onBack: () => void
}

function formatTime(time: string) {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`
}

export function BookingConfirm({
  tenantId,
  service,
  practitionerName,
  practitionerId,
  date,
  startTime,
  onConfirmed,
  onBack,
}: BookingConfirmProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createBooking(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        onConfirmed({
          appointmentId: result.appointmentId!,
          endTime: result.endTime!,
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isPending}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <h2 className="text-lg font-semibold">Confirm Your Booking</h2>
      </div>

      {/* Booking summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Appointment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Practitioner</span>
            <span className="font-medium">{practitionerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{formatDate(date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span className="font-medium">{formatTime(startTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{service.duration_minutes} min</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-medium">Total</span>
            <span className="font-semibold text-indigo-600">{formatPrice(service.price)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Client details form */}
      <form action={handleSubmit} className="space-y-4">
        {/* Hidden fields */}
        <input type="hidden" name="tenant_id" value={tenantId} />
        <input type="hidden" name="service_id" value={service.id} />
        <input type="hidden" name="practitioner_id" value={practitionerId} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="start_time" value={startTime} />

        <div className="space-y-2">
          <Label htmlFor="client_name">Name *</Label>
          <Input
            id="client_name"
            name="client_name"
            required
            placeholder="Your full name"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_phone">Phone *</Label>
          <Input
            id="client_phone"
            name="client_phone"
            type="tel"
            required
            placeholder="e.g. 9123 4567"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_email">Email (optional)</Label>
          <Input
            id="client_email"
            name="client_email"
            type="email"
            placeholder="your@email.com"
            disabled={isPending}
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          disabled={isPending}
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Confirming...
            </span>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </form>
    </div>
  )
}
