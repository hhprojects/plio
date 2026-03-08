import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  isToday,
  isFutureDate,
  getDayOfWeek,
  addDays,
  diffInHours,
  toSGDate,
} from '../date-helpers';

describe('formatDate', () => {
  it('formats a date to YYYY-MM-DD by default', () => {
    // 2026-03-15 in UTC — should be same in SG (UTC+8)
    const date = new Date('2026-03-15T10:00:00Z');
    expect(formatDate(date)).toBe('2026-03-15');
  });

  it('formats a date string to YYYY-MM-DD', () => {
    expect(formatDate('2026-03-15T10:00:00Z')).toBe('2026-03-15');
  });

  it('formats date to DD/MM/YYYY', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    expect(formatDate(date, 'DD/MM/YYYY')).toBe('15/03/2026');
  });

  it('formats date to DD MMM YYYY', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    expect(formatDate(date, 'DD MMM YYYY')).toBe('15 Mar 2026');
  });

  it('handles UTC midnight dates that cross day boundary in SG', () => {
    // UTC midnight = 8 AM in SG, so date should be same
    const date = new Date('2026-03-15T00:00:00Z');
    expect(formatDate(date)).toBe('2026-03-15');
  });

  it('handles late UTC dates that are next day in SG', () => {
    // 11 PM UTC = 7 AM next day in SG (UTC+8)
    const date = new Date('2026-03-15T23:00:00Z');
    expect(formatDate(date)).toBe('2026-03-16');
  });

  it('formats date with long format', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    const result = formatDate(date, 'long');
    expect(result).toContain('March');
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });
});

describe('formatTime', () => {
  it('formats 14:00 to 2:00 PM', () => {
    expect(formatTime('14:00')).toBe('2:00 PM');
  });

  it('formats 09:30 to 9:30 AM', () => {
    expect(formatTime('09:30')).toBe('9:30 AM');
  });

  it('formats 00:00 to 12:00 AM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
  });

  it('formats 12:00 to 12:00 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('formats 23:59 to 11:59 PM', () => {
    expect(formatTime('23:59')).toBe('11:59 PM');
  });

  it('formats 13:05 to 1:05 PM', () => {
    expect(formatTime('13:05')).toBe('1:05 PM');
  });
});

describe('formatDateTime', () => {
  it('formats a date to a readable datetime string', () => {
    const date = new Date('2026-03-15T06:00:00Z');
    // In SG this is 2:00 PM on March 15
    const result = formatDateTime(date);
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
  });
});

describe('isToday', () => {
  it('returns true for the current date', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('returns false for a past date', () => {
    expect(isToday('2020-01-01')).toBe(false);
  });

  it('returns false for a future date', () => {
    expect(isToday('2099-12-31')).toBe(false);
  });
});

describe('isFutureDate', () => {
  it('returns true for a far future date', () => {
    expect(isFutureDate('2099-12-31')).toBe(true);
  });

  it('returns false for a past date', () => {
    expect(isFutureDate('2020-01-01')).toBe(false);
  });

  it('returns false for today', () => {
    expect(isFutureDate(new Date())).toBe(false);
  });
});

describe('getDayOfWeek', () => {
  it('returns correct day for a known date', () => {
    // 2026-03-15 is a Sunday in SG timezone
    const date = new Date('2026-03-15T10:00:00Z');
    expect(getDayOfWeek(date)).toBe(0); // Sunday
  });

  it('returns correct day for a Monday', () => {
    // 2026-03-16 is a Monday
    const date = new Date('2026-03-16T10:00:00Z');
    expect(getDayOfWeek(date)).toBe(1); // Monday
  });

  it('returns correct day for a Saturday', () => {
    // 2026-03-14 is a Saturday
    const date = new Date('2026-03-14T10:00:00Z');
    expect(getDayOfWeek(date)).toBe(6); // Saturday
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    const result = addDays(date, 5);
    expect(result.getDate()).toBe(20);
  });

  it('subtracts days with negative value', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    const result = addDays(date, -5);
    expect(result.getDate()).toBe(10);
  });

  it('handles month boundary', () => {
    const date = new Date('2026-03-30T10:00:00Z');
    const result = addDays(date, 5);
    expect(result.getMonth()).toBe(3); // April (0-indexed)
    expect(result.getDate()).toBe(4);
  });

  it('does not mutate original date', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    const originalTime = date.getTime();
    addDays(date, 5);
    expect(date.getTime()).toBe(originalTime);
  });

  it('handles adding 0 days', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    const result = addDays(date, 0);
    expect(result.getDate()).toBe(date.getDate());
  });
});

describe('diffInHours', () => {
  it('calculates positive difference', () => {
    const date1 = new Date('2026-03-15T14:00:00Z');
    const date2 = new Date('2026-03-15T10:00:00Z');
    expect(diffInHours(date1, date2)).toBe(4);
  });

  it('calculates negative difference', () => {
    const date1 = new Date('2026-03-15T10:00:00Z');
    const date2 = new Date('2026-03-15T14:00:00Z');
    expect(diffInHours(date1, date2)).toBe(-4);
  });

  it('handles fractional hours', () => {
    const date1 = new Date('2026-03-15T10:30:00Z');
    const date2 = new Date('2026-03-15T10:00:00Z');
    expect(diffInHours(date1, date2)).toBe(0.5);
  });

  it('handles multi-day difference', () => {
    const date1 = new Date('2026-03-17T10:00:00Z');
    const date2 = new Date('2026-03-15T10:00:00Z');
    expect(diffInHours(date1, date2)).toBe(48);
  });
});

describe('toSGDate', () => {
  it('formats a UTC date to YYYY-MM-DD in SG timezone', () => {
    const date = new Date('2026-03-15T10:00:00Z');
    expect(toSGDate(date)).toBe('2026-03-15');
  });

  it('handles timezone crossing (late UTC to next day in SG)', () => {
    // 11 PM UTC on March 15 = 7 AM March 16 in SG
    const date = new Date('2026-03-15T23:00:00Z');
    expect(toSGDate(date)).toBe('2026-03-16');
  });

  it('handles early UTC (still same day in SG)', () => {
    // 2 AM UTC on March 15 = 10 AM March 15 in SG
    const date = new Date('2026-03-15T02:00:00Z');
    expect(toSGDate(date)).toBe('2026-03-15');
  });
});
