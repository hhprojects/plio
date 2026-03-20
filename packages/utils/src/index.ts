// @plio/utils — shared utility functions

export {
  formatDate,
  formatTime,
  formatDateTime,
  isToday,
  isFutureDate,
  getDayOfWeek,
  addDays,
  toSGDate,
} from './date-helpers';

export {
  parseRRule,
  generateOccurrences,
} from './rrule-parser';
export type { RRuleOptions } from './rrule-parser';

export {
  calculateGST,
  formatCurrency,
} from './gst-calculator';

export {
  computeAvailableSlots,
  timeToMinutes,
  minutesToTime,
} from './scheduling/slot-engine';
export type {
  TimeWindow,
  ExistingAppointment,
  SlotEngineInput,
  TimeSlot,
} from './scheduling/slot-engine';
