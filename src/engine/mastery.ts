import { addDays, daysBetween, weekStart, type DateKey } from './dates';
import { stateOf } from './spacing';
import type { ProgressMap, SkillMeta, SkillProgress } from './types';

/**
 * Progress she can see, measured in what she can do — not in points.
 *
 * A skill counts as one she CAN DO when it is strong or mastered (she has answered it right
 * on several different days, so it is in box 3 or higher). If she leaves it unpractised long
 * after it was due, it drops out of the count until the next review — so the number is honest.
 */
export const FADE_AFTER_DAYS = 7;

export function canDo(p: SkillProgress | undefined, today: DateKey): boolean {
  if (!p) return false;
  const state = stateOf(p);
  if (state !== 'strong' && state !== 'mastered') return false;
  return !(p.dueDate && daysBetween(p.dueDate, today) > FADE_AFTER_DAYS);
}

export function canDoCount(progress: ProgressMap, skills: SkillMeta[], today: DateKey): number {
  return skills.filter((s) => canDo(progress[s.id], today)).length;
}

/** Share of one unit's skills she can do, 0 to 1. */
export function unitShare(progress: ProgressMap, skills: SkillMeta[], unit: number, today: DateKey): number {
  const inUnit = skills.filter((s) => s.unit === unit);
  if (!inUnit.length) return 0;
  return inUnit.filter((s) => canDo(progress[s.id], today)).length / inUnit.length;
}

/** A level is reached when most of its unit is done. */
export const LEVEL_AT = 0.6;

/** The level map: one "I can…" per unit, in the order of the skill map. */
export const LEVELS: Array<{ unit: number; title: string; can: string }> = [
  { unit: 1, title: 'Percentages, ratio and rates', can: 'I can solve percentage, ratio and rate problems' },
  { unit: 2, title: 'Patterns and algebra', can: 'I can find the rule of a pattern and use a formula' },
  { unit: 0, title: 'Foundations', can: 'I can work with negatives, fractions and factors' },
  { unit: 4, title: 'Angles and area', can: 'I can find missing angles and areas' },
];

export function levelsReached(progress: ProgressMap, skills: SkillMeta[], today: DateKey): number {
  return LEVELS.filter((l) => unitShare(progress, skills, l.unit, today) >= LEVEL_AT).length;
}

/** Daily record of the count, so she can see it grow week by week. */
export type MasteryLog = Record<DateKey, number>;

export function logMastery(log: MasteryLog | undefined, count: number, today: DateKey): MasteryLog {
  if (log?.[today] === count) return log;
  return { ...log, [today]: count };
}

/** The count at the end of a given day (the last one logged on or before it). */
function countOn(log: MasteryLog | undefined, day: DateKey): number {
  const days = Object.keys(log ?? {}).filter((d) => d <= day).sort();
  return days.length ? log![days[days.length - 1]] : 0;
}

/** Skills added this week (since Monday). */
export function weekGain(log: MasteryLog | undefined, now: number, today: DateKey): number {
  return now - countOn(log, addDays(weekStart(today), -1));
}

/** The last few weeks, for a small chart: the count at the end of each week. */
export function weeklyCounts(log: MasteryLog | undefined, now: number, today: DateKey, weeks = 6): Array<{ week: DateKey; count: number }> {
  const thisWeek = weekStart(today);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    return { week: start, count: i === weeks - 1 ? now : countOn(log, addDays(start, 6)) };
  });
}
