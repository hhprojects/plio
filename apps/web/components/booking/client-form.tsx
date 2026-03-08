'use client'

import { useState, useTransition } from 'react'
import { createBooking } from '@/app/(public)/book/[slug]/actions'

interface ClientFormProps {
  tenantId: string
  service: {
    id: string
    name: string
    duration_minutes: number | null
    price: number | null
  }
  slot: {
    team_member_id: string
    team_member_name: string
    start_time: string
    end_time: string
    date: string
  }
  accentColor: string
  onConfirmed: () => void
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
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ClientForm({
  tenantId,
  service,
  slot,
  accentColor,
  onConfirmed,
  onBack,
}: ClientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await createBooking(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        onConfirmed()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          <svg
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          Confirm Your Booking
        </h2>
      </div>

      {/* Booking summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Appointment Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-gray-900">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Practitioner</span>
            <span className="font-medium text-gray-900">
              {slot.team_member_name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">
              {formatDate(slot.date)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-gray-900">
              {formatTime(slot.start_time)} &ndash; {formatTime(slot.end_time)}
            </span>
          </div>
          {service.duration_minutes != null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium text-gray-900">
                {service.duration_minutes} min
              </span>
            </div>
          )}
          {service.price != null && (
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span className="font-medium text-gray-900">Total</span>
              <span className="font-semibold" style={{ color: accentColor }}>
                ${service.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Client details form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden fields */}
        <input type="hidden" name="tenant_id" value={tenantId} />
        <input type="hidden" name="service_id" value={service.id} />
        <input type="hidden" name="team_member_id" value={slot.team_member_id} />
        <input type="hidden" name="date" value={slot.date} />
        <input type="hidden" name="start_time" value={slot.start_time} />
        <input type="hidden" name="end_time" value={slot.end_time} />

        <div className="space-y-1.5">
          <label
            htmlFor="client_name"
            className="block text-sm font-medium text-gray-700"
          >
            Name *
          </label>
          <input
            id="client_name"
            name="client_name"
            required
            placeholder="Your full name"
            disabled={isPending}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="client_email"
            className="block text-sm font-medium text-gray-700"
          >
            Email *
          </label>
          <input
            id="client_email"
            name="client_email"
            type="email"
            required
            placeholder="your@email.com"
            disabled={isPending}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="client_phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone *
          </label>
          <input
            id="client_phone"
            name="client_phone"
            type="tel"
            required
            placeholder="e.g. 9123 4567"
            disabled={isPending}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Confirming...
            </span>
          ) : (
            'Book Now'
          )}
        </button>
      </form>
    </div>
  )
}
