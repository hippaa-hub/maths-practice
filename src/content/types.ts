import type { AnswerSpec } from '../engine/answers';
import type { Rng } from '../engine/rng';
import type { Level, SkillMeta } from '../engine/types';

/** Pictures are described as data and drawn with SVG in src/ui/Picture.tsx. */
export type Picture =
  | {
      type: 'bar';
      /** Number of equal parts the bar is split into. */
      parts: number;
      /** How many parts are shaded (may be fractional, e.g. 2.5). */
      shaded: number;
      totalLabel?: string;
      shadedLabel?: string;
      partLabel?: string;
    }
  | { type: 'hundred'; shaded: number; label?: string }
  | { type: 'compare'; rows: { label: string; value: number; tone?: 'green' | 'blue' | 'orange' | 'purple' }[]; max?: number }
  | { type: 'doubleLine'; top: { label: string; values: number[] }; bottom: { label: string; values: number[] } }
  /** Matchstick or tile pattern: the first `terms` shapes of a growing pattern. */
  | { type: 'pattern'; shape: 'squares' | 'triangles' | 'dots' | 'tiles'; terms: number[]; labels?: string[] }
  | { type: 'table'; headers: string[]; rows: (string | number)[][] }
  /** Number line from min to max; `marks` are highlighted numbers, `arrow` draws a jump. */
  | { type: 'numberLine'; min: number; max: number; marks?: number[]; arrow?: { from: number; to: number } }
  /** Angle diagrams. 'line'/'point': the angles in order (degrees or a letter). 'triangle': three labels. */
  | { type: 'angles'; kind: 'line' | 'point' | 'triangle'; values: (number | string)[]; degrees?: number[] }
  /** Two parallel lines with a transversal; labels sit at an intersection ('top' or 'bottom') in a quadrant. */
  | { type: 'parallel'; labels: Array<{ at: 'top' | 'bottom'; q: 'UR' | 'UL' | 'LL' | 'LR'; text: string }> }
  | { type: 'solid'; kind: 'cube' | 'cuboid'; dims: [number, number, number]; unit?: string }
  | { type: 'triangleArea'; base: number; height: number; unit?: string };

export interface Example {
  problem: string;
  steps: string[];
  answer: string;
}

export type FadedStep =
  | { given: string }
  | { prompt: string; answer: AnswerSpec; answerText: string; hint?: string };

export interface Faded {
  problem: string;
  steps: FadedStep[];
}

export interface Trap {
  value: number;
  /** For ratio answers: the wrong ratio that matches this trap. */
  ratio?: number[];
  /** Key into Skill.misconceptions. */
  misconception: string;
  /** Optional message with the real numbers in it; falls back to the skill's generic message. */
  message?: string;
}

export interface Question {
  skillId: string;
  level: Level;
  text: string;
  answer: AnswerSpec;
  /** How the answer is shown in feedback, e.g. "24 GEL" or "7/20". */
  answerText: string;
  hint: string;
  steps: string[];
  picture?: Picture;
  traps: Trap[];
  /** The numbers the question was built from; tests recompute the answer from these. */
  params: Record<string, number>;
  /** For multiple-choice questions only. */
  choices?: string[];
}

export interface MistakeHunt {
  problem: string;
  steps: string[];
  /** Index of the wrong step. */
  wrongStep: number;
  reason: string;
  fixOptions: string[];
  correctFix: number;
}

export interface Skill {
  id: string;
  unit: number;
  order: number;
  title: string;
  /** A short name for chips and lists. */
  short: string;
  prerequisites: string[];
  explain: { sentences: string[]; rule: string; picture: Picture };
  examples: Example[];
  faded: Faded[];
  generate(level: Level, rng: Rng): Question;
  /** Recomputes the answer from the question's params, by a different route than the steps. */
  compute(params: Record<string, number>): number;
  mistakes: MistakeHunt[];
  misconceptions: Record<string, string>;
  /** The class has already covered this (SCHOOL.md): start with a quick check, not the lesson. */
  taught?: boolean;
  /** Minimum number of different question texts a level must produce (default 20). */
  variety?: number;
}

export function metaOf(s: Skill): SkillMeta {
  return { id: s.id, unit: s.unit, order: s.order, title: s.title, prerequisites: s.prerequisites, hasMistakes: s.mistakes.length > 0, taught: !!s.taught };
}
