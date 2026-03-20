'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Clock, MapPin, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getClassDetail, updateAttendance } from './actions'

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
    month: 'short',
    year: 'numeric',
  })
}

interface EnrollmentItem {
  id: string
  dependentId: string
  dependentName: string
  status: string
  checkedInAt: string | null
}

interface ClassData {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  serviceName: string
  serviceColor: string
  roomName: string | null
  enrollments: EnrollmentItem[]
}

export function ClassDetailClient({ classInstanceId }: { classInstanceId: string }) {
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const res = await getClassDetail(classInstanceId)
      if (res.error) {
        setError(res.error)
      } else {
        setClassData(res.data)
      }
    })
  }, [classInstanceId])

  async function handleAttendance(enrollmentId: string, status: 'attended' | 'no_show') {
    setUpdatingId(enrollmentId)
    const res = await updateAttendance(enrollmentId, status)
    if (res.error) {
      toast.error(res.error)
    } else {
      // Update local state
      setClassData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          enrollments: prev.enrollments.map((e) =>
            e.id === enrollmentId
              ? { ...e, status, checkedInAt: status === 'attended' ? new Date().toISOString() : null }
              : e
          ),
        }
      })
      toast.success(status === 'attended' ? 'Marked as attended' : 'Marked as absent')
    }
    setUpdatingId(null)
  }

  if (isPending && !classData) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/tutor/schedule" className="inline-flex items-center gap-1 text-sm text-indigo-600">
          <ArrowLeft className="size-4" /> Back to schedule
        </Link>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!classData) return null

  const attendedCount = classData.enrollments.filter((e) => e.status === 'attended').length

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link href="/tutor/schedule" className="inline-flex items-center gap-1 text-sm text-indigo-600">
        <ArrowLeft className="size-4" /> Back to schedule
      </Link>

      {/* Class header */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 h-14 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: classData.serviceColor }}
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{classData.serviceName}</h1>
            <p className="mt-1 text-sm text-gray-500">{formatDate(classData.date)}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatTime(classData.startTime)} - {formatTime(classData.endTime)}
              </span>
              {classData.roomName && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {classData.roomName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="size-3.5" />
                {attendedCount}/{classData.enrollments.length} attended
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Student list */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Students ({classData.enrollments.length})
          </h2>
        </div>
        {classData.enrollments.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No students enrolled
          </p>
        ) : (
          <ul className="divide-y">
            {classData.enrollments.map((enrollment) => (
              <li key={enrollment.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">{enrollment.dependentName}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {enrollment.status === 'attended'
                      ? 'Present'
                      : enrollment.status === 'no_show'
                        ? 'Absent'
                        : enrollment.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={enrollment.status === 'attended' ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={updatingId === enrollment.id}
                    onClick={() => handleAttendance(enrollment.id, 'attended')}
                    title="Mark as present"
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant={enrollment.status === 'no_show' ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={updatingId === enrollment.id}
                    onClick={() => handleAttendance(enrollment.id, 'no_show')}
                    title="Mark as absent"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
