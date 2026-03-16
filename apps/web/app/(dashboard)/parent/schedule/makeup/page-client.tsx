'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAvailableMakeupSlots, bookMakeupClass } from '../actions'

interface Slot {
  classInstanceId: string
  date: string
  startTime: string
  endTime: string
  courseTitle: string
  courseColor: string
  tutorName: string
  roomName: string | null
  availableSpots: number
  maxCapacity: number
}

export function MakeupPageClient({
  students,
  initialSlots,
}: {
  students: Array<{ id: string; fullName: string }>
  initialSlots: Array<Record<string, unknown>>
}) {
  const router = useRouter()
  const [selectedStudentId, setSelectedStudentId] = useState(
    students[0]?.id ?? ''
  )
  const [slots, setSlots] = useState<Slot[]>(initialSlots as unknown as Slot[])
  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleStudentChange(id: string) {
    setSelectedStudentId(id)
    startTransition(async () => {
      const result = await getAvailableMakeupSlots(id)
      setSlots((result.data ?? []) as unknown as Slot[])
    })
  }

  function handleBook() {
    if (!confirmSlot || !selectedStudentId) return
    startTransition(async () => {
      const result = await bookMakeupClass(
        selectedStudentId,
        confirmSlot.classInstanceId
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Makeup class booked!')
        router.push('/parent/schedule')
      }
      setConfirmSlot(null)
    })
  }

  return (
    <div className="space-y-4">
      <Link
        href="/parent/schedule"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schedule
      </Link>

      <h2 className="text-xl font-semibold">Book Makeup Class</h2>

      {/* Step 1: Select Student */}
      {students.length > 1 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Select Student
          </label>
          <Select value={selectedStudentId} onValueChange={handleStudentChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {students.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Step 2: Available Slots */}
      {slots.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-gray-500">No available makeup slots right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {slots.length} available slot{slots.length !== 1 ? 's' : ''}
          </p>
          {slots.map((slot) => (
            <div
              key={slot.classInstanceId}
              className="flex items-center justify-between rounded-lg border bg-white p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: slot.courseColor }}
                  />
                  <span className="font-medium">{slot.courseTitle}</span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  <p>
                    {new Date(slot.date).toLocaleDateString('en-SG', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {' '}{slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                  </p>
                  <p>Tutor: {slot.tutorName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {slot.availableSpots} spot{slot.availableSpots !== 1 ? 's' : ''}
                </Badge>
                <Button size="sm" onClick={() => setConfirmSlot(slot)}>
                  Book
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmSlot} onOpenChange={() => setConfirmSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Makeup Booking</DialogTitle>
            <DialogDescription>
              Book {confirmSlot?.courseTitle} on{' '}
              {confirmSlot?.date
                ? new Date(confirmSlot.date).toLocaleDateString('en-SG', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : ''}
              ?
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-500">1 credit will be deducted.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSlot(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleBook} disabled={isPending}>
              {isPending ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
