import type { DateKey } from './dates';

export type SkillId = string;
export type Box = 0 | 1 | 2 | 3 | 4 | 5;
export type Level = 1 | 2 | 3;
export type SkillState = 'new' | 'learning' | 'strong' | 'mastered';
export type Outcome = 'correct' | 'hint' | 'miss';

/** What the engine needs to know about a skill (the full content lives in src/content). */
export interface SkillMeta {
  id: SkillId;
  unit: number;
  /** Position inside the unit; new skills are introduced in this order. */
  order: number;
  title: string;
  prerequisites: SkillId[];
  /** True when the skill has Mistake Hunt material. */
  hasMistakes: boolean;
  /**
   * True when the class has already covered this skill (see SCHOOL.md). Taught skills start with a
   * quick check instead of the full lesson, and the check ignores prerequisites.
   */
  taught: boolean;
}

/** Where one skill stands for this learner. */
export interface SkillProgress {
  skillId: SkillId;
  box: Box;
  /** Day the skill is next due. Empty while box is 0. */
  dueDate: DateKey | '';
  level: Level;
  /** Distinct days with a correct, no-hint answer. */
  correctDays: DateKey[];
  streakCorrect: number;
  streakMiss: number;
  lastWrongDate?: DateKey;
  /** Day the lesson was completed (box 0 -> 1), or the quick check was passed (box 0 -> 2). */
  introducedDate?: DateKey;
  /** Day of the last quick check and how it went. A failed check puts the full lesson first in line. */
  checkDate?: DateKey;
  checkResult?: 'pass' | 'fail';
}

/** One line of the answer log. Both the engine and the parent view read from this. */
export interface AnswerRecord {
  skillId: SkillId;
  date: DateKey;
  level: Level;
  correct: boolean;
  hintUsed: boolean;
  timeMs: number;
  misconception?: string;
  sessionId: string;
  /**
   * Where the answer came from. 'mix' moves the box; 'solo' and 'faded' come from the lesson flow;
   * 'practice' is extra practice from the skill map (no box change); 'mistakeHunt' is a Mistake Hunt;
   * 'lesson' marks a finished lesson.
   */
  source: 'mix' | 'solo' | 'faded' | 'practice' | 'mistakeHunt' | 'lesson' | 'check';
  /** True when this was the second go at a skill missed earlier in the same session. */
  retry?: boolean;
}

export type ProgressMap = Record<SkillId, SkillProgress>;
