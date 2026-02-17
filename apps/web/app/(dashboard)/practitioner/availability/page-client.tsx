'use client'

import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getMyAvailability, saveMyAvailability, addMyOverride, removeMyOverride } from './actions'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// Display order: Mon=1, Tue=2, ..., Sun=0
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

function generateTimeOptions() {
  const options: string[] = []
  for (let h = 8; h <= 20; h++) {
    options.push(`${h.toString().padStart(2, '0')}:00`)
    if (h < 20) options.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

function formatTime(time: string) {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatOverrideDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface DaySlot {
  enabled: boolean
  startTime: string
  endTime: string
}

interface OverrideItem {
  id: string
  date: string
  isAvailable: boolean
  startTime: string | null
  endTime: string | null
  reason: string | null
}

export function AvailabilityPageClient() {
  const [slots, setSlots] = useState<Record<number, DaySlot>>(() => {
    const initial: Record<number, DaySlot> = {}
    for (let i = 0; i < 7; i++) {
      initial[i] = { enabled: false, startTime: '09:00', endTime: '18:00' }
    }
    return initial
  })
  const [overrides, setOverrides] = useState<OverrideItem[]>([])
  const [isPending, startTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()

  // Override form state
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideAvailable, setOverrideAvailable] = useState(false)
  const [overrideStart, setOverrideStart] = useState('')
  const [overrideEnd, setOverrideEnd] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [isAddingOverride, startOverrideTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const res = await getMyAvailability()
      if (res.error) {
        toast.error(res.error)
        return
      }

      // Build slots from availability data
      const newSlots: Record<number, DaySlot> = {}
      for (let i = 0; i < 7; i++) {
        newSlots[i] = { enabled: false, startTime: '09:00', endTime: '18:00' }
      }
      for (const a of res.availability) {
        newSlots[a.dayOfWeek] = {
          enabled: true,
          startTime: a.startTime.slice(0, 5),
          endTime: a.endTime.slice(0, 5),
        }
      }
      setSlots(newSlots)
      setOverrides(res.overrides)
    })
  }, [])

  function handleSave() {
    startSaveTransition(async () => {
      const entries = DAY_ORDER
        .filter((d) => slots[d].enabled)
        .map((d) => ({
          day_of_week: d,
          start_time: slots[d].startTime,
          end_time: slots[d].endTime,
        }))

      const formData = new FormData()
      formData.set('entries', JSON.stringify(entries))

      const res = await saveMyAvailability(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Availability saved')
      }
    })
  }

  function handleAddOverride() {
    if (!overrideDate) {
      toast.error('Date is required')
      return
    }

    startOverrideTransition(async () => {
      const formData = new FormData()
      formData.set('date', overrideDate)
      formData.set('isAvailable', overrideAvailable.toString())
      if (overrideStart) formData.set('startTime', overrideStart)
      if (overrideEnd) formData.set('endTime', overrideEnd)
      if (overrideReason) formData.set('reason', overrideReason)

      const res = await addMyOverride(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        // Refresh
        const refreshed = await getMyAvailability()
        if (!refreshed.error) setOverrides(refreshed.overrides)
        setOverrideDate('')
        setOverrideAvailable(false)
        setOverrideStart('')
        setOverrideEnd('')
        setOverrideReason('')
        toast.success('Override added')
      }
    })
  }

  function handleRemoveOverride(id: string) {
    startOverrideTransition(async () => {
      const res = await removeMyOverride(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        setOverrides((prev) => prev.filter((o) => o.id !== id))
        toast.success('Override removed')
      }
    })
  }

  if (isPending) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">My Availability</h1>

      {/* Weekly availability grid */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Weekly Schedule</h2>
        </div>
        <div className="divide-y">
          {DAY_ORDER.map((day) => {
            const slot = slots[day]
            return (
              <div key={day} className="flex items-center gap-3 px-4 py-3">
                <label className="flex items-center gap-2 min-w-[100px]">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(e) =>
                      setSlots((prev) => ({
                        ...prev,
                        [day]: { ...prev[day], enabled: e.target.checked },
                      }))
                    }
                    className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{DAY_LABELS[day]}</span>
                </label>
                {slot.enabled ? (
                  <div className="flex items-center gap-2 text-sm">
                    <select
                      value={slot.startTime}
                      onChange={(e) =>
                        setSlots((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], startTime: e.target.value },
                        }))
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{formatTime(t)}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">to</span>
                    <select
                      value={slot.endTime}
                      onChange={(e) =>
                        setSlots((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], endTime: e.target.value },
                        }))
                      }
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {TIME_OPTIONS.filter((t) => t > slot.startTime).map((t) => (
                        <option key={t} value={t}>{formatTime(t)}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Day off</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="border-t px-4 py-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </div>

      {/* Date overrides */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">Date Overrides</h2>
          <p className="text-xs text-gray-500 mt-0.5">Block or add extra availability for specific dates</p>
        </div>

        {/* Existing overrides */}
        {overrides.length > 0 && (
          <ul className="divide-y">
            {overrides.map((o) => (
              <li key={o.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatOverrideDate(o.date)}
                    </span>
                    <Badge variant={o.isAvailable ? 'default' : 'destructive'} className="text-xs">
                      {o.isAvailable ? 'Available' : 'Blocked'}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {o.startTime && o.endTime ? (
                      <span>{formatTime(o.startTime.slice(0, 5))} - {formatTime(o.endTime.slice(0, 5))}</span>
                    ) : (
                      <span>Full day</span>
                    )}
                    {o.reason && <span> &middot; {o.reason}</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-gray-400 hover:text-red-600"
                  onClick={() => handleRemoveOverride(o.id)}
                  disabled={isAddingOverride}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Add override form */}
        <div className="border-t px-4 py-3 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Add Override</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overrideAvailable}
                onChange={(e) => setOverrideAvailable(e.target.checked)}
                className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{overrideAvailable ? 'Available (extra hours)' : 'Blocked (day off)'}</span>
            </label>
            {overrideAvailable && (
              <>
                <select
                  value={overrideStart}
                  onChange={(e) => setOverrideStart(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Start time</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
                <select
                  value={overrideEnd}
                  onChange={(e) => setOverrideEnd(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="">End time</option>
                  {TIME_OPTIONS.filter((t) => !overrideStart || t > overrideStart).map((t) => (
                    <option key={t} value={t}>{formatTime(t)}</option>
                  ))}
                </select>
              </>
            )}
            <div className="col-span-2">
              <Input
                placeholder="Reason (optional)"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAddOverride}
            disabled={isAddingOverride || !overrideDate}
          >
            <Plus className="size-4" />
            {isAddingOverride ? 'Adding...' : 'Add Override'}
          </Button>
        </div>
      </div>
    </div>
  )
}
