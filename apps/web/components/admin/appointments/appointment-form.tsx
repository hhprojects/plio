'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatTime } from '@plio/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  createAppointment,
  getAvailableSlotsAction,
  getServicesForForm,
  getPractitionersForForm,
  getClientsForForm,
  type ServiceOption,
  type PractitionerOption,
  type ClientOption,
} from '@/app/(dashboard)/admin/appointments/actions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(price)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AppointmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

const STEPS = [
  'Select Client',
  'Select Service',
  'Select Practitioner',
  'Select Date',
  'Select Time',
  'Confirm',
] as const

type Step = (typeof STEPS)[number]

export function AppointmentForm({
  open,
  onOpenChange,
  onCreated,
}: AppointmentFormProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState(0)

  // Form data
  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [practitionerId, setPractitionerId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')

  // Dropdown data
  const [clients, setClients] = useState<ClientOption[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [practitioners, setPractitioners] = useState<PractitionerOption[]>([])
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  // Client search
  const [clientSearch, setClientSearch] = useState('')

  // Loading state for dropdown data
  const [dataLoaded, setDataLoaded] = useState(false)

  // Load dropdown data when dialog opens
  useEffect(() => {
    if (open && !dataLoaded) {
      startTransition(async () => {
        const [clientsRes, servicesRes, practitionersRes] = await Promise.all([
          getClientsForForm(),
          getServicesForForm(),
          getPractitionersForForm(),
        ])
        setClients(clientsRes.data)
        setServices(servicesRes.data)
        setPractitioners(practitionersRes.data)
        setDataLoaded(true)
      })
    }
  }, [open, dataLoaded, startTransition])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(0)
      setClientId('')
      setServiceId('')
      setPractitionerId('')
      setDate('')
      setStartTime('')
      setSlots([])
      setClientSearch('')
    }
  }, [open])

  // Fetch slots when prerequisites are met
  const fetchSlots = useCallback(
    async (sid: string, pid: string, d: string) => {
      if (!sid || !pid || !d) return
      setSlotsLoading(true)
      setSlots([])
      setStartTime('')
      const result = await getAvailableSlotsAction(sid, pid, d)
      setSlots(result.data)
      setSlotsLoading(false)
    },
    []
  )

  // When step changes to time-selection step, fetch slots
  useEffect(() => {
    if (step === 4 && serviceId && practitionerId && date) {
      fetchSlots(serviceId, practitionerId, date)
    }
  }, [step, serviceId, practitionerId, date, fetchSlots])

  // Selected entities for display
  const selectedClient = clients.find((c) => c.id === clientId)
  const selectedService = services.find((s) => s.id === serviceId)
  const selectedPractitioner = practitioners.find(
    (p) => p.id === practitionerId
  )

  const filteredClients = clientSearch
    ? clients.filter((c) =>
        c.fullName.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients

  // Can we advance?
  const canAdvance = (): boolean => {
    switch (step) {
      case 0:
        return !!clientId
      case 1:
        return !!serviceId
      case 2:
        return !!practitionerId
      case 3:
        return !!date
      case 4:
        return !!startTime
      case 5:
        return true
      default:
        return false
    }
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createAppointment({
        client_id: clientId,
        service_id: serviceId,
        practitioner_id: practitionerId,
        date,
        start_time: startTime,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Appointment booked successfully')
        onOpenChange(false)
        onCreated?.()
      }
    })
  }

  // ---------------------------------------------------------------------------
  // Render step content
  // ---------------------------------------------------------------------------

  function renderStepContent() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {filteredClients.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No clients found.
                </p>
              )}
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    clientId === client.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setClientId(client.id)}
                >
                  <div>
                    <div className="font-medium">{client.fullName}</div>
                    <div className="text-muted-foreground text-xs">
                      {client.phone}
                    </div>
                  </div>
                  {clientId === client.id && (
                    <Check className="text-primary h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-2">
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedService && (
              <div className="text-muted-foreground rounded-md border p-3 text-sm">
                <div>Duration: {selectedService.durationMinutes} minutes</div>
                <div>Price: {formatPrice(selectedService.price)}</div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-2">
            <Select value={practitionerId} onValueChange={setPractitionerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a practitioner" />
              </SelectTrigger>
              <SelectContent>
                {practitioners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 3:
        return (
          <div className="space-y-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                // Reset time selection when date changes
                setStartTime('')
                setSlots([])
              }}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-3">
            {slotsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            )}
            {!slotsLoading && slots.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No available time slots for this date and practitioner.
              </p>
            )}
            {!slotsLoading && slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      startTime === slot.start
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setStartTime(slot.start)}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-3 rounded-md border p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{selectedClient?.fullName}</span>

              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{selectedService?.title}</span>

              <span className="text-muted-foreground">Duration:</span>
              <span>{selectedService?.durationMinutes} min</span>

              <span className="text-muted-foreground">Price:</span>
              <span>{selectedService ? formatPrice(selectedService.price) : ''}</span>

              <span className="text-muted-foreground">Practitioner:</span>
              <span className="font-medium">
                {selectedPractitioner?.fullName}
              </span>

              <span className="text-muted-foreground">Date:</span>
              <span>
                {date
                  ? new Date(date + 'T00:00:00').toLocaleDateString('en-SG', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </span>

              <span className="text-muted-foreground">Time:</span>
              <span>{startTime ? formatTime(startTime) : ''}</span>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="min-h-[200px] py-2">{renderStepContent()}</div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Appointment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
