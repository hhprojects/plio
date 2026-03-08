// Simplified RRULE parser for weekly recurrence
// Handles FREQ=WEEKLY with COUNT, UNTIL, INTERVAL, and BYDAY
// No external dependencies

export interface RRuleOptions {
  freq: 'WEEKLY';
  count?: number;
  until?: string;       // "YYYY-MM-DD"
  interval?: number;    // Every N weeks (default 1)
  byday?: number[];     // Day numbers (0=Sun, 6=Sat)
}

/**
 * Map RRULE BYDAY abbreviations to day numbers (0=Sun, 6=Sat).
 */
const BYDAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

/**
 * Parse an RRULE string into structured options.
 *
 * Example: "FREQ=WEEKLY;COUNT=12;INTERVAL=2"
 */
export function parseRRule(rrule: string): RRuleOptions {
  const parts = rrule.split(';');
  const result: RRuleOptions = { freq: 'WEEKLY' };

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (!key || !value) continue;

    switch (key.toUpperCase()) {
      case 'FREQ':
        if (value.toUpperCase() !== 'WEEKLY') {
          throw new Error(`Unsupported frequency: ${value}. Only WEEKLY is supported.`);
        }
        result.freq = 'WEEKLY';
        break;
      case 'COUNT':
        result.count = parseInt(value, 10);
        break;
      case 'UNTIL':
        // UNTIL can be in YYYYMMDD or YYYY-MM-DD format
        if (value.includes('-')) {
          result.until = value;
        } else {
          // Convert YYYYMMDD to YYYY-MM-DD
          result.until = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
        }
        break;
      case 'INTERVAL':
        result.interval = parseInt(value, 10);
        break;
      case 'BYDAY': {
        const days = value.split(',');
        result.byday = days.map((day) => {
          const mapped = BYDAY_MAP[day.toUpperCase()];
          if (mapped === undefined) {
            throw new Error(`Unknown BYDAY value: ${day}`);
          }
          return mapped;
        });
        break;
      }
    }
  }

  return result;
}

/**
 * Generate occurrence dates from a start date and RRULE string.
 *
 * - Skips dates that fall on holidays.
 * - Skipped holidays do NOT count toward COUNT.
 * - Respects effectiveUntil as a hard stop date.
 *
 * @returns Array of "YYYY-MM-DD" date strings.
 */
export function generateOccurrences(options: {
  startDate: string;        // "YYYY-MM-DD"
  dayOfWeek: number;        // 0-6 (0=Sun, 6=Sat)
  rruleString: string;      // e.g. "FREQ=WEEKLY;COUNT=12"
  holidays?: string[];      // dates to skip, e.g. ["2026-04-10"]
  effectiveUntil?: string;  // hard stop date "YYYY-MM-DD"
}): string[] {
  const { startDate, dayOfWeek, rruleString, holidays = [], effectiveUntil } = options;
  const rrule = parseRRule(rruleString);
  const interval = rrule.interval ?? 1;
  const holidaySet = new Set(holidays);

  // Determine the end condition
  const maxCount = rrule.count;

  // Determine the effective stop date: use the earlier of UNTIL and effectiveUntil
  let stopDate: string | undefined;
  if (rrule.until && effectiveUntil) {
    stopDate = rrule.until < effectiveUntil ? rrule.until : effectiveUntil;
  } else {
    stopDate = rrule.until ?? effectiveUntil;
  }

  // Early return if count is 0
  if (maxCount !== undefined && maxCount <= 0) {
    return [];
  }

  // Parse start date
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  let current = new Date(startYear!, startMonth! - 1, startDay!);

  // Adjust to the correct day of week if the start date isn't on the right day
  const currentDow = current.getDay();
  if (currentDow !== dayOfWeek) {
    let diff = dayOfWeek - currentDow;
    if (diff < 0) diff += 7;
    current.setDate(current.getDate() + diff);
  }

  const results: string[] = [];

  // Safety: prevent infinite loops — max 1000 iterations
  const MAX_ITERATIONS = 1000;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const dateStr = formatLocalDate(current);

    // Check hard stop date
    if (stopDate && dateStr > stopDate) {
      break;
    }

    // Skip holidays
    if (!holidaySet.has(dateStr)) {
      results.push(dateStr);

      // Check count limit
      if (maxCount !== undefined && results.length >= maxCount) {
        break;
      }
    }

    // Advance by interval weeks
    current.setDate(current.getDate() + 7 * interval);
  }

  return results;
}

/**
 * Format a local Date to "YYYY-MM-DD" using local time (not UTC).
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
