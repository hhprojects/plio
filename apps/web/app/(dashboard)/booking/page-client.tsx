'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  CalendarClock,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import type { TenantSettings, TeamAvailability } from '@plio/db'
import {
  updateBookingStatus,
  rescheduleBooking,
  toggleServiceBookable,
  upsertTeamAvailability,
  deleteTeamAvailability,
  updateBookingAppearance,
} from './actions'
import { getDashboardAvailableSlots } from './slot-actions'

// ── Types ───────────────────────────────────────────────────────────────

interface BookingItem {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  service: { id: string; name: string; color: string | null; duration_minutes: number | null; price: number | null; currency: string } | null
  team_member: { id: string; name: string } | null
  client: { id: string; name: string; email: string; phone: string | null } | null
}

interface ServiceItem {
  id: string
  name: string
  type: string
  duration_minutes: number | null
  price: number | null
  currency: string
  active: boolean
}

interface TeamMemberItem {
  id: string
  name: string
}

interface BookingPageClientProps {
  bookings: BookingItem[]
  tenant: { slug: string; settings: TenantSettings | null }
  services: ServiceItem[]
  teamMembers: TeamMemberItem[]
  availability: TeamAvailability[]
  canWrite: boolean
}

// ── Helpers ─────────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
  no_show: { label: 'No-show', className: 'bg-amber-100 text-amber-700' },
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Component ───────────────────────────────────────────────────────────

