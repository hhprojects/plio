'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTutorClasses } from './actions'

function formatDate(date: Date) {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date) {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (formatDate(date) === formatDate(today)) return 'Today'
  if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow'

  return date.toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatTime(time: string) {
  const [h, m] = time.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

interface ClassCard {
  id: string
  date: string
  startTime: string
  endTime: string
  courseTitle: string
  courseColor: string
  roomName: string | null
  enrolledCount: number
  maxCapacity: number
}

export function SchedulePageClient() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [classes, setClasses] = useState<ClassCard[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const res = await getTutorClasses(formatDate(selectedDate))
      setClasses(res.data ?? [])
    })
  }, [selectedDate])

  function prevDay() {
    setSelectedDate((d) => {
      const prev = new Date(d)
      prev.setDate(prev.getDate() - 1)
      return prev
    })
  }

  function nextDay() {
    setSelectedDate((d) => {
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevDay}>
          <ChevronLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">{formatDisplayDate(selectedDate)}</h1>
        <Button variant="ghost" size="icon" onClick={nextDay}>
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* Class cards */}
      {isPending ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No classes scheduled</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try navigating to another day
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/tutor/classes/${cls.id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md active:shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* Color bar */}
                <div
                  className="mt-0.5 h-12 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: cls.courseColor }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {cls.courseTitle}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </span>
                    {cls.roomName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {cls.roomName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {cls.enrolledCount}/{cls.maxCapacity}
                    </span>
                  </div>
                </div>
                <ChevronRight className="mt-2 size-4 shrink-0 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
