'use client'

import {
  X,
  Clock,
  CalendarDays,
  MapPin,
  User,
  Tag,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
} from 'lucide-react'

interface SessionData {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  type: string
  room_id: string | null
  service: { id: string; name: string; color: string | null } | null
  team_member: { id: string; name: string; color: string | null } | null
}

interface SessionDetailProps {
  session: SessionData
  room: { id: string; name: string } | null
  onClose: () => void
}

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-700',
    icon: CalendarDays,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  no_show: {
    label: 'No Show',
    className: 'bg-amber-100 text-amber-700',
    icon: AlertCircle,
  },
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  class: { label: 'Class', className: 'bg-purple-100 text-purple-700' },
  appointment: { label: 'Appointment', className: 'bg-teal-100 text-teal-700' },
}

export function SessionDetail({ session, room, onClose }: SessionDetailProps) {
  const statusConf = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.scheduled
  const typeConf = TYPE_CONFIG[session.type] ?? TYPE_CONFIG.class
  const StatusIcon = statusConf.icon

  const formattedDate = new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(session.date + 'T00:00:00'))

  function formatTime(time: string) {
    const [h, m] = time.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  return (
    <div className="w-[400px] shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: session.service?.color ?? '#6366f1' }}
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {session.service?.name ?? 'Session'}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.className}`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusConf.label}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeConf.className}`}
              >
                {typeConf.label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Details */}
      <div className="p-4 space-y-4">
        {/* Date */}
        <div className="flex items-start gap-3">
          <CalendarDays className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </p>
          </div>
        </div>

        {/* Team Member */}
        {session.team_member && (
          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="flex items-center gap-2">
              {session.team_member.color && (
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: session.team_member.color }}
                />
              )}
              <p className="text-sm font-medium text-gray-900">
                {session.team_member.name}
              </p>
            </div>
          </div>
        )}

        {/* Room */}
        {room && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-gray-900">{room.name}</p>
          </div>
        )}

        {/* Type */}
        <div className="flex items-start gap-3">
          <Tag className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
          <p className="text-sm text-gray-600">
            {session.type === 'class' ? 'Recurring class session' : 'One-off appointment'}
          </p>
        </div>
      </div>

      {/* Enrollments placeholder */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-gray-900">Enrollments</h4>
        </div>
        <p className="text-xs text-gray-400 italic">
          Enrollment management will be available in a future update.
        </p>
      </div>
    </div>
  )
}
