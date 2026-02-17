import { describe, it, expect } from 'vitest'
import {
  computeAvailableSlots,
  timeToMinutes,
  minutesToTime,
  type SlotEngineInput,
} from './slot-engine'

describe('timeToMinutes', () => {
  it('converts 09:00 to 540', () => {
    expect(timeToMinutes('09:00')).toBe(540)
  })
  it('converts 17:30 to 1050', () => {
    expect(timeToMinutes('17:30')).toBe(1050)
  })
  it('converts 00:00 to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0)
  })
})

describe('minutesToTime', () => {
  it('converts 540 to 09:00', () => {
    expect(minutesToTime(540)).toBe('09:00')
  })
  it('converts 1050 to 17:30', () => {
    expect(minutesToTime(1050)).toBe('17:30')
  })
  it('converts 0 to 00:00', () => {
    expect(minutesToTime(0)).toBe('00:00')
  })
})

describe('computeAvailableSlots', () => {
  it('returns all slots when no existing appointments', () => {
    const input: SlotEngineInput = {
      availabilityWindows: [{ start: '09:00', end: '12:00' }],
      existingAppointments: [],
      serviceDurationMinutes: 60,
      bufferMinutes: 0,
      slotIntervalMinutes: 60,
    }
    const slots = computeAvailableSlots(input)
    expect(slots).toEqual([
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
    ])
  })

  it('returns empty when availability window is too short for service', () => {
    const input: SlotEngineInput = {
      availabilityWindows: [{ start: '09:00', end: '09:30' }],
      existingAppointments: [],
      serviceDurationMinutes: 60,
      bufferMinutes: 0,
      slotIntervalMinutes: 15,
    }
    expect(computeAvailableSlots(input)).toEqual([])
  })

  it('removes slots that overlap with existing appointments', () => {
    const input: SlotEngineInput = {
      availabilityWindows: [{ start: '09:00', end: '13:00' }],
      existingAppointments: [
        { start_time: '10:00', end_time: '11:00', buffer_minutes: 0 },
      ],
      serviceDurationMinutes: 60,
      bufferMinutes: 0,
      slotIntervalMinutes: 60,
    }
    const slots = computeAvailableSlots(input)
    expect(slots).toEqual([
      { start: '09:00', end: '10:00' },
      { start: '11:00', end: '12:00' },
      { start: '12:00', end: '13:00' },
    ])
  })

  it('respects buffer time after existing appointments', () => {
    const input: SlotEngineInput = {
      availabilityWindows: [{ start: '09:00', end: '13:00' }],
      existingAppointments: [
        { start_time: '10:00', end_time: '11:00', buffer_minutes: 15 },
      ],
      serviceDurationMinutes: 60,
      bufferMinutes: 0,
      slotIntervalMinutes: 15,
    }
    const slots = computeAvailableSlots(input)
    expect(slots[0]).toEqual({ start: '09:00', end: '10:00' })
    expect(slots.find((s) => s.start === '10:00')).toBeUndefined()
    expect(slots.find((s) => s.start === '11:00')).toBeUndefined()
    expect(slots.find((s) => s.start === '11:15')).toEqual({ start: '11:15', end: '12:15' })
  })

  it('generates slots at 15-minute intervals for 30-min service', () => {
    const input: SlotEngineInput = {
      availabilityWindows: [{ start: '09:00', end: '10:00' }],
      existingAppointments: [],
      serviceDurationMinutes: 30,
      bufferMinutes: 0,
      slotIntervalMinutes: 15,
    }
    const slots = computeAvailableSlots(input)
    expect(slots).toEqual([
      { start: '09:00', end: '09:30' },
      { start: '09:15', end: '09:45' },
      { start: '09:30', end: '10:00' },
    ])
  })

  it('handles multiple availability windows', () => {
    const input: SlotEngineInput = {
      availabilityWindows: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
      existingAppointments: [],
      serviceDurationMinutes: 60,
      bufferMinutes: 0,
      slotIntervalMinutes: 60,
    }
    const slots = computeAvailableSlots(input)
    expect(slots).toHaveLength(6)
    expect(slots[0].start).toBe('09:00')
    expect(slots[3].start).toBe('14:00')
  })

  it('returns empty for no availability windows', () => {
    const input: SlotEngineInput = {
      availabilityWindows: [],
      existingAppointments: [],
      serviceDurationMinutes: 60,
      bufferMinutes: 0,
      slotIntervalMinutes: 15,
    }
    expect(computeAvailableSlots(input)).toEqual([])
  })
})
