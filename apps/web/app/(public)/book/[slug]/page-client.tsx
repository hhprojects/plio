'use client'

import { useState } from 'react'
import { ServicePicker } from '@/components/booking/service-picker'
import { SlotPicker } from '@/components/booking/slot-picker'
import { ClientForm } from '@/components/booking/client-form'
import type { TenantSettings } from '@plio/db'

interface ServiceItem {
  id: string
  name: string
  description: string | null
  duration_minutes: number | null
  price: number | null
  currency: string
  buffer_minutes: number
  color: string | null
}

interface TeamMemberItem {
  id: string
  name: string
  color: string | null
}

interface BookingPageClientProps {
  tenant: { id: string; name: string; settings: TenantSettings | null }
  services: ServiceItem[]
  teamMembers: TeamMemberItem[]
  slug: string
}

type Step = 'service' | 'slot' | 'form' | 'confirmed'

interface SelectedSlot {
  team_member_id: string
  team_member_name: string
  start_time: string
  end_time: string
  date: string
}

const STEP_LABELS = ['Service', 'Date & Time', 'Your Details', 'Confirmed']

function getStepIndex(step: Step): number {
  switch (step) {
    case 'service':
      return 0
    case 'slot':
      return 1
    case 'form':
      return 2
    case 'confirmed':
      return 3
  }
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

export function BookingPageClient({
  tenant,
  services,
  teamMembers,
  slug,
}: BookingPageClientProps) {
  const [step, setStep] = useState<Step>('service')
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(
    null
  )
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)

  const accentColor = tenant.settings?.accent_color ?? '#6366f1'
  const currentStepIndex = getStepIndex(step)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-center gap-3">
            {tenant.settings?.logo_url && (
              <img
                src={tenant.settings.logo_url}
                alt={tenant.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {tenant.name}
              </h1>
              <p className="text-sm text-gray-500">Book an appointment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <div className="flex items-center justify-between mb-8">
          {STEP_LABELS.map((label, index) => {
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex
            return (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white'
                        : isCompleted
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                    style={isActive ? { backgroundColor: accentColor } : {}}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`mt-1 text-xs hidden sm:block ${
                      isActive ? 'font-medium text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-0.5 w-full mx-1 -mt-5 ${
                      index < currentStepIndex ? 'bg-indigo-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 pb-12">
        {step === 'service' && (
          <ServicePicker
            services={services}
            selectedId={selectedService?.id ?? null}
            accentColor={accentColor}
            onSelect={(service) => {
              setSelectedService(service)
              setStep('slot')
            }}
          />
        )}

        {step === 'slot' && selectedService && (
          <SlotPicker
            tenantId={tenant.id}
            serviceId={selectedService.id}
            accentColor={accentColor}
            onSelect={(slot) => {
              setSelectedSlot(slot)
              setStep('form')
            }}
            onBack={() => setStep('service')}
          />
        )}

        {step === 'form' && selectedService && selectedSlot && (
          <ClientForm
            tenantId={tenant.id}
            service={selectedService}
            slot={selectedSlot}
            accentColor={accentColor}
            onConfirmed={() => setStep('confirmed')}
            onBack={() => setStep('slot')}
          />
        )}

        {step === 'confirmed' && selectedService && selectedSlot && (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-gray-600 mb-6">
              Your appointment has been scheduled.
            </p>
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-left max-w-sm mx-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">
                  {selectedService.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Practitioner</span>
                <span className="font-medium text-gray-900">
                  {selectedSlot.team_member_name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">
                  {formatDate(selectedSlot.date)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">
                  {formatTime(selectedSlot.start_time)} &ndash;{' '}
                  {formatTime(selectedSlot.end_time)}
                </span>
              </div>
              {selectedService.price != null && (
                <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                  <span className="font-medium text-gray-900">Total</span>
                  <span
                    className="font-semibold"
                    style={{ color: accentColor }}
                  >
                    ${selectedService.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setStep('service')
                setSelectedService(null)
                setSelectedSlot(null)
              }}
              className="mt-8 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              Book Another Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
