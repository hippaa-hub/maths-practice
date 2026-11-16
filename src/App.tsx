import { useEffect, useMemo, useRef, useState } from 'react';
import { SKILLS, SKILL_BY_ID, SKILL_METAS, type MistakeHunt, type Question } from './content';
import { earnedBadges } from './engine/badges';
import { canDoCount, logMastery } from './engine/mastery';
import { addDays, dateKeyOf, daysBetween } from './engine/dates';
import { createRng } from './engine/rng';
import type { SessionMode, SessionSummary } from './engine/runtime';
import { buildSession, type BuildOptions, type SessionItem } from './engine/session';
import { newProgress } from './engine/spacing';
import type { AnswerRecord, ProgressMap } from './engine/types';
import { totalXp, type SessionRecord } from './engine/xp';
import { emptySaved, idbStore, type Saved, type Store } from './storage/db';
import { Home } from './ui/Home';
import { MyProgress } from './ui/MyProgress';
import type { Mood } from './ui/Mascot';
import { Session } from './ui/Session';
import { SkillMap, type MapAction } from './ui/SkillMap';
import { setMuted } from './ui/sounds';

export interface AppDeps {
  now: () => Date;
  seed?: number;
  store: Store;
  /** Test hooks: called with every question / Mistake Hunt shown. */
  onQuestion?: (q: Question) => void;
  onHunt?: (h: MistakeHunt) => void;
}

const BUILD_OPTIONS: Partial<BuildOptions> = {};

interface ActiveSession {
  id: string;
  items: SessionItem[];
  seed: number;
  mode: SessionMode;
  xpBefore: number;
  canDoBefore: number;
  badgesBefore: Set<string>;
}

