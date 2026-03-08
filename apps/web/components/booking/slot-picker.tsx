'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// TODO: reconnect when public booking page is rebuilt
// import { getPublicSlots } from '@/app/(public)/book/[slug]/actions'
type GetPublicSlotsResult = { data: TimeSlot[] }
const getPublicSlots = async (
  _tenantId: string,
  _serviceId: string,
  _practitionerId: string,
  _date: string
): Promise<GetPublicSlotsResult> => ({ data: [] })

interface TimeSlot {
  start: string
  end: string
}

interface SlotPickerProps {
  tenantId: string
  serviceId: string
  practitionerId: string | null
  practitioners: { id: string; full_name: string }[]
  onSelect: (date: string, slot: TimeSlot, resolvedPractitionerId: string) => void
  onBack: () => void
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
  now.setDate(now.getDate() + 14)
  return now.toISOString().split('T')[0]
}

export function SlotPicker({
  tenantId,
  serviceId,
  practitionerId,
  practitioners,
  onSelect,
  onBack,
}: SlotPickerProps) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [resolvedPractitionerId, setResolvedPractitionerId] = useState<string | null>(practitionerId)
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
      if (practitionerId) {
        // Specific practitioner selected
        const result = await getPublicSlots(tenantId, serviceId, practitionerId, newDate)
        setSlots(result.data)
        setResolvedPractitionerId(practitionerId)
      } else {
        // "Any available" — find first practitioner with availability
        for (const p of practitioners) {
          const result = await getPublicSlots(tenantId, serviceId, p.id, newDate)
          if (result.data.length > 0) {
            setSlots(result.data)
            setResolvedPractitionerId(p.id)
            setHasSearched(true)
            return
          }
        }
        // No practitioner had availability
        setSlots([])
        setResolvedPractitionerId(null)
      }
      setHasSearched(true)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <h2 className="text-lg font-semibold">Pick a Date & Time</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="booking-date">Date</Label>
        <Input
          id="booking-date"
          type="date"
          min={getTodayString()}
          max={getMaxDateString()}
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="ml-2 text-sm text-muted-foreground">Loading available times...</span>
        </div>
      )}

      {!isPending && hasSearched && slots.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No available slots for this date. Please try another date.
        </div>
      )}

      {!isPending && slots.length > 0 && (
        <div className="space-y-2">
          <Label>Available Times</Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <Button
                key={slot.start}
                variant="outline"
                className="hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600"
                onClick={() => {
                  if (resolvedPractitionerId) {
                    onSelect(date, slot, resolvedPractitionerId)
                  }
                }}
              >
                {formatTime(slot.start)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
