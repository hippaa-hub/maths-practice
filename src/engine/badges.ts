import { weekStart, type DateKey } from './dates';
import { stateOf } from './spacing';
import type { AnswerRecord, ProgressMap, SkillMeta } from './types';
import type { SessionRecord } from './xp';

export interface Badge {
  id: string;
  title: string;
  /** What she did to earn it, in plain words. */
  how: string;
  icon: string;
}

export const BADGES: Badge[] = [
  { id: 'first-mix', title: 'First mix', how: 'Finished your first Daily Mix', icon: '🎒' },
  { id: 'week-goal', title: 'Three-day week', how: 'Practised on 3 days in one week', icon: '📅' },
  { id: 'five-strong', title: '5 skills strong', how: '5 skills reached Strong', icon: '💪' },
  { id: 'ten-strong', title: '10 skills strong', how: '10 skills reached Strong', icon: '🏋️' },
  { id: 'first-mastered', title: 'First mastered', how: 'Mastered a skill: right on 3 different days', icon: '⭐' },
  { id: 'five-mastered', title: '5 mastered', how: 'Mastered 5 skills', icon: '🌟' },
  { id: 'fix-5', title: 'Mistake finder', how: 'Fixed 5 mistakes', icon: '🔍' },
  { id: 'fix-20', title: 'Mistake hunter', how: 'Fixed 20 mistakes', icon: '🕵️' },
  { id: 'q-100', title: '100 questions', how: 'Answered 100 questions', icon: '💯' },
  { id: 'q-500', title: '500 questions', how: 'Answered 500 questions', icon: '🚀' },
  { id: 'days-7', title: '7 practice days', how: 'Practised on 7 different days', icon: '🗓️' },
  { id: 'days-30', title: '30 practice days', how: 'Practised on 30 different days', icon: '🏆' },
  { id: 'unit-1', title: 'Percentages, ratio and rates', how: 'Learned every skill in Unit 1', icon: '📗' },
  { id: 'unit-2', title: 'Patterns and algebra', how: 'Learned every skill in Unit 2', icon: '📘' },
  { id: 'unit-0', title: 'Foundations', how: 'Learned every skill in Unit 0', icon: '📙' },
  { id: 'unit-4', title: 'Reasoning and geometry', how: 'Learned every geometry skill done so far', icon: '📐' },
  { id: 'comeback', title: 'Comeback', how: 'Got a skill right after missing it in the same mix', icon: '🔁' },
];

export interface BadgeInput {
  log: AnswerRecord[];
  sessions: SessionRecord[];
  progress: ProgressMap;
  skills: SkillMeta[];
}

/** Badges are recomputed from the record every time, so they can only ever be gained. */
export function earnedBadges({ log, sessions, progress, skills }: BadgeInput): Set<string> {
  const got = new Set<string>();
  const answered = log.filter((r) => r.source === 'mix' || r.source === 'solo' || r.source === 'practice');
  const days = new Set(answered.map((r) => r.date));
  const states = skills.map((s) => (progress[s.id] ? stateOf(progress[s.id]) : 'new'));
  const strong = states.filter((s) => s === 'strong' || s === 'mastered').length;
  const mastered = states.filter((s) => s === 'mastered').length;
  const fixed = log.filter((r) => r.correct && (r.source === 'mistakeHunt' || r.retry)).length;

  if (sessions.some((s) => s.finished && s.mode === 'mix')) got.add('first-mix');
  const byWeek = new Map<DateKey, Set<DateKey>>();
  for (const d of days) {
    const w = weekStart(d);
    if (!byWeek.has(w)) byWeek.set(w, new Set());
    byWeek.get(w)!.add(d);
  }
  if ([...byWeek.values()].some((s) => s.size >= 3)) got.add('week-goal');
  if (strong >= 5) got.add('five-strong');
  if (strong >= 10) got.add('ten-strong');
  if (mastered >= 1) got.add('first-mastered');
  if (mastered >= 5) got.add('five-mastered');
  if (fixed >= 5) got.add('fix-5');
  if (fixed >= 20) got.add('fix-20');
  if (answered.length >= 100) got.add('q-100');
  if (answered.length >= 500) got.add('q-500');
  if (days.size >= 7) got.add('days-7');
  if (days.size >= 30) got.add('days-30');
  for (const unit of [1, 2, 0, 4]) {
    const inUnit = skills.filter((s) => s.unit === unit);
    if (inUnit.length && inUnit.every((s) => (progress[s.id]?.box ?? 0) >= 1)) got.add(`unit-${unit}`);
  }
  if (log.some((r) => r.correct && r.retry)) got.add('comeback');
  return got;
}
