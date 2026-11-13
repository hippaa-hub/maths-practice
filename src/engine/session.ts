import { addDays, type DateKey } from './dates';
import type { Rng } from './rng';
import { isDue } from './spacing';
import type { AnswerRecord, ProgressMap, SkillId, SkillMeta } from './types';

export type SessionItemKind = 'question' | 'lesson' | 'mistakeHunt' | 'check';

export interface SessionItem {
  id: string;
  skillId: SkillId;
  unit: number;
  kind: SessionItemKind;
  /** Why the item is here; shown nowhere, useful in tests. */
  reason: 'due' | 'recentWrong' | 'new' | 'retry' | 'check';
}

export interface BuildOptions {
  maxDue: number;
  maxQuestions: number;
  minDueBeforeNew: number;
  maxNewPerDay: number;
  maxRecentWrong: number;
  recentWrongDays: number;
  /** How many question items to turn into Mistake Hunts (0 until Phase 2 ships the screen). */
  mistakeHunts: number;
  /** Quick checks per day for skills the class has already taught. */
  maxChecksPerDay: number;
}

export const DEFAULT_OPTIONS: BuildOptions = {
  maxDue: 8,
  maxQuestions: 12,
  minDueBeforeNew: 6,
  maxNewPerDay: 2,
  maxRecentWrong: 2,
  recentWrongDays: 3,
  mistakeHunts: 1,
  maxChecksPerDay: 2,
};

export interface BuildArgs {
  skills: SkillMeta[];
  progress: ProgressMap;
  log: AnswerRecord[];
  today: DateKey;
  rng: Rng;
  options?: Partial<BuildOptions>;
}

/**
 * Skills whose lesson can start now: box 0 with every (known) prerequisite at box 2 or more.
 * A taught skill only gets a lesson after it failed its quick check; one that failed comes first.
 */
export function unlockedNewSkills(skills: SkillMeta[], progress: ProgressMap): SkillMeta[] {
  const known = new Set(skills.map((s) => s.id));
  const failed = (s: SkillMeta) => progress[s.id]?.checkResult === 'fail';
  return skills
    .filter((s) => (progress[s.id]?.box ?? 0) === 0)
    .filter((s) => !s.taught || failed(s))
    .filter((s) =>
      s.prerequisites.every((pre) => !known.has(pre) || (progress[pre]?.box ?? 0) >= 2),
    )
    .sort((a, b) => Number(failed(b)) - Number(failed(a)) || a.order - b.order || a.unit - b.unit);
}

/** Taught skills still waiting for their quick check, in curriculum order (prerequisites ignored). */
export function skillsToCheck(skills: SkillMeta[], progress: ProgressMap): SkillMeta[] {
  return skills
    .filter((s) => s.taught && (progress[s.id]?.box ?? 0) === 0 && !progress[s.id]?.checkResult)
    .sort((a, b) => a.order - b.order || a.unit - b.unit);
}

export function introducedOn(progress: ProgressMap, day: DateKey): number {
  return Object.values(progress).filter((p) => p.introducedDate === day && p.checkDate !== day).length;
}

export function checkedOn(progress: ProgressMap, day: DateKey): number {
  return Object.values(progress).filter((p) => p.checkDate === day).length;
}

