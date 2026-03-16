'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateCheckInToken } from './actions'

interface EnrollmentForCheckIn {
  enrollmentId: string
  studentId: string
  studentName: string
  classInstanceId: string
  date: string
  startTime: string
  endTime: string
  courseTitle: string
  courseColor: string
  checkedIn: boolean
}

export function CheckInPageClient({
  enrollments,
  error,
}: {
  enrollments: EnrollmentForCheckIn[]
  error?: string | null
}) {
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<EnrollmentForCheckIn | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refreshToken = useCallback(() => {
    if (!selectedEnrollment) return
    startTransition(async () => {
      const result = await generateCheckInToken(selectedEnrollment.enrollmentId)
      if (result.token) setToken(result.token)
    })
  }, [selectedEnrollment])

  function handleSelect(enrollment: EnrollmentForCheckIn) {
    setSelectedEnrollment(enrollment)
    setToken(null)
    startTransition(async () => {
      const result = await generateCheckInToken(enrollment.enrollmentId)
      if (result.token) setToken(result.token)
    })
  }

  // Auto-refresh token every 4 minutes
  useEffect(() => {
    if (!selectedEnrollment) return
    const interval = setInterval(refreshToken, 4 * 60 * 1000)
    return () => clearInterval(interval)
  }, [selectedEnrollment, refreshToken])

  const available = enrollments.filter((e) => !e.checkedIn)
  const checkedIn = enrollments.filter((e) => e.checkedIn)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Check In</h2>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {available.length === 0 && checkedIn.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center">
          <QrCode className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">No classes scheduled for today.</p>
        </div>
      )}

      {/* QR Display */}
      {selectedEnrollment && token && (
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Show this to your tutor or scan at the front desk
          </p>
          <div className="mt-4 inline-block rounded-lg bg-white p-4">
            <QRCodeSVG value={token} size={200} />
          </div>
          <div className="mt-4">
            <p className="font-semibold">{selectedEnrollment.studentName}</p>
            <p className="text-sm text-gray-500">
              {selectedEnrollment.courseTitle} &middot;{' '}
              {selectedEnrollment.startTime.slice(0, 5)} -{' '}
              {selectedEnrollment.endTime.slice(0, 5)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={refreshToken}
            disabled={isPending}
          >
            Refresh QR
          </Button>
        </div>
      )}

      {/* Available classes */}
      {available.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">
            Today&apos;s Classes
          </h3>
          <div className="space-y-2">
            {available.map((enrollment) => (
              <button
                key={enrollment.enrollmentId}
                onClick={() => handleSelect(enrollment)}
                className={`w-full rounded-lg border bg-white p-4 text-left transition hover:border-indigo-300 ${
                  selectedEnrollment?.enrollmentId === enrollment.enrollmentId
                    ? 'border-indigo-500 ring-1 ring-indigo-500'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: enrollment.courseColor }}
                  />
                  <span className="font-medium">{enrollment.courseTitle}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {enrollment.studentName} &middot;{' '}
                  {enrollment.startTime.slice(0, 5)} -{' '}
                  {enrollment.endTime.slice(0, 5)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Already checked in */}
      {checkedIn.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-500">
            Checked In
          </h3>
          <div className="space-y-2">
            {checkedIn.map((enrollment) => (
              <div
                key={enrollment.enrollmentId}
                className="flex items-center gap-3 rounded-lg border bg-green-50 p-4"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{enrollment.courseTitle}</p>
                  <p className="text-sm text-gray-500">
                    {enrollment.studentName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
