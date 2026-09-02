import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatInTimeZone } from 'date-fns-tz';

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date in Asia/Karachi timezone (the event timezone) */
export function formatKarachi(date: Date | string, fmt: string): string {
  try {
    return formatInTimeZone(new Date(date), 'Asia/Karachi', fmt);
  } catch {
    return String(date);
  }
}

/** Format a fixture time as "HH:mm" in Karachi timezone */
export function fixtureTime(scheduledAt: string): string {
  try {
    return formatKarachi(scheduledAt, 'HH:mm');
  } catch {
    return scheduledAt.slice(11, 16);
  }
}

/** Format a fixture date as "EEE, d MMM" in Karachi timezone */
export function fixtureDate(scheduledAt: string): string {
  try {
    return formatKarachi(scheduledAt, 'EEE, d MMM');
  } catch {
    return scheduledAt.slice(0, 10);
  }
}

/** Return the event day number (1, 2, or 3) given a fixture's scheduled_at */
export function eventDay(scheduledAt: string): 1 | 2 | 3 | null {
  const eventDays: Record<string, 1 | 2 | 3> = {
    '2026-09-08': 1,
    '2026-09-09': 2,
    '2026-09-10': 3,
  };
  const dateKey = scheduledAt.slice(0, 10);
  return eventDays[dateKey] ?? null;
}

/** Return a CSS class for a fixture status border */
export function statusBorderClass(status: string): string {
  switch (status) {
    case 'live':
      return 'border-live-red';
    case 'completed':
      return 'border-win-green';
    default:
      return 'border-transparent';
  }
}