/** Build today's Daily Mix following the rules in PLAN.md section 5. */
export function buildSession(args: BuildArgs): SessionItem[] {
  const { skills, progress, today, rng } = args;
  const opt = { ...DEFAULT_OPTIONS, ...args.options };
  const byId = new Map(skills.map((s) => [s.id, s]));
  const chosen = new Set<SkillId>();
  const items: SessionItem[] = [];
  let n = 0;
  const push = (skillId: SkillId, kind: SessionItemKind, reason: SessionItem['reason']) => {
    const meta = byId.get(skillId);
    if (!meta) return;
    chosen.add(skillId);
    items.push({ id: `${today}-${n++}-${skillId}`, skillId, unit: meta.unit, kind, reason });
  };

  // 1. Due skills, oldest first, up to maxDue.
  const due = skills
    .map((s) => progress[s.id])
    .filter((p): p is NonNullable<typeof p> => !!p && isDue(p, today))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.skillId.localeCompare(b.skillId))
    .slice(0, opt.maxDue);
  due.forEach((p) => push(p.skillId, 'question', 'due'));

  // 2. One or two box-1 skills she got wrong recently.
  const since = addDays(today, -opt.recentWrongDays);
  const recentWrong = skills
    .map((s) => progress[s.id])
    .filter((p): p is NonNullable<typeof p> => !!p && p.box === 1 && !!p.lastWrongDate && p.lastWrongDate >= since)
    .filter((p) => !chosen.has(p.skillId))
    .sort((a, b) => (b.lastWrongDate ?? '').localeCompare(a.lastWrongDate ?? ''))
    .slice(0, opt.maxRecentWrong);
  recentWrong.forEach((p) => push(p.skillId, 'question', 'recentWrong'));

  // 3. If fewer than minDueBeforeNew are due, introduce one new skill (max maxNewPerDay per day).
  if (due.length < opt.minDueBeforeNew && introducedOn(progress, today) < opt.maxNewPerDay) {
    const next = unlockedNewSkills(skills, progress).find((s) => !chosen.has(s.id));
    if (next) push(next.id, 'lesson', 'new');
  }

  // 3b. Quick checks for skills the class has already taught (Unit 1 first), up to maxChecksPerDay.
  const checksLeft = opt.maxChecksPerDay - checkedOn(progress, today);
  for (const s of skillsToCheck(skills, progress).filter((s) => !chosen.has(s.id)).slice(0, Math.max(0, checksLeft))) {
    push(s.id, 'check', 'check');
  }

  // 6 (early). Cap the session: drop the newest-due review items first, keep lesson and recent-wrong items.
  let capped = items;
  if (capped.length > opt.maxQuestions) {
    const keep = capped.filter((i) => i.reason !== 'due');
    const dueItems = capped.filter((i) => i.reason === 'due');
    capped = [...dueItems.slice(0, Math.max(0, opt.maxQuestions - keep.length)), ...keep];
  }

  // 4. Turn one or two questions into Mistake Hunts.
  let hunts = 0;
  for (const item of rng.shuffle(capped)) {
    if (hunts >= opt.mistakeHunts) break;
    if (item.kind === 'question' && byId.get(item.skillId)?.hasMistakes) {
      item.kind = 'mistakeHunt';
      hunts++;
    }
  }

  // 5. Shuffle: never two neighbours with the same skill; avoid three in a row from one unit.
  return constrainedShuffle(capped, rng);
}

function violates(prev: SessionItem[], next: SessionItem, strictUnit: boolean): boolean {
  const last = prev[prev.length - 1];
  if (last && last.skillId === next.skillId) return true;
  if (strictUnit && prev.length >= 2) {
    const a = prev[prev.length - 2];
    if (a.unit === next.unit && last.unit === next.unit) return true;
  }
  return false;
}

/**
 * Orders items so that no two neighbours share a skill (always) and no three in a row share a
 * unit (whenever that is possible). Lessons go first so the new skill is taught before it is mixed in.
 */
export function constrainedShuffle(items: SessionItem[], rng: Rng): SessionItem[] {
  // Quick checks (Unit 1 review) first, then the lesson, then the shuffled questions.
  const lessons = [...items.filter((i) => i.kind === 'check'), ...items.filter((i) => i.kind === 'lesson')];
  const rest = items.filter((i) => i.kind !== 'lesson' && i.kind !== 'check');
  for (const strictUnit of [true, false]) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const out: SessionItem[] = [...lessons];
      let pool = rng.shuffle(rest);
      let ok = true;
      while (pool.length) {
        const idx = pool.findIndex((c) => !violates(out, c, strictUnit));
        if (idx === -1) { ok = false; break; }
        out.push(pool[idx]);
        pool = pool.filter((_, i) => i !== idx);
      }
      if (ok) return out;
    }
  }
  // Should be unreachable: each skill appears at most once, so a skill-only order always exists.
  return [...lessons, ...rest];
}

/** Insert a second go at a missed skill later in the session, never next to the same skill. */
export function insertRetry(items: SessionItem[], afterIndex: number, missed: SessionItem): SessionItem[] {
  const retry: SessionItem = { ...missed, id: `${missed.id}-retry`, kind: 'question', reason: 'retry' };
  const out = [...items];
  // Prefer the end of the session; step back one place if the last item has the same skill.
  let pos = out.length;
  if (out.length > 0 && out[out.length - 1].skillId === missed.skillId) pos = out.length - 1;
  pos = Math.max(pos, afterIndex + 2);
  if (pos > out.length) pos = out.length;
  out.splice(pos, 0, retry);
  return out;
}
