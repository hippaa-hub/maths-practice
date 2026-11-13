import { describe, expect, it } from 'vitest';
import { addDays } from './dates';
import { applyOutcome, completeLesson, newProgress, stateOf } from './spacing';
import type { SkillProgress } from './types';

const T = '2026-11-12';
const at = (box: SkillProgress['box'], extra: Partial<SkillProgress> = {}): SkillProgress => ({
  ...newProgress('s'), box, dueDate: T, ...extra,
});

describe('boxes and gaps', () => {
  it('a new skill needs the lesson first', () => {
    expect(() => applyOutcome(newProgress('s'), 'correct', T)).toThrow();
    const p = completeLesson(newProgress('s'), T);
    expect(p.box).toBe(1);
    expect(p.dueDate).toBe(addDays(T, 1));
    expect(p.introducedDate).toBe(T);
  });

  it.each([
    [1, 2, 2],
    [2, 3, 4],
    [3, 4, 8],
    [4, 5, 16],
  ] as const)('correct with no hint moves box %i to %i, due in %i days', (from, to, gap) => {
    const p = applyOutcome(at(from), 'correct', T);
    expect(p.box).toBe(to);
    expect(p.dueDate).toBe(addDays(T, gap));
  });

  it('a mastered skill answered correctly comes back after 30 days', () => {
    const p = applyOutcome(at(5), 'correct', T);
    expect(p.box).toBe(5);
    expect(p.dueDate).toBe(addDays(T, 30));
  });

  it('correct after a hint keeps the box and returns tomorrow', () => {
    const p = applyOutcome(at(3), 'hint', T);
    expect(p.box).toBe(3);
    expect(p.dueDate).toBe(addDays(T, 1));
    expect(p.correctDays).toEqual([]);
  });

  it('a miss drops one box, never below 1, and returns tomorrow', () => {
    expect(applyOutcome(at(3), 'miss', T).box).toBe(2);
    expect(applyOutcome(at(1), 'miss', T).box).toBe(1);
    expect(applyOutcome(at(1), 'miss', T).dueDate).toBe(addDays(T, 1));
    expect(applyOutcome(at(1), 'miss', T).lastWrongDate).toBe(T);
  });
});

describe('mastery', () => {
  it('needs box 5 and correct answers on 3 different days', () => {
    expect(stateOf(at(5, { correctDays: ['a', 'b'] }))).toBe('strong');
    expect(stateOf(at(5, { correctDays: ['a', 'b', 'c'] }))).toBe('mastered');
    expect(stateOf(at(4, { correctDays: ['a', 'b', 'c', 'd'] }))).toBe('strong');
    expect(stateOf(at(2))).toBe('learning');
    expect(stateOf(at(0))).toBe('new');
  });
  it('counts each day once', () => {
    let p = at(1);
    p = applyOutcome(p, 'correct', T);
    p = applyOutcome(p, 'correct', T);
    expect(p.correctDays).toEqual([T]);
  });
});

describe('difficulty level', () => {
  it('goes up after 2 correct in a row and down after 2 misses in a row', () => {
    let p = at(2);
    p = applyOutcome(p, 'correct', T);
    expect(p.level).toBe(1);
    p = applyOutcome(p, 'correct', addDays(T, 2));
    expect(p.level).toBe(2);
    p = applyOutcome(p, 'miss', addDays(T, 6));
    expect(p.level).toBe(2);
    p = applyOutcome(p, 'miss', addDays(T, 7));
    expect(p.level).toBe(1);
  });
  it('a miss breaks the correct streak', () => {
    let p = at(2);
    p = applyOutcome(p, 'correct', T);
    p = applyOutcome(p, 'miss', addDays(T, 2));
    p = applyOutcome(p, 'correct', addDays(T, 3));
    expect(p.level).toBe(1);
  });
  it('never goes above 3 or below 1', () => {
    let p = at(2, { level: 3, streakCorrect: 1 });
    p = applyOutcome(p, 'correct', T);
    expect(p.level).toBe(3);
    let q = at(2, { level: 1, streakMiss: 1 });
    q = applyOutcome(q, 'miss', T);
    expect(q.level).toBe(1);
  });
});
