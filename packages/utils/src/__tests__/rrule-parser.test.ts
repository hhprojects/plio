import { describe, it, expect } from 'vitest';
import { parseRRule, generateOccurrences } from '../rrule-parser';

describe('parseRRule', () => {
  it('parses FREQ=WEEKLY;COUNT=12', () => {
    const result = parseRRule('FREQ=WEEKLY;COUNT=12');
    expect(result).toEqual({
      freq: 'WEEKLY',
      count: 12,
    });
  });

  it('parses FREQ=WEEKLY;UNTIL=20260601', () => {
    const result = parseRRule('FREQ=WEEKLY;UNTIL=20260601');
    expect(result).toEqual({
      freq: 'WEEKLY',
      until: '2026-06-01',
    });
  });

  it('parses UNTIL in YYYY-MM-DD format', () => {
    const result = parseRRule('FREQ=WEEKLY;UNTIL=2026-06-01');
    expect(result.until).toBe('2026-06-01');
  });

  it('parses INTERVAL', () => {
    const result = parseRRule('FREQ=WEEKLY;INTERVAL=2;COUNT=6');
    expect(result).toEqual({
      freq: 'WEEKLY',
      interval: 2,
      count: 6,
    });
  });

  it('parses BYDAY', () => {
    const result = parseRRule('FREQ=WEEKLY;BYDAY=MO,WE,FR');
    expect(result.byday).toEqual([1, 3, 5]);
  });

  it('throws on unsupported frequency', () => {
    expect(() => parseRRule('FREQ=DAILY;COUNT=5')).toThrow('Unsupported frequency');
  });

  it('throws on unknown BYDAY value', () => {
    expect(() => parseRRule('FREQ=WEEKLY;BYDAY=XX')).toThrow('Unknown BYDAY value');
  });

  it('handles case-insensitive keys', () => {
    const result = parseRRule('freq=weekly;count=5');
    expect(result.freq).toBe('WEEKLY');
    expect(result.count).toBe(5);
  });
});

describe('generateOccurrences', () => {
  it('generates correct number of weekly occurrences', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2, // Tuesday
      rruleString: 'FREQ=WEEKLY;COUNT=12',
    });
    expect(result).toHaveLength(12);
    expect(result[0]).toBe('2026-03-03');
    expect(result[11]).toBe('2026-05-19');
  });

  it('generates weekly occurrences for a Tuesday', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2, // Tuesday
      rruleString: 'FREQ=WEEKLY;COUNT=4',
    });
    expect(result).toEqual([
      '2026-03-03',
      '2026-03-10',
      '2026-03-17',
      '2026-03-24',
    ]);
  });

  it('skips holidays and does not count them toward COUNT', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=4',
      holidays: ['2026-03-10'],
    });
    // March 10 is skipped, so we get 4 non-holiday dates
    expect(result).toHaveLength(4);
    expect(result).not.toContain('2026-03-10');
    expect(result).toEqual([
      '2026-03-03',
      '2026-03-17',
      '2026-03-24',
      '2026-03-31',
    ]);
  });

  it('skips multiple holidays', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=4',
      holidays: ['2026-03-10', '2026-03-17'],
    });
    expect(result).toHaveLength(4);
    expect(result).not.toContain('2026-03-10');
    expect(result).not.toContain('2026-03-17');
  });

  it('respects UNTIL date', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;UNTIL=2026-03-20',
    });
    // Should include March 3, 10, 17 — not March 24
    expect(result).toEqual([
      '2026-03-03',
      '2026-03-10',
      '2026-03-17',
    ]);
  });

  it('respects effectiveUntil as hard stop', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=100',
      effectiveUntil: '2026-03-20',
    });
    expect(result).toEqual([
      '2026-03-03',
      '2026-03-10',
      '2026-03-17',
    ]);
  });

  it('handles INTERVAL=2 (bi-weekly)', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;INTERVAL=2;COUNT=4',
    });
    expect(result).toEqual([
      '2026-03-03',
      '2026-03-17',
      '2026-03-31',
      '2026-04-14',
    ]);
  });

  it('adjusts start date to correct day of week', () => {
    // Start on a Monday (2026-03-02), but dayOfWeek is Tuesday (2)
    const result = generateOccurrences({
      startDate: '2026-03-02',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=2',
    });
    // Should start from the next Tuesday (March 3)
    expect(result[0]).toBe('2026-03-03');
    expect(result).toHaveLength(2);
  });

  it('handles empty holidays array', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=3',
      holidays: [],
    });
    expect(result).toHaveLength(3);
  });

  it('returns empty array when count is 0', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=0',
    });
    expect(result).toHaveLength(0);
  });

  it('returns empty when effectiveUntil is before start date', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=10',
      effectiveUntil: '2026-03-01',
    });
    expect(result).toHaveLength(0);
  });

  it('handles start date exactly on a holiday', () => {
    const result = generateOccurrences({
      startDate: '2026-03-03',
      dayOfWeek: 2,
      rruleString: 'FREQ=WEEKLY;COUNT=3',
      holidays: ['2026-03-03'],
    });
    // Start date is a holiday, skip it, count 3 from remaining
    expect(result).toHaveLength(3);
    expect(result).not.toContain('2026-03-03');
    expect(result[0]).toBe('2026-03-10');
  });

  it('generates occurrences across year boundary', () => {
    const result = generateOccurrences({
      startDate: '2026-12-29',
      dayOfWeek: 2, // Tuesday
      rruleString: 'FREQ=WEEKLY;COUNT=3',
    });
    expect(result[0]).toBe('2026-12-29');
    expect(result[1]).toBe('2027-01-05');
    expect(result[2]).toBe('2027-01-12');
  });
});
