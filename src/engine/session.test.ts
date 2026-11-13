import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { createRng } from './rng';
import { answerCurrent, finishCheck, finishLesson, startSession, summarise } from './runtime';
import { buildSession, constrainedShuffle, insertRetry, unlockedNewSkills, type SessionItem } from './session';
import { newProgress } from './spacing';
import type { ProgressMap, SkillMeta, SkillProgress } from './types';

const T = '2026-11-12';

function skill(id: string, unit: number, order: number, prerequisites: string[] = []): SkillMeta {
  return { id, unit, order, title: id, prerequisites, hasMistakes: true, taught: false };
}
const SKILLS: SkillMeta[] = [
  ...Array.from({ length: 10 }, (_, i) => skill(`u1-${i}`, 1, i, i ? [`u1-${i - 1}`] : [])),
  ...Array.from({ length: 6 }, (_, i) => skill(`u2-${i}`, 2, i, i ? [`u2-${i - 1}`] : [])),
];
function prog(overrides: Record<string, Partial<SkillProgress>>): ProgressMap {
  const map: ProgressMap = {};
  for (const s of SKILLS) map[s.id] = { ...newProgress(s.id), ...overrides[s.id] };
  return map;
}
const build = (progress: ProgressMap, seed = 1, options = {}) =>
  buildSession({ skills: SKILLS, progress, log: [], today: T, rng: createRng(seed), options });

describe('building the Daily Mix', () => {
  it('takes due skills oldest first, at most 8', () => {
    const over: Record<string, Partial<SkillProgress>> = {};
    SKILLS.forEach((s, i) => { over[s.id] = { box: 2, dueDate: addDays(T, -i) }; });
    const items = build(prog(over), 1, { mistakeHunts: 0 });
    const due = items.filter((i) => i.reason === 'due');
    expect(due).toHaveLength(8);
    // The 8 oldest are the last 8 skills (due 8..15 days ago).
    const expected = SKILLS.slice(-8).map((s) => s.id).sort();
    expect(due.map((i) => i.skillId).sort()).toEqual(expected);
  });

  it('skips skills that are not yet due', () => {
    const items = build(prog({ 'u1-0': { box: 3, dueDate: addDays(T, 1) }, 'u1-1': { box: 3, dueDate: T } }));
    expect(items.map((i) => i.skillId)).toContain('u1-1');
    expect(items.map((i) => i.skillId)).not.toContain('u1-0');
  });

  it('adds up to two box-1 skills missed in the last 3 days', () => {
    const items = build(prog({
      'u1-0': { box: 1, dueDate: addDays(T, 3), lastWrongDate: addDays(T, -1) },
      'u1-1': { box: 1, dueDate: addDays(T, 3), lastWrongDate: addDays(T, -2) },
      'u1-2': { box: 1, dueDate: addDays(T, 3), lastWrongDate: addDays(T, -3) },
      'u1-3': { box: 1, dueDate: addDays(T, 3), lastWrongDate: addDays(T, -9) },
      'u1-4': { box: 2, dueDate: addDays(T, 3), lastWrongDate: addDays(T, -1) },
    }));
    const wrong = items.filter((i) => i.reason === 'recentWrong').map((i) => i.skillId);
    expect(wrong.sort()).toEqual(['u1-0', 'u1-1']);
  });

  it('introduces one new skill when fewer than 6 are due, and never more than 2 a day', () => {
    const fresh = build(prog({}));
    expect(fresh.filter((i) => i.kind === 'lesson').map((i) => i.skillId)).toEqual(['u1-0']);

    const twoToday = build(prog({
      'u1-0': { box: 1, dueDate: addDays(T, 1), introducedDate: T },
      'u1-1': { box: 1, dueDate: addDays(T, 1), introducedDate: T },
    }));
    expect(twoToday.filter((i) => i.kind === 'lesson')).toHaveLength(0);

    const over: Record<string, Partial<SkillProgress>> = {};
    for (let i = 0; i < 6; i++) over[`u1-${i}`] = { box: 2, dueDate: addDays(T, -1) };
    const busy = build(prog(over));
    expect(busy.filter((i) => i.kind === 'lesson')).toHaveLength(0);
  });

  it('unlocks a skill only when its prerequisites are at box 2 or higher', () => {
    expect(unlockedNewSkills(SKILLS, prog({})).map((s) => s.id)).toEqual(['u1-0', 'u2-0']);
    const p = prog({ 'u1-0': { box: 1, dueDate: T } });
    expect(unlockedNewSkills(SKILLS, p).map((s) => s.id)).toEqual(['u2-0']);
    const q = prog({ 'u1-0': { box: 2, dueDate: T } });
    expect(unlockedNewSkills(SKILLS, q).map((s) => s.id).sort()).toEqual(['u1-1', 'u2-0']);
  });

  it('turns one question into a Mistake Hunt by default, none when asked', () => {
    const over: Record<string, Partial<SkillProgress>> = {};
    for (let i = 0; i < 6; i++) over[`u1-${i}`] = { box: 2, dueDate: addDays(T, -1) };
    expect(build(prog(over)).filter((i) => i.kind === 'mistakeHunt')).toHaveLength(1);
    expect(build(prog(over), 1, { mistakeHunts: 2 }).filter((i) => i.kind === 'mistakeHunt')).toHaveLength(2);
    expect(build(prog(over), 1, { mistakeHunts: 0 }).filter((i) => i.kind === 'mistakeHunt')).toHaveLength(0);
  });

  it('caps a session at 12 items, keeping the lesson and recent-wrong items', () => {
    const over: Record<string, Partial<SkillProgress>> = {};
    SKILLS.forEach((s) => { over[s.id] = { box: 2, dueDate: addDays(T, -1) }; });
    over['u2-5'] = { box: 1, dueDate: addDays(T, 2), lastWrongDate: addDays(T, -1) };
    const items = build(prog(over), 3, { maxDue: 20, minDueBeforeNew: 99 });
    expect(items.length).toBeLessThanOrEqual(12);
    expect(items.map((i) => i.skillId)).toContain('u2-5');
  });
});

