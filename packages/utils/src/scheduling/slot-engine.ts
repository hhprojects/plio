export interface TimeWindow {
  start: string // "HH:mm" format
  end: string   // "HH:mm" format
}

export interface ExistingAppointment {
  start_time: string // "HH:mm"
  end_time: string   // "HH:mm"
  buffer_minutes: number
}

export interface SlotEngineInput {
  availabilityWindows: TimeWindow[]
  existingAppointments: ExistingAppointment[]
  serviceDurationMinutes: number
  bufferMinutes: number
  slotIntervalMinutes: number
}

export interface TimeSlot {
  start: string // "HH:mm"
  end: string   // "HH:mm"
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function computeAvailableSlots(input: SlotEngineInput): TimeSlot[] {
  const {
    availabilityWindows,
    existingAppointments,
    serviceDurationMinutes,
    bufferMinutes,
    slotIntervalMinutes,
  } = input

  const slots: TimeSlot[] = []

  const blockedRanges = existingAppointments.map((appt) => ({
    start: timeToMinutes(appt.start_time),
    end: timeToMinutes(appt.end_time) + appt.buffer_minutes,
  }))

  for (const window of availabilityWindows) {
    const windowStart = timeToMinutes(window.start)
    const windowEnd = timeToMinutes(window.end)

    for (
      let candidateStart = windowStart;
      candidateStart + serviceDurationMinutes <= windowEnd;
      candidateStart += slotIntervalMinutes
    ) {
      const candidateEnd = candidateStart + serviceDurationMinutes
      const slotWithBuffer = {
        start: candidateStart,
        end: candidateEnd + bufferMinutes,
      }

      const hasConflict = blockedRanges.some(
        (blocked) => slotWithBuffer.start < blocked.end && slotWithBuffer.end > blocked.start
      )

      if (!hasConflict) {
        slots.push({
          start: minutesToTime(candidateStart),
          end: minutesToTime(candidateEnd),
        })
      }
    }
  }

  return slots
}
