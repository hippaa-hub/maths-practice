import { addDays, type DateKey } from './dates';
import type { Box, Level, Outcome, SkillProgress, SkillState } from './types';

/** Days until the next review after a correct answer, by the box just reached. */
export const INTERVALS: Record<Exclude<Box, 0>, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
/** A skill already in box 5 that is answered correctly again comes back after this many days. */
export const MASTERED_REPEAT_INTERVAL = 30;
/** A skill counts as mastered only after correct answers on this many different days. */
export const MASTERY_MIN_DAYS = 3;
export const MAX_LEVEL: Level = 3;

export function newProgress(skillId: string): SkillProgress {
  return { skillId, box: 0, dueDate: '', level: 1, correctDays: [], streakCorrect: 0, streakMiss: 0 };
}

export function stateOf(p: SkillProgress): SkillState {
  if (p.box === 0) return 'new';
  if (p.box <= 2) return 'learning';
  if (p.box === 5 && p.correctDays.length >= MASTERY_MIN_DAYS) return 'mastered';
  return 'strong';
}

export function isDue(p: SkillProgress, today: DateKey): boolean {
  return p.box >= 1 && p.dueDate !== '' && p.dueDate <= today;
}

/** How many of the quick check's questions must be right to skip the lesson. */
export const CHECK_QUESTIONS = 3;
export const CHECK_PASS = 2;

/**
 * A quick check for a skill the class has already taught. Passing (2 of 3) moves it straight into
 * the review cycle at box 2, due in 2 days. Failing keeps box 0 and marks the lesson as next in line.
 */
export function completeCheck(p: SkillProgress, today: DateKey, correct: number): SkillProgress {
  if (p.box !== 0) return p;
  if (correct >= CHECK_PASS) {
    return { ...p, box: 2, dueDate: addDays(today, INTERVALS[2]), introducedDate: today, level: 1, checkDate: today, checkResult: 'pass' };
  }
  return { ...p, checkDate: today, checkResult: 'fail' };
}

/** Finishing the lesson moves a new skill into box 1, due tomorrow. */
export function completeLesson(p: SkillProgress, today: DateKey): SkillProgress {
  if (p.box !== 0) return p;
  return { ...p, box: 1, dueDate: addDays(today, 1), introducedDate: today, level: 1 };
}

/** Apply one Daily Mix answer to a skill. Pure: returns a new object. */
export function applyOutcome(p: SkillProgress, outcome: Outcome, today: DateKey): SkillProgress {
  if (p.box === 0) throw new Error(`Skill ${p.skillId} needs the lesson before it can be reviewed`);

  if (outcome === 'correct') {
    const wasMastered = p.box === 5;
    const box = (wasMastered ? 5 : p.box + 1) as Box;
    const gap = wasMastered ? MASTERED_REPEAT_INTERVAL : INTERVALS[box as Exclude<Box, 0>];
    const correctDays = p.correctDays.includes(today) ? p.correctDays : [...p.correctDays, today];
    let streakCorrect = p.streakCorrect + 1;
    let level = p.level;
    if (streakCorrect >= 2) {
      level = Math.min(MAX_LEVEL, level + 1) as Level;
      streakCorrect = 0;
    }
    return { ...p, box, dueDate: addDays(today, gap), correctDays, streakCorrect, streakMiss: 0, level };
  }

  if (outcome === 'hint') {
    // Box stays the same; the skill comes back tomorrow. Streaks are left alone.
    return { ...p, dueDate: addDays(today, 1) };
  }

  // miss
  const box = Math.max(1, p.box - 1) as Box;
  let streakMiss = p.streakMiss + 1;
  let level = p.level;
  if (streakMiss >= 2) {
    level = Math.max(1, level - 1) as Level;
    streakMiss = 0;
  }
  return { ...p, box, dueDate: addDays(today, 1), streakMiss, streakCorrect: 0, level, lastWrongDate: today };
}
