import { describe, expect, it } from 'vitest';
import { earnedBadges } from './badges';
import { newProgress } from './spacing';
import type { AnswerRecord, ProgressMap, SkillMeta } from './types';
import { XP, levelFor, totalXp, xpForRecord } from './xp';

const rec = (over: Partial<AnswerRecord>): AnswerRecord => ({
  skillId: 's', date: '2026-11-12', level: 1, correct: true, hintUsed: false, timeMs: 1000, sessionId: 'x', source: 'mix', ...over,
});

describe('XP', () => {
  it('gives XP for effort, more for correct answers, and extra for a corrected mistake', () => {
    expect(xpForRecord(rec({}))).toBe(XP.correct);
    expect(xpForRecord(rec({ hintUsed: true }))).toBe(XP.withHint);
    expect(xpForRecord(rec({ correct: false }))).toBe(XP.effort);
    expect(xpForRecord(rec({ retry: true }))).toBe(XP.corrected);
    expect(xpForRecord(rec({ source: 'mistakeHunt' }))).toBe(XP.mistakeHunt);
    expect(xpForRecord(rec({ source: 'lesson' }))).toBe(XP.lessonDone);
  });
  it('never goes down: every record adds XP, a finished mix adds a bonus', () => {
    const log = [rec({}), rec({ correct: false }), rec({ correct: false, source: 'faded' })];
    const xp = totalXp(log, [{ id: 'x', date: '2026-11-12', mode: 'mix', finished: true, questions: 2, minutes: 1 }]);
    expect(xp).toBe(XP.correct + XP.effort + XP.effort + XP.sessionDone);
    for (const r of log) expect(xpForRecord(r)).toBeGreaterThan(0);
  });
  it('levels need 100, 300, 600 ... XP', () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, needed: 100 });
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100)).toEqual({ level: 2, into: 0, needed: 200 });
    expect(levelFor(650)).toEqual({ level: 4, into: 50, needed: 400 });
  });
});

describe('badges', () => {
  const skills: SkillMeta[] = Array.from({ length: 12 }, (_, i) => ({ id: `s${i}`, unit: 1, order: i, title: `S${i}`, prerequisites: [], hasMistakes: true, taught: false }));
  it('are earned from the record and never from a stored counter', () => {
    const progress: ProgressMap = Object.fromEntries(skills.map((s) => [s.id, newProgress(s.id)]));
    for (let i = 0; i < 10; i++) progress[`s${i}`] = { ...progress[`s${i}`], box: 3, dueDate: '2026-11-20' };
    progress.s0 = { ...progress.s0, box: 5, correctDays: ['a', 'b', 'c'] };
    const log: AnswerRecord[] = [];
    for (let d = 1; d <= 7; d++) log.push(rec({ date: `2026-11-0${d}` }));
    for (let i = 0; i < 5; i++) log.push(rec({ source: 'mistakeHunt' }));
    log.push(rec({ correct: false }), rec({ retry: true }));
    const got = earnedBadges({ log, progress, skills, sessions: [{ id: 'x', date: '2026-11-01', mode: 'mix', finished: true, questions: 1, minutes: 1 }] });
    expect([...got].sort()).toEqual(['comeback', 'days-7', 'first-mastered', 'first-mix', 'fix-5', 'five-strong', 'ten-strong', 'week-goal'].sort());
  });
  it('gives the unit badge once every skill in the unit has been learned', () => {
    const progress: ProgressMap = Object.fromEntries(skills.map((s) => [s.id, { ...newProgress(s.id), box: 1 as const, dueDate: '2026-11-13' }]));
    expect(earnedBadges({ log: [], sessions: [], progress, skills }).has('unit-1')).toBe(true);
    progress.s3 = newProgress('s3');
    expect(earnedBadges({ log: [], sessions: [], progress, skills }).has('unit-1')).toBe(false);
  });
});
