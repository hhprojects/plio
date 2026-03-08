'use client'

import { useState, useMemo, useTransition } from 'react'
import { X, Clock, Loader2 } from 'lucide-react'
import { createAppointment } from '@/app/(dashboard)/calendar/actions'

interface ServiceOption {
  id: string
  name: string
  duration_minutes: number | null
}

interface TeamMemberOption {
  id: string
  name: string
}

interface ContactOption {
  id: string
  name: string
}

interface AppointmentFormProps {
  services: ServiceOption[]
  teamMembers: TeamMemberOption[]
  contacts: ContactOption[]
  initialDate?: string
  initialTime?: string
  onClose: () => void
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newH = Math.floor(totalMinutes / 60) % 24
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

export function AppointmentForm({
  services,
  teamMembers,
  contacts,
  initialDate,
  initialTime,
  onClose,
}: AppointmentFormProps) {
  const [serviceId, setServiceId] = useState('')
  const [teamMemberId, setTeamMemberId] = useState('')
  const [contactId, setContactId] = useState('')
  const [date, setDate] = useState(initialDate ?? '')
  const [startTime, setStartTime] = useState(initialTime ?? '')
  const [contactSearch, setContactSearch] = useState('')
  const [showContactList, setShowContactList] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Find selected service to get duration
  const selectedService = services.find((s) => s.id === serviceId)
  const duration = selectedService?.duration_minutes ?? 60

  // Auto-calculate end time
  const endTime = startTime ? addMinutesToTime(startTime, duration) : ''

  // Filter contacts by search text
  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts
    const q = contactSearch.toLowerCase()
    return contacts.filter((c) => c.name.toLowerCase().includes(q))
  }, [contacts, contactSearch])

  function handleContactSelect(contact: ContactOption) {
    setContactId(contact.id)
    setContactSearch(contact.name)
    setShowContactList(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!serviceId || !teamMemberId || !contactId || !date || !startTime) {
      setError('All fields are required')
      return
    }

    const formData = new FormData()
    formData.set('service_id', serviceId)
    formData.set('team_member_id', teamMemberId)
    formData.set('contact_id', contactId)
    formData.set('date', date)
    formData.set('start_time', startTime)
    formData.set('end_time', endTime)

    startTransition(async () => {
      const result = await createAppointment(formData)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Appointment</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a service...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.duration_minutes ? `(${s.duration_minutes} min)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Team Member */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              value={teamMemberId}
              onChange={(e) => setTeamMemberId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select team member...</option>
              {teamMembers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contact (searchable) */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => {
                setContactSearch(e.target.value)
                setShowContactList(true)
                if (!e.target.value) setContactId('')
              }}
              onFocus={() => setShowContactList(true)}
              placeholder="Search contacts..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {showContactList && filteredContacts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleContactSelect(c)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      c.id === contactId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {showContactList && contactSearch && filteredContacts.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
                No contacts found
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 bg-gray-50 text-sm text-gray-600">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span>{endTime || '--:--'}</span>
                {selectedService?.duration_minutes && (
                  <span className="text-xs text-gray-400">({duration} min)</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