export function BookingPageClient({
  bookings,
  tenant,
  services,
  teamMembers,
  availability,
  canWrite,
}: BookingPageClientProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // ── Settings state ──────────────────────────────────────────────────
  const [editingAvailability, setEditingAvailability] = useState<{
    teamMemberId: string
    dayOfWeek: number
    startTime: string
    endTime: string
    existingId?: string
  } | null>(null)

  // ── Filter bookings ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = bookings
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) => b.client?.name.toLowerCase().includes(q) || b.client?.email.toLowerCase().includes(q)
      )
    }
    return result
  }, [bookings, statusFilter, search])

  // ── Handlers ────────────────────────────────────────────────────────
  function handleStatusUpdate(sessionId: string, status: 'completed' | 'no_show' | 'cancelled') {
    setActionMenuId(null)
    setCancelConfirmId(null)
    startTransition(async () => {
      const result = await updateBookingStatus(sessionId, status)
      if (result.error) alert(result.error)
    })
  }

  function handleReschedule(sessionId: string, slot: { team_member_id: string; start_time: string; end_time: string; date: string }) {
    startTransition(async () => {
      const result = await rescheduleBooking({
        sessionId,
        team_member_id: slot.team_member_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      })
      if (result.error) {
        alert(result.error)
      } else {
        setRescheduleId(null)
      }
    })
  }

  function handleToggleBookable(serviceId: string, currentType: string) {
    startTransition(async () => {
      const result = await toggleServiceBookable(serviceId, currentType !== 'bookable')
      if (result.error) alert(result.error)
    })
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/book/${tenant.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSaveAvailability() {
    if (!editingAvailability) return
    startTransition(async () => {
      const result = await upsertTeamAvailability({
        team_member_id: editingAvailability.teamMemberId,
        day_of_week: editingAvailability.dayOfWeek,
        start_time: editingAvailability.startTime,
        end_time: editingAvailability.endTime,
      })
      if (result.error) alert(result.error)
      else setEditingAvailability(null)
    })
  }

  function handleDeleteAvailability(id: string) {
    startTransition(async () => {
      const result = await deleteTeamAvailability(id)
      if (result.error) alert(result.error)
    })
  }

  const bookingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${tenant.slug}`

  // ── Reschedule booking item ─────────────────────────────────────────
  const rescheduleBookingItem = rescheduleId
    ? bookings.find((b) => b.id === rescheduleId)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Booking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage appointments and configure your public booking page.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* BOOKINGS TAB                                                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No-show</option>
            </select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              {bookings.length === 0
                ? 'No bookings yet. Share your booking page to start receiving appointments.'
                : 'No bookings match your filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Team Member</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Status</th>
                    {canWrite && <th className="px-4 py-3 w-12"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((booking) => {
                    const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.scheduled
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {booking.client?.name ?? 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.client?.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {booking.service?.color && (
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: booking.service.color }}
                              />
                            )}
                            <span className="text-gray-900">
                              {booking.service?.name ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {booking.team_member?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{formatDate(booking.date)}</div>
                          <div className="text-xs text-gray-500">
                            {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3 relative">
                            {booking.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() =>
                                    setActionMenuId(actionMenuId === booking.id ? null : booking.id)
                                  }
                                  className="p-1 rounded hover:bg-gray-100"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                </button>
                                {actionMenuId === booking.id && (
                                  <div className="absolute right-4 top-10 z-20 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
                                    <button
                                      onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      Mark Completed
                                    </button>
                                    <button
                                      onClick={() => handleStatusUpdate(booking.id, 'no_show')}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <Clock className="h-4 w-4 text-amber-500" />
                                      Mark No-show
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActionMenuId(null)
                                        setRescheduleId(booking.id)
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      <CalendarClock className="h-4 w-4 text-indigo-500" />
                                      Reschedule
                                    </button>
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                      onClick={() => {
                                        setActionMenuId(null)
                                        setCancelConfirmId(booking.id)
                                      }}
                                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Cancel Booking
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* SETTINGS TAB                                                      */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Booking Page Link */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Booking Page</h2>
            <p className="text-sm text-gray-500">
              Share this link with clients so they can book appointments online.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate">
                {bookingUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Preview
              </a>
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Bookable Services */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Bookable Services</h2>
            <p className="text-sm text-gray-500">
              Toggle which services appear on your public booking page.
            </p>
            <div className="space-y-2">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{service.name}</div>
                    <div className="text-xs text-gray-500">
                      {service.duration_minutes ? `${service.duration_minutes} min` : '—'}
                      {service.price != null && ` · $${service.price.toFixed(2)} ${service.currency}`}
                    </div>
                  </div>
                  {canWrite && (
                    <button
                      onClick={() => handleToggleBookable(service.id, service.type)}
                      disabled={isPending}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        service.type === 'bookable' ? 'bg-indigo-600' : 'bg-gray-200'
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${
                          service.type === 'bookable' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  )}
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">
                  No active services. Create services on the Services page first.
                </p>
              )}
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Team Availability */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Team Availability</h2>
            <p className="text-sm text-gray-500">
              Set when each team member is available for bookings.
            </p>
            {teamMembers.map((member) => {
              const memberAvail = availability.filter((a) => a.team_member_id === member.id)
              return (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm">{member.name}</h3>
                  {memberAvail.length > 0 ? (
                    <div className="space-y-1">
                      {memberAvail.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 w-12">{DAY_NAMES[a.day_of_week]}</span>
                          <span className="text-gray-600">
                            {formatTime(a.start_time)} – {formatTime(a.end_time)}
                          </span>
                          {canWrite && (
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  setEditingAvailability({
                                    teamMemberId: member.id,
                                    dayOfWeek: a.day_of_week,
                                    startTime: a.start_time,
                                    endTime: a.end_time,
                                    existingId: a.id,
                                  })
                                }
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAvailability(a.id)}
                                className="text-xs text-red-500 hover:underline ml-2"
                                disabled={isPending}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No availability set</p>
                  )}
                  {canWrite && (
                    <button
                      onClick={() =>
                        setEditingAvailability({
                          teamMemberId: member.id,
                          dayOfWeek: 1,
                          startTime: '09:00',
                          endTime: '17:00',
                        })
                      }
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      + Add availability
                    </button>
                  )}
                </div>
              )
            })}
          </section>

          <hr className="border-gray-200" />

          {/* Appearance */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            <p className="text-sm text-gray-500">
              Customize how your booking page looks to clients.
            </p>
            <form
              action={async (formData: FormData) => {
                startTransition(async () => {
                  const result = await updateBookingAppearance(formData)
                  if (result.error) alert(result.error)
                })
              }}
              className="space-y-4 max-w-md"
            >
              <div className="space-y-1.5">
                <label htmlFor="accent_color" className="block text-sm font-medium text-gray-700">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="accent_color"
                    name="accent_color"
                    type="color"
                    defaultValue={tenant.settings?.accent_color ?? '#6366f1'}
                    className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    Used for buttons and highlights on your booking page.
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  id="logo_url"
                  name="logo_url"
                  type="url"
                  placeholder="https://..."
                  defaultValue={tenant.settings?.logo_url ?? ''}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {canWrite && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Save Appearance'}
                </button>
              )}
            </form>
          </section>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* CANCEL CONFIRM DIALOG                                             */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {cancelConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Cancel Booking</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this booking? The client will need to rebook.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelConfirmId(null)}
                className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleStatusUpdate(cancelConfirmId, 'cancelled')}
                disabled={isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* RESCHEDULE DIALOG                                                 */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {rescheduleId && rescheduleBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reschedule Booking</h2>
              <button
                onClick={() => setRescheduleId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Current: {formatDate(rescheduleBookingItem.date)},{' '}
              {formatTime(rescheduleBookingItem.start_time)} –{' '}
              {formatTime(rescheduleBookingItem.end_time)}
              {rescheduleBookingItem.team_member && (
                <> with {rescheduleBookingItem.team_member.name}</>
              )}
            </p>
            <RescheduleSlotPicker
              serviceId={rescheduleBookingItem.service?.id ?? ''}
              onSelect={(slot) => handleReschedule(rescheduleId, slot)}
              isPending={isPending}
            />
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* AVAILABILITY EDIT DIALOG                                          */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {editingAvailability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingAvailability.existingId ? 'Edit' : 'Add'} Availability
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={editingAvailability.dayOfWeek}
                  onChange={(e) =>
                    setEditingAvailability({
                      ...editingAvailability,
                      dayOfWeek: parseInt(e.target.value),
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {DAY_NAMES.map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                  <input
                    type="time"
                    value={editingAvailability.startTime}
                    onChange={(e) =>
                      setEditingAvailability({
                        ...editingAvailability,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                  <input
                    type="time"
                    value={editingAvailability.endTime}
                    onChange={(e) =>
                      setEditingAvailability({
                        ...editingAvailability,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingAvailability(null)}
                className="border border-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAvailability}
                disabled={isPending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline Reschedule Slot Picker ───────────────────────────────────────

function RescheduleSlotPicker({
  serviceId,
  onSelect,
  isPending: parentPending,
}: {
  serviceId: string
  onSelect: (slot: {
    team_member_id: string
    team_member_name: string
    start_time: string
    end_time: string
    date: string
  }) => void
  isPending: boolean
}) {
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<
    Array<{ team_member_id: string; team_member_name: string; start_time: string; end_time: string }>
  >([])
  const [isLoading, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)

  function handleDateChange(newDate: string) {
    setDate(newDate)
    if (!newDate) {
      setSlots([])
      setHasSearched(false)
      return
    }
    startTransition(async () => {
      const result = await getDashboardAvailableSlots(serviceId, newDate)
      setSlots(result.slots)
      setHasSearched(true)
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 60)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  // Group by team member
  const grouped = slots.reduce<Record<string, typeof slots>>((acc, slot) => {
    if (!acc[slot.team_member_name]) acc[slot.team_member_name] = []
    acc[slot.team_member_name].push(slot)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pick a new date</label>
        <input
          type="date"
          min={today}
          max={maxDateStr}
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span className="ml-2 text-sm text-gray-500">Loading slots...</span>
        </div>
      )}

      {!isLoading && hasSearched && slots.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No available slots for this date.</p>
      )}

      {!isLoading && slots.length > 0 && (
        <div className="space-y-4">
          {Object.entries(grouped).map(([memberName, memberSlots]) => (
            <div key={memberName}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{memberName}</h4>
              <div className="grid grid-cols-3 gap-2">
                {memberSlots.map((slot) => (
                  <button
                    key={`${slot.team_member_id}-${slot.start_time}`}
                    onClick={() => onSelect({ ...slot, date })}
                    disabled={parentPending}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {formatTime(slot.start_time)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
