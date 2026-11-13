import type { DateKey } from './dates';
import { insertRetry, type SessionItem } from './session';
import { applyOutcome, completeCheck, completeLesson, stateOf } from './spacing';
import type { AnswerRecord, Outcome, ProgressMap, SkillId, SkillState } from './types';

export interface ItemResult {
  itemId: string;
  skillId: SkillId;
  outcome: Outcome;
  boxBefore: number;
  boxAfter: number;
}

export type SessionMode = 'mix' | 'lesson' | 'practice';

export interface RunningSession {
  id: string;
  today: DateKey;
  items: SessionItem[];
  index: number;
  results: ItemResult[];
  retried: SkillId[];
  startedAt: number;
  /** 'practice' answers are logged but never move a skill's box. */
  mode: SessionMode;
}

export function startSession(id: string, today: DateKey, items: SessionItem[], startedAt: number, mode: SessionMode = 'mix'): RunningSession {
  return { id, today, items, index: 0, results: [], retried: [], startedAt, mode };
}

export function currentItem(s: RunningSession): SessionItem | undefined {
  return s.items[s.index];
}

export function isFinished(s: RunningSession): boolean {
  return s.index >= s.items.length;
}

/** Record a Daily Mix answer: updates the skill, logs it, and queues a retry after a miss. */
export function answerCurrent(
  session: RunningSession,
  progress: ProgressMap,
  outcome: Outcome,
  extra: { level: 1 | 2 | 3; timeMs: number; misconception?: string },
): { session: RunningSession; progress: ProgressMap; record: AnswerRecord; result: ItemResult } {
  const item = currentItem(session);
  if (!item) throw new Error('Session is already finished');
  const before = progress[item.skillId];
  if (!before) throw new Error(`No progress for ${item.skillId}`);
  const practice = session.mode === 'practice';
  const after = practice ? before : applyOutcome(before, outcome, session.today);
  const result: ItemResult = {
    itemId: item.id, skillId: item.skillId, outcome, boxBefore: before.box, boxAfter: after.box,
  };
  let items = session.items;
  let retried = session.retried;
  if (outcome === 'miss' && !practice && !retried.includes(item.skillId)) {
    items = insertRetry(items, session.index, item);
    retried = [...retried, item.skillId];
  }
  const record: AnswerRecord = {
    skillId: item.skillId,
    date: session.today,
    level: extra.level,
    correct: outcome !== 'miss',
    hintUsed: outcome === 'hint',
    timeMs: extra.timeMs,
    misconception: extra.misconception,
    sessionId: session.id,
    source: practice ? 'practice' : item.kind === 'mistakeHunt' ? 'mistakeHunt' : 'mix',
    retry: item.reason === 'retry' || undefined,
  };
  return {
    session: { ...session, items, retried, index: session.index + 1, results: [...session.results, result] },
    progress: { ...progress, [item.skillId]: after },
    record,
    result,
  };
}

/** Finish a quick check: 2 of 3 right skips the lesson and puts the skill at box 2. */
export function finishCheck(session: RunningSession, progress: ProgressMap, correct: number): { session: RunningSession; progress: ProgressMap; passed: boolean } {
  const item = currentItem(session);
  if (!item || item.kind !== 'check') throw new Error('Current item is not a check');
  const before = progress[item.skillId];
  const after = completeCheck(before, session.today, correct);
  const result: ItemResult = { itemId: item.id, skillId: item.skillId, outcome: after.box > 0 ? 'correct' : 'miss', boxBefore: before.box, boxAfter: after.box };
  return {
    session: { ...session, index: session.index + 1, results: [...session.results, result] },
    progress: { ...progress, [item.skillId]: after },
    passed: after.box > 0,
  };
}

/** Finish the lesson item: the skill moves to box 1. */
export function finishLesson(session: RunningSession, progress: ProgressMap): { session: RunningSession; progress: ProgressMap } {
  const item = currentItem(session);
  if (!item || item.kind !== 'lesson') throw new Error('Current item is not a lesson');
  const before = progress[item.skillId];
  const after = completeLesson(before, session.today);
  const result: ItemResult = { itemId: item.id, skillId: item.skillId, outcome: 'correct', boxBefore: before.box, boxAfter: after.box };
  return {
    session: { ...session, index: session.index + 1, results: [...session.results, result] },
    progress: { ...progress, [item.skillId]: after },
  };
}

export interface SessionSummary {
  stronger: SkillId[];
  weaker: SkillId[];
  newlyLearned: SkillId[];
  /** Taught skills that passed their quick check today. */
  checked: SkillId[];
  answered: number;
  correct: number;
  /** Skill to remember: the one missed most, else the first missed, else none. */
  rememberSkill?: SkillId;
  stateAfter: Record<SkillId, SkillState>;
}

export function summarise(session: RunningSession, progress: ProgressMap): SessionSummary {
  const stronger = new Set<SkillId>();
  const weaker = new Set<SkillId>();
  const newlyLearned = new Set<SkillId>();
  const checked = new Set<SkillId>();
  const misses = new Map<SkillId, number>();
  let answered = 0;
  let correct = 0;
  for (const r of session.results) {
    const item = session.items.find((i) => i.id === r.itemId);
    if (item?.kind === 'lesson') { newlyLearned.add(r.skillId); continue; }
    if (item?.kind === 'check') { if (r.boxAfter > 0) checked.add(r.skillId); else weaker.add(r.skillId); continue; }
    answered++;
    if (r.outcome !== 'miss') correct++;
    if (r.boxAfter > r.boxBefore) stronger.add(r.skillId);
    if (r.boxAfter < r.boxBefore) weaker.add(r.skillId);
    if (r.outcome === 'miss') misses.set(r.skillId, (misses.get(r.skillId) ?? 0) + 1);
  }
  for (const id of stronger) if (weaker.has(id)) { stronger.delete(id); }
  let rememberSkill: SkillId | undefined;
  let best = 0;
  for (const [id, n] of misses) if (n > best) { best = n; rememberSkill = id; }
  const stateAfter: Record<SkillId, SkillState> = {};
  for (const id of new Set(session.results.map((r) => r.skillId))) stateAfter[id] = stateOf(progress[id]);
  return { stronger: [...stronger], weaker: [...weaker], newlyLearned: [...newlyLearned], checked: [...checked], answered, correct, rememberSkill, stateAfter };
}