describe('ordering', () => {
  const unit = (id: string) => (id.startsWith('u1') ? 1 : 2);
  const mk = (ids: string[]): SessionItem[] => ids.map((id, i) => ({ id: String(i), skillId: id, unit: unit(id), kind: 'question', reason: 'due' }));

  it('never puts two questions of the same skill next to each other (200 seeds)', () => {
    const items = mk(['u1-0', 'u1-1', 'u1-2', 'u2-0', 'u2-1', 'u1-3', 'u2-2', 'u1-4']);
    for (let seed = 0; seed < 200; seed++) {
      const out = constrainedShuffle(items, createRng(seed));
      expect(out).toHaveLength(items.length);
      for (let i = 1; i < out.length; i++) expect(out[i].skillId).not.toBe(out[i - 1].skillId);
    }
  });

  it('avoids three in a row from one unit when that is possible', () => {
    const items = mk(['u1-0', 'u1-1', 'u1-2', 'u1-3', 'u2-0', 'u2-1', 'u2-2']);
    for (let seed = 0; seed < 100; seed++) {
      const out = constrainedShuffle(items, createRng(seed));
      for (let i = 2; i < out.length; i++) {
        expect(out[i].unit === out[i - 1].unit && out[i].unit === out[i - 2].unit).toBe(false);
      }
    }
  });

  it('puts the lesson first', () => {
    const items = mk(['u1-0', 'u1-1', 'u1-2']);
    items[2].kind = 'lesson';
    expect(constrainedShuffle(items, createRng(5))[0].kind).toBe('lesson');
  });

  it('whole sessions obey the neighbour rule (100 seeds)', () => {
    const over: Record<string, Partial<SkillProgress>> = {};
    SKILLS.forEach((s, i) => { over[s.id] = { box: 2, dueDate: addDays(T, -(i % 4)) }; });
    for (let seed = 0; seed < 100; seed++) {
      const out = build(prog(over), seed);
      for (let i = 1; i < out.length; i++) expect(out[i].skillId).not.toBe(out[i - 1].skillId);
    }
  });
});

