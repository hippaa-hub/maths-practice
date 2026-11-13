import type { AnswerRecord } from './types';

/**
 * XP is never stored and never taken away: it is always recomputed from the answer log and the
 * list of finished sessions, so nothing a learner does can make it go down.
 */
export const XP = {
  correct: 10,
  withHint: 7,
  /** Effort XP for a miss: she still tried, and the method was shown. */
  effort: 3,
  /** A retry answered correctly after a miss: a corrected mistake. */
  corrected: 10,
  mistakeHunt: 12,
  faded: 4,
  lessonDone: 20,
  sessionDone: 25,
};

export interface SessionRecord {
  id: string;
  date: string;
  /** 'mix' is the Daily Mix; 'lesson' and 'practice' come from the skill map. */
  mode: 'mix' | 'lesson' | 'practice';
  finished: boolean;
  questions: number;
  minutes: number;
}

export function xpForRecord(r: AnswerRecord): number {
  if (r.source === 'faded') return r.correct ? XP.faded : XP.effort;
  if (r.source === 'mistakeHunt') return r.correct ? XP.mistakeHunt : XP.effort;
  if (r.source === 'lesson') return XP.lessonDone;
  if (!r.correct) return XP.effort;
  if (r.retry) return XP.corrected;
  return r.hintUsed ? XP.withHint : XP.correct;
}

export function totalXp(log: AnswerRecord[], sessions: SessionRecord[]): number {
  const fromAnswers = log.reduce((sum, r) => sum + xpForRecord(r), 0);
  const fromSessions = sessions.filter((s) => s.finished && s.mode === 'mix').length * XP.sessionDone;
  return fromAnswers + fromSessions;
}

/** XP needed to reach a level: 100, 300, 600, 1000, ... (level 1 starts at 0). */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) * level;
}

export function levelFor(xp: number): { level: number; into: number; needed: number } {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  return { level, into: xp - base, needed: xpForLevel(level + 1) - base };
}
