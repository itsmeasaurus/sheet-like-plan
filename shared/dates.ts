import type { DayFilter, IsoDate } from './types.js';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

// All date math runs in UTC so the result never depends on the machine's timezone
export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function toIsoDate(year: number, monthIndex: number, day: number): IsoDate {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseIsoDate(date: IsoDate): { year: number; monthIndex: number; day: number } {
  const [year, month, day] = date.split('-').map(Number);
  return { year, monthIndex: month - 1, day };
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { year, monthIndex, day } = parseIsoDate(value);
  return monthIndex >= 0 && monthIndex < 12 && day >= 1 && day <= daysInMonth(year, monthIndex);
}

function toUtcMs(date: IsoDate): number {
  const { year, monthIndex, day } = parseIsoDate(date);
  return Date.UTC(year, monthIndex, day);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function isWeekend(date: IsoDate): boolean {
  const dayOfWeek = new Date(toUtcMs(date)).getUTCDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function matchesDayFilter(date: IsoDate, days: DayFilter): boolean {
  return days === 'all' || (days === 'weekends') === isWeekend(date);
}

// Inclusive on both ends; an inverted range yields no dates
export function expandRange(from: IsoDate, to: IsoDate, days: DayFilter): IsoDate[] {
  const result: IsoDate[] = [];
  for (let ms = toUtcMs(from); ms <= toUtcMs(to); ms += DAY_MS) {
    const date = new Date(ms).toISOString().slice(0, 10);
    if (matchesDayFilter(date, days)) result.push(date);
  }
  return result;
}
