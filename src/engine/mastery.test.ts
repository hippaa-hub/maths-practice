import { describe, expect, it } from 'vitest';
import { canDo, canDoCount, FADE_AFTER_DAYS, LEVEL_AT, LEVELS, levelsReached, logMastery, unitShare, weekGain, weeklyCounts } from './mastery';
import { addDays } from './dates';
import { newProgress } from './spacing';
import type { ProgressMap, SkillMeta, SkillProgress } from './types';

const meta = (id: string, unit: number): SkillMeta => ({ id, unit, order: 1, title: id, prerequisites: [], hasMistakes: false, taught: false });
const at = (id: string, box: SkillProgress['box'], dueDate: string, correctDays: string[] = []): SkillProgress => ({ ...newProgress(id), box, dueDate, correctDays });
const today = '2026-11-18'; // a Wednesday

describe('skills she can do', () => {
  it('counts strong and mastered skills, not learning ones', () => {
    expect(canDo(at('a', 2, today), today)).toBe(false);
    expect(canDo(at('a', 3, addDays(today, 3)), today)).toBe(true);
    expect(canDo(at('a', 5, addDays(today, 20), ['d1', 'd2', 'd3']), today)).toBe(true);
    expect(canDo(undefined, today)).toBe(false);
  });

  it('a strong skill left long after it was due drops out until it is reviewed', () => {
    expect(canDo(at('a', 4, addDays(today, -FADE_AFTER_DAYS)), today)).toBe(true);
    expect(canDo(at('a', 4, addDays(today, -FADE_AFTER_DAYS - 1)), today)).toBe(false);
  });

  it('levels open at 60% of a unit', () => {
    const skills = [meta('a', 1), meta('b', 1), meta('c', 1), meta('d', 1), meta('e', 1), meta('x', 2)];
    const progress: ProgressMap = { a: at('a', 3, today), b: at('b', 3, today), c: at('c', 3, today) };
    expect(canDoCount(progress, skills, today)).toBe(3);
    expect(unitShare(progress, skills, 1, today)).toBeCloseTo(0.6);
    expect(unitShare(progress, skills, 1, today)).toBeGreaterThanOrEqual(LEVEL_AT);
    expect(levelsReached(progress, skills, today)).toBe(1);
    expect(LEVELS.map((l) => l.unit)).toEqual([1, 2, 0, 4]);
  });

  it('remembers the count by day and shows the gain since Monday', () => {
    let log = logMastery(undefined, 2, '2026-11-15'); // Sunday of last week
    log = logMastery(log, 4, '2026-11-17');
    expect(weekGain(log, 5, today)).toBe(3);
    const weeks = weeklyCounts(log, 5, today, 3);
    expect(weeks.map((w) => w.count)).toEqual([0, 2, 5]);
    expect(logMastery(log, 4, '2026-11-17')).toBe(log);
  });
});
