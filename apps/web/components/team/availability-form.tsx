'use client'

import { useState, useTransition } from 'react'
import type { TeamAvailability } from '@plio/db'

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
]

interface DaySlot {
  enabled: boolean
  start_time: string
  end_time: string
}

interface AvailabilityFormProps {
  availability: TeamAvailability[]
  onSave: (
    slots: { day_of_week: number; start_time: string; end_time: string }[]
  ) => Promise<{ error?: string; success?: boolean }>
  onCancel: () => void
}

function buildInitialState(availability: TeamAvailability[]): Record<number, DaySlot> {
  const state: Record<number, DaySlot> = {}
  for (const day of DAYS) {
    const existing = availability.find((a) => a.day_of_week === day.value)
    state[day.value] = existing
      ? { enabled: true, start_time: existing.start_time, end_time: existing.end_time }
      : { enabled: false, start_time: '09:00', end_time: '17:00' }
  }
  return state
}

export function AvailabilityForm({ availability, onSave, onCancel }: AvailabilityFormProps) {
  const [days, setDays] = useState(() => buildInitialState(availability))
  const [isPending, startTransition] = useTransition()

  function toggleDay(dayValue: number) {
    setDays((prev) => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], enabled: !prev[dayValue].enabled },
    }))
  }

  function updateTime(dayValue: number, field: 'start_time' | 'end_time', value: string) {
    setDays((prev) => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], [field]: value },
    }))
  }

  function handleSave() {
    const slots = DAYS.filter((d) => days[d.value].enabled).map((d) => ({
      day_of_week: d.value,
      start_time: days[d.value].start_time,
      end_time: days[d.value].end_time,
    }))

    startTransition(async () => {
      const result = await onSave(slots)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      {DAYS.map((day) => (
        <div key={day.value} className="flex items-center gap-3">
          <label className="flex items-center gap-2 w-28 cursor-pointer">
            <input
              type="checkbox"
              checked={days[day.value].enabled}
              onChange={() => toggleDay(day.value)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">{day.label}</span>
          </label>
          {days[day.value].enabled ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={days[day.value].start_time}
                onChange={(e) => updateTime(day.value, 'start_time', e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={days[day.value].end_time}
                onChange={(e) => updateTime(day.value, 'end_time', e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <span className="text-sm text-gray-400">Unavailable</span>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  )
}
