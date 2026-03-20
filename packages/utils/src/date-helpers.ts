// Date helpers for Singapore timezone
// Uses Intl.DateTimeFormat — no external dependencies

const SG_TIMEZONE = 'Asia/Singapore';

/**
 * Parse a date string or Date into a Date object.
 */
function toDate(date: Date | string): Date {
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date;
}

/**
 * Get date parts in SG timezone using Intl.DateTimeFormat.
 */
function getSGParts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-SG', {
    timeZone: SG_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const result: Record<string, string> = {};
  for (const part of parts) {
    result[part.type] = part.value;
  }
  return result;
}

/**
 * Format a date to a string in SG timezone.
 *
 * Supported format tokens:
 * - "YYYY-MM-DD" (default)
 * - "DD/MM/YYYY"
 * - "DD MMM YYYY" (e.g. "03 Mar 2026")
 * - "long" — full readable format (e.g. "3 March 2026")
 */
export function formatDate(date: Date | string, format?: string): string {
  const d = toDate(date);
  const fmt = format ?? 'YYYY-MM-DD';

  if (fmt === 'long') {
    return new Intl.DateTimeFormat('en-SG', {
      timeZone: SG_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  const parts = getSGParts(d);
  const year = parts['year'] ?? '';
  const month = parts['month'] ?? '';
  const day = parts['day'] ?? '';

  switch (fmt) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'DD MMM YYYY': {
      const monthShort = new Intl.DateTimeFormat('en-SG', {
        timeZone: SG_TIMEZONE,
        month: 'short',
      }).format(d);
      return `${day} ${monthShort} ${year}`;
    }
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Format a time string like "14:00" to "2:00 PM".
 */
export function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);
  const minutes = minutesStr ?? '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes} ${period}`;
}

/**
 * Format a full datetime string in SG timezone.
 * Returns e.g. "3 Mar 2026, 2:00 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = toDate(date);
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: SG_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Check if a date is today in SG timezone.
 */
export function isToday(date: Date | string): boolean {
  const d = toDate(date);
  const now = new Date();
  const dateSG = toSGDate(d);
  const todaySG = toSGDate(now);
  return dateSG === todaySG;
}

/**
 * Check if a date is in the future (compared to now in SG timezone).
 */
export function isFutureDate(date: Date | string): boolean {
  const d = toDate(date);
  const now = new Date();
  const dateSG = toSGDate(d);
  const todaySG = toSGDate(now);
  return dateSG > todaySG;
}

/**
 * Get the day of week in SG timezone (0 = Sunday, 6 = Saturday).
 */
export function getDayOfWeek(date: Date | string): number {
  const d = toDate(date);
  const formatter = new Intl.DateTimeFormat('en-SG', {
    timeZone: SG_TIMEZONE,
    weekday: 'short',
  });
  const weekday = formatter.format(d);
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[weekday] ?? 0;
}

/**
 * Add days to a date, returning a new Date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a Date to "YYYY-MM-DD" in SG timezone.
 */
export function toSGDate(date: Date): string {
  const parts = getSGParts(date);
  const year = parts['year'] ?? '';
  const month = parts['month'] ?? '';
  const day = parts['day'] ?? '';
  return `${year}-${month}-${day}`;
}