describe('retries and the running session', () => {
  const mk = (ids: string[]): SessionItem[] => ids.map((id, i) => ({ id: String(i), skillId: id, unit: 1, kind: 'question', reason: 'due' }));

  it('a missed skill comes back later in the same session, never next to itself', () => {
    const items = mk(['a', 'b', 'c', 'a2']);
    const out = insertRetry(items, 0, items[0]);
    expect(out.map((i) => i.skillId)).toEqual(['a', 'b', 'c', 'a2', 'a']);
    const tail = insertRetry(mk(['a', 'b', 'c']), 2, mk(['c'])[0]);
    expect(tail.map((i) => i.skillId)).toEqual(['a', 'b', 'c', 'c'].slice(0, 3).concat('c')); // placed at the end, two apart is impossible so end
    const mid = insertRetry(mk(['a', 'b', 'c', 'd']), 3, mk(['d'])[0]);
    expect(mid.map((i) => i.skillId)).toEqual(['a', 'b', 'c', 'd', 'd']);
  });

  it('answering moves boxes, logs the answer and retries a miss once', () => {
    const items = mk(['a', 'b', 'c']);
    let progress: ProgressMap = {
      a: { ...newProgress('a'), box: 2, dueDate: T },
      b: { ...newProgress('b'), box: 1, dueDate: T },
      c: { ...newProgress('c'), box: 4, dueDate: T },
    };
    let s = startSession('s1', T, items, 0);
    let r = answerCurrent(s, progress, 'miss', { level: 1, timeMs: 1000 });
    s = r.session; progress = r.progress;
    expect(progress.a.box).toBe(1);
    expect(s.items.map((i) => i.skillId)).toEqual(['a', 'b', 'c', 'a']);
    expect(r.record).toMatchObject({ skillId: 'a', correct: false, hintUsed: false, source: 'mix' });

    r = answerCurrent(s, progress, 'hint', { level: 1, timeMs: 1000 });
    s = r.session; progress = r.progress;
    expect(progress.b.box).toBe(1);
    expect(r.record).toMatchObject({ correct: true, hintUsed: true });

    r = answerCurrent(s, progress, 'correct', { level: 2, timeMs: 1000 });
    s = r.session; progress = r.progress;
    expect(progress.c.box).toBe(5);

    r = answerCurrent(s, progress, 'miss', { level: 1, timeMs: 1000 });
    s = r.session; progress = r.progress;
    expect(s.items).toHaveLength(4); // no second retry for the same skill
    expect(s.index).toBe(4);

    const sum = summarise(s, progress);
    expect(sum.stronger).toEqual(['c']);
    expect(sum.weaker).toEqual(['a']);
    expect(sum.rememberSkill).toBe('a');
    expect(sum.answered).toBe(4);
    expect(sum.correct).toBe(2);
  });

  it('finishing a lesson moves the skill to box 1', () => {
    const items: SessionItem[] = [{ id: 'l', skillId: 'n', unit: 1, kind: 'lesson', reason: 'new' }];
    const s = startSession('s', T, items, 0);
    const r = finishLesson(s, { n: newProgress('n') });
    expect(r.progress.n.box).toBe(1);
    expect(r.progress.n.dueDate).toBe(addDays(T, 1));
    expect(summarise(r.session, r.progress).newlyLearned).toEqual(['n']);
  });
});

describe('quick checks for skills the class already taught', () => {
  const taught: SkillMeta[] = [
    { id: 't1', unit: 1, order: 1, title: 't1', prerequisites: [], hasMistakes: true, taught: true },
    { id: 't2', unit: 1, order: 2, title: 't2', prerequisites: ['t1'], hasMistakes: true, taught: true },
    { id: 't3', unit: 1, order: 3, title: 't3', prerequisites: ['t2'], hasMistakes: true, taught: true },
    { id: 'n1', unit: 2, order: 4, title: 'n1', prerequisites: [], hasMistakes: true, taught: false },
  ];
  const fresh = (): ProgressMap => Object.fromEntries(taught.map((s) => [s.id, newProgress(s.id)]));
  const buildT = (progress: ProgressMap) => buildSession({ skills: taught, progress, log: [], today: T, rng: createRng(1), options: { mistakeHunts: 0 } });

  it('adds up to 2 checks a day, ignoring prerequisites, and a lesson for the new-unit skill', () => {
    const items = buildT(fresh());
    expect(items.filter((i) => i.kind === 'check').map((i) => i.skillId)).toEqual(['t1', 't2']);
    expect(items.filter((i) => i.kind === 'lesson').map((i) => i.skillId)).toEqual(['n1']);
    // checks and lessons come before the questions
    expect(items[0].kind).not.toBe('question');
  });

  it('a passed check puts the skill at box 2, due in 2 days; a failed one queues the lesson first', () => {
    let progress = fresh();
    const items = buildT(progress);
    let s = startSession('s', T, items, 0);
    // first item: lesson n1 or check t1 depending on order; handle both
    for (let i = 0; i < items.length; i++) {
      const item = s.items[s.index];
      if (item.kind === 'lesson') { const r = finishLesson(s, progress); s = r.session; progress = r.progress; }
      else if (item.kind === 'check') {
        const r = finishCheck(s, progress, item.skillId === 't1' ? 3 : 1);
        s = r.session; progress = r.progress;
        expect(r.passed).toBe(item.skillId === 't1');
      }
    }
    expect(progress.t1.box).toBe(2);
    expect(progress.t1.dueDate).toBe(addDays(T, 2));
    expect(progress.t2.box).toBe(0);
    expect(progress.t2.checkResult).toBe('fail');
    expect(summarise(s, progress).checked).toEqual(['t1']);
    expect(summarise(s, progress).weaker).toEqual(['t2']);

    // Same day: no more checks (2 used). Next day: t2's lesson comes before any other new skill, t3 gets checked.
    expect(buildT(progress).filter((i) => i.kind === 'check')).toHaveLength(0);
    const tomorrow = addDays(T, 1);
    const next = buildSession({ skills: taught, progress, log: [], today: tomorrow, rng: createRng(2), options: { mistakeHunts: 0 } });
    expect(next.filter((i) => i.kind === 'lesson').map((i) => i.skillId)).toEqual(['t2']);
    expect(next.filter((i) => i.kind === 'check').map((i) => i.skillId)).toEqual(['t3']);
  });

  it('a taught skill never gets a lesson before its check', () => {
    expect(unlockedNewSkills(taught, fresh()).map((s) => s.id)).toEqual(['n1']);
  });
});
