import { describe, expect, it } from 'vitest';
import { addDays, daysBetween } from './dates';
import { createRng } from './rng';
import { answerCurrent, finishLesson, isFinished, startSession } from './runtime';
import { buildSession } from './session';
import { newProgress, stateOf } from './spacing';
import type { ProgressMap, SkillMeta } from './types';

const START = '2026-11-12';
const SKILLS: SkillMeta[] = Array.from({ length: 8 }, (_, i) => ({
  id: `p${i}`, unit: 1, order: i, title: `Skill ${i}`, prerequisites: i ? [`p${i - 1}`] : [], hasMistakes: false, taught: false,
}));

/** Plays `days` days with a learner who answers every question the given way. */
function simulate(days: number, outcome: (skillId: string, day: number) => 'correct' | 'hint' | 'miss') {
  let progress: ProgressMap = Object.fromEntries(SKILLS.map((s) => [s.id, newProgress(s.id)]));
  const seen: Record<string, string[]> = {};
  for (let d = 0; d < days; d++) {
    const today = addDays(START, d);
    const items = buildSession({ skills: SKILLS, progress, log: [], today, rng: createRng(d + 1), options: { mistakeHunts: 0 } });
    let s = startSession(`day${d}`, today, items, 0);
    while (!isFinished(s)) {
      const item = s.items[s.index];
      (seen[item.skillId] ??= []).push(today);
      if (item.kind === 'lesson') {
        const r = finishLesson(s, progress); s = r.session; progress = r.progress;
      } else {
        const r = answerCurrent(s, progress, outcome(item.skillId, d), { level: 1, timeMs: 0 });
        s = r.session; progress = r.progress;
      }
    }
  }
  return { progress, seen };
}

describe('14 days of use', () => {
  it('a skill answered correctly every time returns after 1, 2, 4 and 8 days', () => {
    const { seen, progress } = simulate(16, () => 'correct');
    // p0 is taught on day 0, then reviewed on days 1, 3, 7, 15.
    const gaps = seen.p0.slice(1).map((d, i) => daysBetween(seen.p0[i], d));
    expect(gaps.slice(0, 4)).toEqual([1, 2, 4, 8]);
    expect(seen.p0[0]).toBe(START);
    expect(progress.p0.box).toBe(5);
    expect(stateOf(progress.p0)).toBe('mastered');
    expect(progress.p0.dueDate).toBe(addDays(seen.p0[4], 16));
  });

  it('a skill that is always missed stays in box 1 and comes back every day', () => {
    const { seen, progress } = simulate(14, (id) => (id === 'p0' ? 'miss' : 'correct'));
    expect(progress.p0.box).toBe(1);
    const days = [...new Set(seen.p0)];
    expect(days.length).toBe(14);
    // Each miss day shows the skill twice (the retry).
    expect(seen.p0.filter((d) => d === addDays(START, 1))).toHaveLength(2);
  });

  it('introduces at most 2 new skills a day and only after prerequisites reach box 2', () => {
    const { progress } = simulate(14, () => 'correct');
    const intro = Object.values(progress).filter((p) => p.introducedDate).map((p) => p.introducedDate!);
    const perDay = new Map<string, number>();
    intro.forEach((d) => perDay.set(d, (perDay.get(d) ?? 0) + 1));
    for (const n of perDay.values()) expect(n).toBeLessThanOrEqual(2);
    for (const s of SKILLS) {
      for (const pre of s.prerequisites) {
        if (progress[s.id].introducedDate) expect(progress[pre].introducedDate! < progress[s.id].introducedDate!).toBe(true);
      }
    }
    // Each skill needs its prerequisite at box 2, which takes a lesson day plus one correct day,
    // so a chain unlocks one new skill every second day: days 0,2,4,...,12 = 7 skills.
    expect(intro.length).toBe(7);
  });

  it('never shows the same skill twice in a row in any session', () => {
    let progress: ProgressMap = Object.fromEntries(SKILLS.map((s) => [s.id, newProgress(s.id)]));
    for (let d = 0; d < 14; d++) {
      const today = addDays(START, d);
      const items = buildSession({ skills: SKILLS, progress, log: [], today, rng: createRng(d), options: { mistakeHunts: 0 } });
      for (let i = 1; i < items.length; i++) expect(items[i].skillId).not.toBe(items[i - 1].skillId);
      let s = startSession(`d${d}`, today, items, 0);
      while (!isFinished(s)) {
        const item = s.items[s.index];
        if (item.kind === 'lesson') { const r = finishLesson(s, progress); s = r.session; progress = r.progress; }
        else { const r = answerCurrent(s, progress, d % 3 === 0 ? 'miss' : 'correct', { level: 1, timeMs: 0 }); s = r.session; progress = r.progress; }
      }
      for (let i = 1; i < s.items.length; i++) expect(s.items[i].skillId).not.toBe(s.items[i - 1].skillId);
    }
  });
});
