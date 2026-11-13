/** A calendar day as 'YYYY-MM-DD'. The learning day starts at 04:00 local time. */
export type DateKey = string;

export const DAY_START_HOUR = 4;

const pad = (n: number) => String(n).padStart(2, '0');

/** The learning-day key for a moment in time (device local time, day starts 04:00). */
export function dateKeyOf(now: Date): DateKey {
  const shifted = new Date(now.getTime() - DAY_START_HOUR * 60 * 60 * 1000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

function toUtc(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(key: DateKey, n: number): DateKey {
  const dt = new Date(toUtc(key) + n * 86400000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

/** The Monday that starts the week containing `key`. */
export function weekStart(key: DateKey): DateKey {
  const dt = new Date(toUtc(key));
  const dow = dt.getUTCDay(); // 0 = Sunday
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(key, -back);
}

export function isValidDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}
