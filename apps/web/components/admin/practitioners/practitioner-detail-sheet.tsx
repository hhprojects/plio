'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Calendar,
  CalendarOff,
  Clock,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'

import { formatDate, formatTime } from '@plio/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'

import {
  getPractitionerAvailability,
  getAvailabilityOverrides,
  getUpcomingAppointments,
  upsertAvailability,
  createOverride,
  deleteOverride,
  type PractitionerWithCounts,
  type PractitionerAvailabilityRow,
  type AvailabilityOverrideRow,
  type UpcomingAppointment,
} from '@/app/(dashboard)/admin/practitioners/actions'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let h = 7; h <= 22; h++) {
    options.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 22) {
      options.push(`${String(h).padStart(2, '0')}:30`)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PractitionerDetailSheetProps {
  practitioner: PractitionerWithCounts | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DayAvailability {
  available: boolean
  startTime: string
  endTime: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PractitionerDetailSheet({
  practitioner,
  open,
  onOpenChange,
}: PractitionerDetailSheetProps) {
  const [availability, setAvailability] = useState<PractitionerAvailabilityRow[]>([])
  const [overrides, setOverrides] = useState<AvailabilityOverrideRow[]>([])
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([])
  const [isPending, startTransition] = useTransition()

  // Availability editing state
  const [editingAvailability, setEditingAvailability] = useState(false)
  const [dayEdits, setDayEdits] = useState<DayAvailability[]>(
    Array.from({ length: 7 }, () => ({ available: false, startTime: '09:00', endTime: '17:00' }))
  )

  // Override form state
  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideAvailable, setOverrideAvailable] = useState(false)
  const [overrideStartTime, setOverrideStartTime] = useState('')
  const [overrideEndTime, setOverrideEndTime] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  const [isSaving, startSavingTransition] = useTransition()

  // Load data when sheet opens
  useEffect(() => {
    if (open && practitioner) {
      setAvailability([])
      setOverrides([])
      setAppointments([])
      setEditingAvailability(false)
      setShowOverrideForm(false)

      startTransition(async () => {
        const [availResult, overridesResult, appointmentsResult] = await Promise.all([
          getPractitionerAvailability(practitioner.id),
          getAvailabilityOverrides(practitioner.id),
          getUpcomingAppointments(practitioner.id),
        ])

        if (availResult.data) setAvailability(availResult.data)
        if (overridesResult.data) setOverrides(overridesResult.data)
        if (appointmentsResult.data) setAppointments(appointmentsResult.data)
      })
    }
  }, [open, practitioner])

  // Initialize day edits from current availability
  const startEditing = () => {
    const days: DayAvailability[] = Array.from({ length: 7 }, () => ({
      available: false,
      startTime: '09:00',
      endTime: '17:00',
    }))
    for (const row of availability) {
      days[row.dayOfWeek] = {
        available: true,
        startTime: row.startTime.slice(0, 5),
        endTime: row.endTime.slice(0, 5),
      }
    }
    setDayEdits(days)
    setEditingAvailability(true)
  }

  const handleSaveAvailability = () => {
    if (!practitioner) return

    const entries = dayEdits
      .map((day, index) =>
        day.available
          ? { day_of_week: index, start_time: day.startTime, end_time: day.endTime }
          : null
      )
      .filter(Boolean)

    const fd = new FormData()
    fd.set('practitioner_id', practitioner.id)
    fd.set('entries', JSON.stringify(entries))

    startSavingTransition(async () => {
      const result = await upsertAvailability(fd)
      if (!result.error) {
        setEditingAvailability(false)
        // Refresh availability
        const refreshed = await getPractitionerAvailability(practitioner.id)
        if (refreshed.data) setAvailability(refreshed.data)
      }
    })
  }

  const handleCreateOverride = () => {
    if (!practitioner || !overrideDate) return

    const fd = new FormData()
    fd.set('practitioner_id', practitioner.id)
    fd.set('date', overrideDate)
    fd.set('is_available', String(overrideAvailable))
    if (overrideStartTime) fd.set('start_time', overrideStartTime)
    if (overrideEndTime) fd.set('end_time', overrideEndTime)
    if (overrideReason) fd.set('reason', overrideReason)

    startSavingTransition(async () => {
      const result = await createOverride(fd)
      if (!result.error) {
        setShowOverrideForm(false)
        setOverrideDate('')
        setOverrideAvailable(false)
        setOverrideStartTime('')
        setOverrideEndTime('')
        setOverrideReason('')
        // Refresh overrides
        const refreshed = await getAvailabilityOverrides(practitioner.id)
        if (refreshed.data) setOverrides(refreshed.data)
      }
    })
  }

  const handleDeleteOverride = (overrideId: string) => {
    if (!practitioner) return

    startSavingTransition(async () => {
      const result = await deleteOverride(overrideId)
      if (!result.error) {
        const refreshed = await getAvailabilityOverrides(practitioner.id)
        if (refreshed.data) setOverrides(refreshed.data)
      }
    })
  }

  // Build a map of day_of_week -> availability for display
  const availabilityByDay = new Map<number, PractitionerAvailabilityRow>()
  for (const row of availability) {
    availabilityByDay.set(row.dayOfWeek, row)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <div>
            <SheetTitle>{practitioner?.fullName ?? 'Practitioner Details'}</SheetTitle>
            <SheetDescription>
              View practitioner info and manage availability.
            </SheetDescription>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] px-6 pb-6">
          {!practitioner ? null : (
            <div className="space-y-6 pt-4">
              {/* Info section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground">{practitioner.email}</span>
                </div>
                {practitioner.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground">{practitioner.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={
                      practitioner.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {practitioner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Weekly Availability section */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Weekly Availability
                    </CardTitle>
                    {!editingAvailability && (
                      <Button variant="ghost" size="sm" onClick={startEditing}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isPending ? (
                    <div className="space-y-2">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : editingAvailability ? (
                    <div className="space-y-3">
                      {dayEdits.map((day, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 rounded-md border px-3 py-2"
                        >
                          <div className="flex w-16 items-center gap-2">
                            <Switch
                              checked={day.available}
                              onCheckedChange={(checked) => {
                                const updated = [...dayEdits]
                                updated[index] = { ...updated[index]!, available: checked }
                                setDayEdits(updated)
                              }}
                            />
                          </div>
                          <span className="w-12 text-sm font-medium">
                            {DAY_NAMES_SHORT[index]}
                          </span>
                          {day.available ? (
                            <div className="flex items-center gap-1">
                              <Select
                                value={day.startTime}
                                onValueChange={(val) => {
                                  const updated = [...dayEdits]
                                  updated[index] = { ...updated[index]!, startTime: val }
                                  setDayEdits(updated)
                                }}
                              >
                                <SelectTrigger className="h-8 w-24 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="text-muted-foreground text-xs">to</span>
                              <Select
                                value={day.endTime}
                                onValueChange={(val) => {
                                  const updated = [...dayEdits]
                                  updated[index] = { ...updated[index]!, endTime: val }
                                  setDayEdits(updated)
                                }}
                              >
                                <SelectTrigger className="h-8 w-24 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Off</span>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAvailability(false)}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveAvailability}
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {DAY_NAMES.map((name, index) => {
                        const row = availabilityByDay.get(index)
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm"
                          >
                            <span className="font-medium">{name}</span>
                            {row ? (
                              <span className="text-muted-foreground">
                                {formatTime(row.startTime)} &ndash; {formatTime(row.endTime)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Off</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overrides section */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <CalendarOff className="h-4 w-4" />
                      Availability Overrides
                    </CardTitle>
                    {!showOverrideForm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOverrideForm(true)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isPending ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {overrides.length === 0 && !showOverrideForm && (
                        <p className="text-muted-foreground text-xs">
                          No overrides set.
                        </p>
                      )}
                      {overrides.map((ov) => (
                        <div
                          key={ov.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {formatDate(ov.date, 'DD MMM YYYY')}
                              </span>
                              <Badge
                                variant="secondary"
                                className={
                                  ov.isAvailable
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {ov.isAvailable ? 'Available' : 'Blocked'}
                              </Badge>
                            </div>
                            {(ov.startTime || ov.endTime) && (
                              <p className="text-muted-foreground text-xs">
                                {formatTime(ov.startTime!)} &ndash; {formatTime(ov.endTime!)}
                              </p>
                            )}
                            {ov.reason && (
                              <p className="text-muted-foreground text-xs">{ov.reason}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteOverride(ov.id)}
                            disabled={isSaving}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete override</span>
                          </Button>
                        </div>
                      ))}

                      {/* Add override form */}
                      {showOverrideForm && (
                        <div className="space-y-3 rounded-md border p-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Date</Label>
                            <Input
                              type="date"
                              value={overrideDate}
                              onChange={(e) => setOverrideDate(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={overrideAvailable}
                              onCheckedChange={setOverrideAvailable}
                            />
                            <Label className="text-xs">
                              {overrideAvailable ? 'Available' : 'Blocked'}
                            </Label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Start Time</Label>
                              <Select
                                value={overrideStartTime}
                                onValueChange={setOverrideStartTime}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">End Time</Label>
                              <Select
                                value={overrideEndTime}
                                onValueChange={setOverrideEndTime}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                      {t}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Reason (optional)</Label>
                            <Input
                              value={overrideReason}
                              onChange={(e) => setOverrideReason(e.target.value)}
                              placeholder="e.g. Public holiday, MC"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowOverrideForm(false)
                                setOverrideDate('')
                                setOverrideAvailable(false)
                                setOverrideStartTime('')
                                setOverrideEndTime('')
                                setOverrideReason('')
                              }}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCreateOverride}
                              disabled={isSaving || !overrideDate}
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isPending ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : appointments.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No upcoming appointments.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {appointments.map((appt) => (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{appt.serviceTitle}</p>
                            <p className="text-muted-foreground text-xs">
                              {appt.clientName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              {formatDate(appt.date, 'DD MMM')}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatTime(appt.startTime)} &ndash; {formatTime(appt.endTime)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
