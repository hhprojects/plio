'use client'

import { useState, useTransition } from 'react'
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  Loader2,
  Users,
} from 'lucide-react'
import {
  addEnrollment,
  removeEnrollment,
  bulkCheckIn,
  updateEnrollmentStatus,
} from '@/app/(dashboard)/calendar/actions'

interface EnrollmentData {
  id: string
  status: string
  checked_in_at: string | null
  contact: { id: string; name: string } | null
  dependent: { id: string; name: string } | null
}

interface ContactWithDependents {
  id: string
  name: string
  dependents?: { id: string; name: string }[]
}

interface EnrollmentFormProps {
  sessionId: string
  enrollments: EnrollmentData[]
  contacts: ContactWithDependents[]
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
  attended: { label: 'Attended', className: 'bg-green-100 text-green-700' },
  no_show: { label: 'No Show', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
}

export function EnrollmentForm({ sessionId, enrollments, contacts }: EnrollmentFormProps) {
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedDependentId, setSelectedDependentId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedContact = contacts.find((c) => c.id === selectedContactId)
  const dependents = selectedContact?.dependents ?? []
  const activeEnrollments = enrollments.filter((e) => e.status !== 'cancelled')
  const confirmedCount = enrollments.filter((e) => e.status === 'confirmed').length

  function handleAction(actionId: string, action: () => Promise<{ error?: string }>) {
    setError(null)
    setPendingAction(actionId)
    startTransition(async () => {
      const result = await action()
      if (result?.error) setError(result.error)
      setPendingAction(null)
    })
  }

  function handleAdd() {
    if (!selectedContactId) return
    setError(null)
    setPendingAction('add')
    startTransition(async () => {
      const result = await addEnrollment(
        sessionId,
        selectedContactId,
        selectedDependentId || undefined
      )
      if (result?.error) {
        setError(result.error)
      } else {
        setSelectedContactId('')
        setSelectedDependentId('')
      }
      setPendingAction(null)
    })
  }

  function handleBulkCheckIn() {
    handleAction('bulk', () => bulkCheckIn(sessionId))
  }

  return (
    <div className="border-t border-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-900">
            Enrollments ({activeEnrollments.length})
          </h4>
        </div>
        {confirmedCount > 0 && (
          <button
            onClick={handleBulkCheckIn}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50"
          >
            {pendingAction === 'bulk' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            Bulk Check-in
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Enrollment list */}
      {enrollments.length === 0 ? (
        <p className="text-xs text-gray-400 italic mb-3">No enrollments yet.</p>
      ) : (
        <div className="space-y-2 mb-3">
          {enrollments.map((enrollment) => {
            const badge = STATUS_BADGE[enrollment.status] ?? STATUS_BADGE.confirmed
            const isActive = enrollment.status === 'confirmed'
            return (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {enrollment.contact?.name ?? 'Unknown'}
                    {enrollment.dependent && (
                      <span className="text-gray-500 font-normal">
                        {' '}
                        &rarr; {enrollment.dependent.name}
                      </span>
                    )}
                  </p>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Action buttons */}
                {isActive && (
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={() =>
                        handleAction(`attend-${enrollment.id}`, () =>
                          updateEnrollmentStatus(enrollment.id, 'attended')
                        )
                      }
                      disabled={isPending}
                      title="Mark Attended"
                      className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50"
                    >
                      {pendingAction === `attend-${enrollment.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleAction(`noshow-${enrollment.id}`, () =>
                          updateEnrollmentStatus(enrollment.id, 'no_show')
                        )
                      }
                      disabled={isPending}
                      title="Mark No-Show"
                      className="p-1 rounded hover:bg-amber-100 text-amber-600 disabled:opacity-50"
                    >
                      {pendingAction === `noshow-${enrollment.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleAction(`cancel-${enrollment.id}`, () =>
                          updateEnrollmentStatus(enrollment.id, 'cancelled')
                        )
                      }
                      disabled={isPending}
                      title="Cancel Enrollment"
                      className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-50"
                    >
                      {pendingAction === `cancel-${enrollment.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleAction(`remove-${enrollment.id}`, () =>
                          removeEnrollment(enrollment.id)
                        )
                      }
                      disabled={isPending}
                      title="Remove Enrollment"
                      className="p-1 rounded hover:bg-gray-200 text-gray-400 disabled:opacity-50"
                    >
                      {pendingAction === `remove-${enrollment.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add enrollment */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">Add Enrollment</p>
        <div className="flex gap-2">
          <select
            value={selectedContactId}
            onChange={(e) => {
              setSelectedContactId(e.target.value)
              setSelectedDependentId('')
            }}
            className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select contact...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {dependents.length > 0 && (
          <select
            value={selectedDependentId}
            onChange={(e) => setSelectedDependentId(e.target.value)}
            className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">No dependent (contact only)</option>
            {dependents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleAdd}
          disabled={isPending || !selectedContactId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pendingAction === 'add' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UserPlus className="h-3 w-3" />
          )}
          Add
        </button>
      </div>
    </div>
  )
}
