'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BookingFlow } from '@/components/booking/booking-flow'
import { ServiceSelector } from '@/components/booking/service-selector'
import { PractitionerSelector } from '@/components/booking/practitioner-selector'
import { SlotPicker } from '@/components/booking/slot-picker'
import { BookingConfirm } from '@/components/booking/booking-confirm'

interface ServiceItem {
  id: string
  title: string
  description: string | null
  category: string | null
  duration_minutes: number
  price: number
  color_code: string
}

interface Practitioner {
  id: string
  full_name: string
}

interface TenantData {
  id: string
  name: string
  slug: string
  business_type: string
  settings: Record<string, unknown> | null
}

interface ConfirmationData {
  appointmentId: string
  endTime: string
}

interface BookingPageClientProps {
  tenant: TenantData
  services: ServiceItem[]
  practitioners: Practitioner[]
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

export function BookingPageClient({ tenant, services, practitioners }: BookingPageClientProps) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null)
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null)
  const [resolvedPractitionerId, setResolvedPractitionerId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null)

  function handleServiceSelect(service: ServiceItem) {
    setSelectedService(service)
    setStep(2)
  }

  function handlePractitionerSelect(practitioner: Practitioner | null) {
    setSelectedPractitioner(practitioner)
    setSelectedPractitionerId(practitioner?.id ?? null)
    setStep(3)
  }

  function handleSlotSelect(date: string, slot: { start: string; end: string }, practId: string) {
    setSelectedDate(date)
    setSelectedSlot(slot)
    setResolvedPractitionerId(practId)
    setStep(4)
  }

  function handleConfirmed(data: ConfirmationData) {
    setConfirmationData(data)
    setConfirmed(true)
  }

  function handleReset() {
    setStep(1)
    setSelectedService(null)
    setSelectedPractitioner(null)
    setSelectedPractitionerId(null)
    setResolvedPractitionerId(null)
    setSelectedDate(null)
    setSelectedSlot(null)
    setConfirmed(false)
    setConfirmationData(null)
  }

  // Get the resolved practitioner name for display
  const resolvedPractitionerName =
    practitioners.find((p) => p.id === resolvedPractitionerId)?.full_name ?? 'Any available'

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-center mb-2">{tenant.name}</h1>
      <p className="text-center text-muted-foreground mb-8">Book an appointment</p>

      {confirmed && confirmationData ? (
        <div className="text-center space-y-6">
          {/* Green checkmark */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Booking Confirmed!</h2>
            <p className="text-muted-foreground mt-1">Your appointment has been scheduled.</p>
          </div>

          <Card>
            <CardContent className="space-y-2 pt-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{selectedService?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Practitioner</span>
                <span className="font-medium">{resolvedPractitionerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{selectedDate && formatDate(selectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">
                  {selectedSlot && formatTime(selectedSlot.start)} &ndash;{' '}
                  {confirmationData.endTime && formatTime(confirmationData.endTime)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleReset} variant="outline" className="mt-4">
            Book Another Appointment
          </Button>
        </div>
      ) : (
        <>
          <BookingFlow currentStep={step} />

          {step === 1 && (
            <ServiceSelector
              services={services}
              selectedId={selectedService?.id ?? null}
              onSelect={handleServiceSelect}
            />
          )}

          {step === 2 && (
            <PractitionerSelector
              practitioners={practitioners}
              selectedId={selectedPractitionerId}
              onSelect={handlePractitionerSelect}
              onBack={() => setStep(1)}
            />
          )}

          {step === 3 && selectedService && (
            <SlotPicker
              tenantId={tenant.id}
              serviceId={selectedService.id}
              practitionerId={selectedPractitionerId}
              practitioners={practitioners}
              onSelect={handleSlotSelect}
              onBack={() => setStep(2)}
            />
          )}

          {step === 4 && selectedService && selectedSlot && selectedDate && resolvedPractitionerId && (
            <BookingConfirm
              tenantId={tenant.id}
              service={selectedService}
              practitionerName={resolvedPractitionerName}
              practitionerId={resolvedPractitionerId}
              date={selectedDate}
              startTime={selectedSlot.start}
              onConfirmed={handleConfirmed}
              onBack={() => setStep(3)}
            />
          )}
        </>
      )}
    </div>
  )
}