export function App({ deps }: { deps?: Partial<AppDeps> }) {
  const d: AppDeps = { now: () => new Date(), store: idbStore, ...deps };
  const [saved, setSaved] = useState<Saved | null>(null);
  const [screen, setScreen] = useState<'home' | 'map' | 'session' | 'progress'>('home');
  const [session, setSession] = useState<ActiveSession | null>(null);
  const savedRef = useRef<Saved | null>(null);
  const today = dateKeyOf(d.now());

  useEffect(() => {
    let alive = true;
    // Opening the app as .../?reset wipes all progress on this device, so a new learner starts fresh.
    const wantsReset = typeof window !== 'undefined' && /(^|[?&])reset(=|&|$)/.test(window.location.search);
    const ready = wantsReset
      ? d.store.clear().then(() => { window.history.replaceState(null, '', window.location.pathname); return null; })
      : d.store.load();
    ready.then((s) => {
      if (!alive) return;
      const next: Saved = { ...emptySaved(), ...(s ?? {}) };
      next.sessions ??= [];
      for (const skill of SKILLS) if (!next.progress[skill.id]) next.progress[skill.id] = newProgress(skill.id);
      // Keep a daily record of the skills she can do, so she can see it grow week by week.
      next.masteryLog = logMastery(next.masteryLog, canDoCount(next.progress, SKILL_METAS, today), today);
      savedRef.current = next;
      setMuted(next.settings.muted);
      setSaved(next);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preview = useMemo(() => {
    if (!saved) return [];
    return buildSession({ skills: SKILL_METAS, progress: saved.progress, log: saved.log, today, rng: createRng(1), options: BUILD_OPTIONS });
  }, [saved, today]);

  const xp = saved ? totalXp(saved.log, saved.sessions) : 0;
  const canDoNow = saved ? canDoCount(saved.progress, SKILL_METAS, today) : 0;
  const badges = useMemo(() => (saved ? earnedBadges({ log: saved.log, sessions: saved.sessions, progress: saved.progress, skills: SKILL_METAS }) : new Set<string>()), [saved]);

  function commit(next: Saved) {
    next = { ...next, masteryLog: logMastery(next.masteryLog, canDoCount(next.progress, SKILL_METAS, today), today) };
    savedRef.current = next;
    setSaved(next);
    void d.store.save(next);
  }

  function persist(progress: ProgressMap, record?: AnswerRecord) {
    const base = savedRef.current ?? emptySaved();
    commit({ ...base, progress, log: record ? [...base.log, record] : base.log });
  }

  function finishSession(summary: SessionSummary, minutes: number) {
    if (!session) return;
    const base = savedRef.current ?? emptySaved();
    const rec: SessionRecord = { id: session.id, date: today, mode: session.mode, finished: true, questions: summary.answered, minutes };
    if (base.sessions.some((s) => s.id === rec.id)) return;
    commit({ ...base, sessions: [...base.sessions, rec] });
  }

  function toggleMute() {
    const base = savedRef.current;
    if (!base) return;
    const muted = !base.settings.muted;
    setMuted(muted);
    commit({ ...base, settings: { ...base.settings, muted } });
  }

  function open(items: SessionItem[], mode: SessionMode, seed: number, label: string) {
    if (!saved) return;
    setSession({ id: `${today}-${label}-${seed}`, items, seed, mode, xpBefore: xp, canDoBefore: canDoNow, badgesBefore: new Set(badges) });
    setScreen('session');
  }

  function startMix() {
    if (!saved) return;
    const seed = d.seed ?? (Date.now() % 2147483647);
    const items = buildSession({ skills: SKILL_METAS, progress: saved.progress, log: saved.log, today, rng: createRng(seed), options: BUILD_OPTIONS });
    open(items, 'mix', seed, 'mix');
  }

  function startFromMap(skillId: string, action: MapAction) {
    const meta = SKILL_METAS.find((s) => s.id === skillId);
    if (!meta) return;
    const seed = (d.seed ?? Date.now()) % 2147483647;
    const mk = (kind: SessionItem['kind'], reason: SessionItem['reason'], i: number): SessionItem => ({ id: `${today}-${action}-${skillId}-${i}`, skillId, unit: meta.unit, kind, reason });
    if (action === 'lesson') open([mk('lesson', 'new', 0)], 'lesson', seed, `lesson-${skillId}`);
    else if (action === 'check') open([mk('check', 'check', 0)], 'lesson', seed, `check-${skillId}`);
    else open([0, 1, 2].map((i) => mk('question', 'due', i)), 'practice', seed, `practice-${skillId}`);
  }

  if (!saved) return <div className="app"><p className="muted center" style={{ padding: 40 }}>Loading…</p></div>;

  if (screen === 'session' && session) {
    return (
      <div className="app">
        <Session
          key={session.id}
          sessionId={session.id}
          items={session.items}
          progress={saved.progress}
          skills={SKILL_BY_ID}
          today={today}
          rng={createRng(session.seed + 1)}
          mode={session.mode}
          onRecord={(record, progress) => persist(progress, record ?? undefined)}
          onFinish={finishSession}
          onHome={() => { setScreen(session.mode === 'mix' ? 'home' : 'map'); setSession(null); }}
          onQuestion={d.onQuestion}
          onHunt={d.onHunt}
          xpBefore={session.xpBefore}
          xpNow={xp}
          canDoBefore={session.canDoBefore}
          canDoNow={canDoNow}
          badgesBefore={session.badgesBefore}
          badgesNow={badges}
          muted={saved.settings.muted}
          onToggleMute={toggleMute}
        />
      </div>
    );
  }

  if (screen === 'progress') {
    return (
      <div className="app">
        <MyProgress skills={SKILL_METAS} progress={saved.progress} masteryLog={saved.masteryLog} today={today} onBack={() => setScreen('home')} />
      </div>
    );
  }

  if (screen === 'map') {
    return (
      <div className="app">
        <SkillMap skills={SKILLS} progress={saved.progress} today={today} onStart={startFromMap} onBack={() => setScreen('home')} />
      </div>
    );
  }

  const { message, mood } = homeMessage(saved, today);
  return (
    <div className="app">
      <Home
        name={saved.settings.name}
        skills={SKILLS}
        progress={saved.progress}
        log={saved.log}
        today={today}
        message={message}
        mood={mood}
        canStart={preview.length > 0}
        onStart={startMix}
        onMap={() => setScreen('map')}
        onProgress={() => setScreen('progress')}
        canDo={canDoNow}
        masteryLog={saved.masteryLog}
        xp={xp}
        badges={badges}
        muted={saved.settings.muted}
        onToggleMute={toggleMute}
      />
    </div>
  );
}

function homeMessage(saved: Saved, today: string): { message: string; mood: Mood } {
  const name = saved.settings.name;
  const mix = saved.log.filter((r) => r.source !== 'faded' && r.source !== 'lesson');
  if (mix.length === 0) return { message: `Hi ${name}! I'm Lola. We start with a quick check on percentages, the part of the test that was hardest. One small step at a time.`, mood: 'wave' };
  const todays = mix.filter((r) => r.date === today);
  if (todays.length) {
    const right = todays.filter((r) => r.correct).length;
    return { message: `You answered ${todays.length} questions today and got ${right} right. Come back tomorrow for the next mix.`, mood: 'cheer' };
  }
  const last = mix[mix.length - 1];
  const gap = daysBetween(last.date, today);
  const when = gap === 1 ? 'Yesterday' : last.date === addDays(today, -gap) && gap <= 6 ? `${gap} days ago` : 'Last time';
  const title = SKILL_BY_ID[last.skillId]?.title ?? last.skillId;
  return { message: `${when} you practised ${title}. Ready for today's mix?`, mood: 'happy' };
}
