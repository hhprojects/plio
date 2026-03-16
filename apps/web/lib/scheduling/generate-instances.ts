import type { SessionInsert } from '@plio/db'
import { generateOccurrences } from '@plio/utils'

/**
 * Generate ClassInstance records from a recurring schedule configuration.
 *
 * Uses the RRULE parser from @plio/utils to compute occurrence dates,
 * filters out holidays, and maps each date to a SessionInsert object.
 *
 * @returns The generated instances and any dates skipped due to holidays.
 */
export function generateClassInstances(input: {
  scheduleId: string
  serviceId: string
  tenantId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  teamMemberId: string
  roomId: string | null
  recurrenceRule: string
  effectiveFrom: string
  effectiveUntil: string
  holidays: string[]
}): { instances: SessionInsert[]; skippedDates: string[] } {
  const {
    scheduleId,
    serviceId,
    tenantId,
    dayOfWeek,
    startTime,
    endTime,
    teamMemberId,
    roomId,
    recurrenceRule,
    effectiveFrom,
    effectiveUntil,
    holidays,
  } = input

  // Generate all occurrence dates using the RRULE utility
  const occurrenceDates = generateOccurrences({
    startDate: effectiveFrom,
    dayOfWeek,
    rruleString: recurrenceRule,
    holidays,
    effectiveUntil,
  })

  // Determine which holidays were skipped by comparing all possible dates
  // against the returned dates
  const allDatesWithoutHolidayFilter = generateOccurrences({
    startDate: effectiveFrom,
    dayOfWeek,
    rruleString: recurrenceRule,
    holidays: [],
    effectiveUntil,
  })

  const occurrenceSet = new Set(occurrenceDates)
  const holidaySet = new Set(holidays)
  const skippedDates = allDatesWithoutHolidayFilter.filter(
    (date) => !occurrenceSet.has(date) && holidaySet.has(date)
  )

  // Map each occurrence date to a SessionInsert object
  const instances: SessionInsert[] = occurrenceDates.map((date) => ({
    schedule_id: scheduleId,
    service_id: serviceId,
    tenant_id: tenantId,
    date,
    start_time: startTime,
    end_time: endTime,
    team_member_id: teamMemberId,
    room_id: roomId,
    status: 'scheduled' as const,
    type: 'class' as const,
  }))

  return { instances, skippedDates }
}
