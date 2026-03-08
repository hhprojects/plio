'use client'

import { useState, useTransition } from 'react'
import { getAvailableSlots } from '@/app/(public)/book/[slug]/actions'

interface SlotPickerProps {
  tenantId: string
  serviceId: string
  accentColor: string
  onSelect: (slot: {
    team_member_id: string
    team_member_name: string
    start_time: string
    end_time: string
    date: string
  }) => void
  onBack: () => void
}

interface SlotItem {
  team_member_id: string
  team_member_name: string
  start_time: string
  end_time: string
}

function formatTime(time: string) {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function getTodayString() {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

function getMaxDateString() {
  const now = new Date()
  now.setDate(now.getDate() + 30)
  return now.toISOString().split('T')[0]
}

export function SlotPicker({
  tenantId,
  serviceId,
  accentColor,
  onSelect,
  onBack,
}: SlotPickerProps) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<SlotItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)

  function handleDateChange(newDate: string) {
    setDate(newDate)
    if (!newDate) {
      setSlots([])
      setHasSearched(false)
      return
    }

    startTransition(async () => {
      const result = await getAvailableSlots(tenantId, serviceId, newDate)
      setSlots(result.slots)
      setHasSearched(true)
    })
  }

  // Group slots by team member
  const grouped = slots.reduce<Record<string, SlotItem[]>>((acc, slot) => {
    if (!acc[slot.team_member_name]) acc[slot.team_member_name] = []
    acc[slot.team_member_name].push(slot)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
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
          Pick a Date &amp; Time
        </h2>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="booking-date"
          className="block text-sm font-medium text-gray-700"
        >
          Date
        </label>
        <input
          id="booking-date"
          type="date"
          min={getTodayString()}
          max={getMaxDateString()}
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-8">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
          />
          <span className="ml-2 text-sm text-gray-500">
            Loading available times...
          </span>
        </div>
      )}

      {!isPending && hasSearched && slots.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No available slots for this date. Please try another date.
        </div>
      )}

      {!isPending && slots.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([memberName, memberSlots]) => (
            <div key={memberName} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                {memberName}
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {memberSlots.map((slot) => (
                  <button
                    key={`${slot.team_member_id}-${slot.start_time}`}
                    type="button"
                    onClick={() =>
                      onSelect({
                        team_member_id: slot.team_member_id,
                        team_member_name: slot.team_member_name,
                        start_time: slot.start_time,
                        end_time: slot.end_time,
                        date,
                      })
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    {formatTime(slot.start_time)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
