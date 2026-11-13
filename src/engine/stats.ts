import { addDays, weekStart, type DateKey } from './dates';
import type { AnswerRecord } from './types';

export function weekDays(today: DateKey): DateKey[] {
  const start = weekStart(today);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Days this week (Mon-Sun) with at least one answer. */
export function practiceDaysThisWeek(log: AnswerRecord[], today: DateKey): DateKey[] {
  const days = new Set(weekDays(today));
  return [...new Set(log.map((r) => r.date).filter((d) => days.has(d)))].sort();
}

export function minutesThisWeek(log: AnswerRecord[], today: DateKey): number {
  const days = new Set(weekDays(today));
  const ms = log.filter((r) => days.has(r.date)).reduce((sum, r) => sum + r.timeMs, 0);
  return Math.round(ms / 60000);
}

export function minutesOn(log: AnswerRecord[], day: DateKey): number {
  return Math.round(log.filter((r) => r.date === day).reduce((s, r) => s + r.timeMs, 0) / 60000);
}
