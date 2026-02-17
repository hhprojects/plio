'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Clock, Phone, User, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getAppointmentDetail, updateAppointmentStatus, addPractitionerNote } from './actions'

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

function formatNoteDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Confirmed', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
  no_show: { label: 'No Show', variant: 'destructive' },
}

interface NoteItem {
  id: string
  content: string
  createdAt: string
  appointmentId: string | null
  practitionerName: string
}

interface AppointmentData {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
  cancellationReason: string | null
  serviceTitle: string
  serviceColor: string
  serviceDuration: number
  clientId: string
  clientName: string
  clientPhone: string
  visitCount: number
  notes: NoteItem[]
}

export function AppointmentDetailClient({ appointmentId }: { appointmentId: string }) {
  const [data, setData] = useState<AppointmentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUpdating, startUpdateTransition] = useTransition()
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [isAddingNote, startNoteTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const res = await getAppointmentDetail(appointmentId)
      if (res.error) {
        setError(res.error)
      } else {
        setData(res.data)
      }
    })
  }, [appointmentId])

  function handleStatusUpdate(status: string, reason?: string) {
    startUpdateTransition(async () => {
      const res = await updateAppointmentStatus(appointmentId, status, reason)
      if (res.error) {
        toast.error(res.error)
      } else {
        setData((prev) => prev ? { ...prev, status, cancellationReason: reason ?? null } : prev)
        setShowCancelForm(false)
        setCancelReason('')
        const labels: Record<string, string> = {
          completed: 'Marked as completed',
          no_show: 'Marked as no-show',
          cancelled: 'Appointment cancelled',
        }
        toast.success(labels[status] ?? 'Status updated')
      }
    })
  }

  function handleAddNote() {
    if (!noteContent.trim() || !data) return
    startNoteTransition(async () => {
      const formData = new FormData()
      formData.set('appointmentId', appointmentId)
      formData.set('clientId', data.clientId)
      formData.set('content', noteContent)
      const res = await addPractitionerNote(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        // Refresh data to get the new note
        const refreshed = await getAppointmentDetail(appointmentId)
        if (refreshed.data) setData(refreshed.data)
        setNoteContent('')
        toast.success('Note added')
      }
    })
  }

  if (isPending && !data) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/practitioner/schedule" className="inline-flex items-center gap-1 text-sm text-indigo-600">
          <ArrowLeft className="size-4" /> Back to schedule
        </Link>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const status = statusConfig[data.status] ?? statusConfig.confirmed

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link href="/practitioner/schedule" className="inline-flex items-center gap-1 text-sm text-indigo-600">
        <ArrowLeft className="size-4" /> Back to schedule
      </Link>

      {/* Appointment info card */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 h-14 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: data.serviceColor }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold text-gray-900">{data.serviceTitle}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">{formatDate(data.date)}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatTime(data.startTime)} - {formatTime(data.endTime)}
              </span>
              <span className="text-gray-400">{data.serviceDuration} min</span>
            </div>
            {data.cancellationReason && (
              <p className="mt-2 text-sm text-red-600">
                Reason: {data.cancellationReason}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Client info card */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Client</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-900">
            <User className="size-4 text-gray-400" />
            {data.clientName}
          </div>
          {data.clientPhone && (
            <div className="flex items-center gap-2 text-gray-500">
              <Phone className="size-4 text-gray-400" />
              {data.clientPhone}
            </div>
          )}
          <p className="text-gray-500">{data.visitCount} past visit{data.visitCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Status action buttons */}
      {data.status === 'confirmed' && (
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Actions</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="size-4" />
              Mark Complete
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate('no_show')}
              disabled={isUpdating}
              className="flex-1"
            >
              <X className="size-4" />
              No-Show
            </Button>
          </div>
          {!showCancelForm ? (
            <Button
              variant="outline"
              onClick={() => setShowCancelForm(true)}
              disabled={isUpdating}
              className="w-full"
            >
              Cancel Appointment
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Cancellation reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled', cancelReason)}
                  disabled={isUpdating || !cancelReason.trim()}
                  className="flex-1"
                >
                  Confirm Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowCancelForm(false); setCancelReason('') }}
                  disabled={isUpdating}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client notes */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Client Notes ({data.notes.length})
          </h2>
        </div>

        {/* Add note form */}
        <div className="border-b px-4 py-3 space-y-2">
          <Textarea
            placeholder="Add a note about this session..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
          />
          <Button
            size="sm"
            onClick={handleAddNote}
            disabled={isAddingNote || !noteContent.trim()}
          >
            {isAddingNote ? 'Adding...' : 'Add Note'}
          </Button>
        </div>

        {/* Notes list */}
        {data.notes.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No notes yet
          </p>
        ) : (
          <ul className="divide-y">
            {data.notes.map((note) => (
              <li key={note.id} className="px-4 py-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium">{note.practitionerName}</span>
                  <span>{formatNoteDate(note.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
