import { useEffect, useState } from 'react';
import type { MistakeHunt, Question, Skill } from '../content/types';
import type { DateKey } from '../engine/dates';
import type { Rng } from '../engine/rng';
import { answerCurrent, currentItem, finishCheck, finishLesson, isFinished, startSession, summarise, type RunningSession, type SessionMode, type SessionSummary } from '../engine/runtime';
import type { SessionItem } from '../engine/session';
import type { AnswerRecord, Level, Outcome, ProgressMap } from '../engine/types';
import { pickFresh, seenKey } from '../engine/fresh';
import { Lesson } from './Lesson';
import { MistakeHuntView } from './MistakeHuntView';
import { QuestionView } from './QuestionView';
import { QuickCheck } from './QuickCheck';
import { Summary } from './Summary';
import { play } from './sounds';

interface Props {
  sessionId: string;
  items: SessionItem[];
  progress: ProgressMap;
  skills: Record<string, Skill>;
  today: DateKey;
  rng: Rng;
  onRecord: (record: AnswerRecord | null, progress: ProgressMap) => void;
  onHome: () => void;
  onQuestion?: (q: Question) => void;
  onHunt?: (h: MistakeHunt) => void;
  /** Never repeat a question: the app remembers every question shown on this device. */
  isSeen?: (key: string) => boolean;
  markSeen?: (key: string) => void;
  mode?: SessionMode;
  onFinish?: (summary: SessionSummary, minutes: number) => void;
  xpBefore: number;
  xpNow: number;
  /** Skills she can do at the start of this session and right now (the summary shows the difference). */
  canDoBefore?: number;
  canDoNow?: number;
  badgesBefore: Set<string>;
  badgesNow: Set<string>;
  muted: boolean;
  onToggleMute: () => void;
}

export function Session({ sessionId, items, progress: initialProgress, skills, today, rng, onRecord, onHome, onQuestion, onHunt, isSeen, markSeen, mode = 'mix', onFinish, xpBefore, xpNow, canDoBefore, canDoNow, badgesBefore, badgesNow, muted, onToggleMute }: Props) {
  const [running, setRunning] = useState<RunningSession>(() => startSession(sessionId, today, items, Date.now(), mode));
  const [progress, setProgress] = useState(initialProgress);
  const [elapsed, setElapsed] = useState(0);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [question, setQuestion] = useState<Question | null>(() => makeQuestion(items[0]));
  const [hunt, setHunt] = useState<MistakeHunt | null>(() => makeHunt(items[0]));

  /** A question she has not seen before (same skill and level, different numbers). */
  function fresh(skill: Skill, level: Level): Question {
    const q = pickFresh(() => skill.generate(level, rng), (key) => isSeen?.(key) ?? false);
    markSeen?.(seenKey(q.skillId, q.text));
    onQuestion?.(q);
    return q;
  }

  function makeQuestion(item: SessionItem | undefined): Question | null {
    if (!item || item.kind !== 'question') return null;
    const level = initialProgress[item.skillId]?.level ?? 1;
    return fresh(skills[item.skillId], level);
  }

  function makeHunt(item: SessionItem | undefined): MistakeHunt | null {
    if (!item || item.kind !== 'mistakeHunt') return null;
    const h = rng.pick(skills[item.skillId].mistakes);
    onHunt?.(h);
    return h;
  }

  function moveOn(next: RunningSession, nextProgress: ProgressMap) {
    setRunning(next);
    setProgress(nextProgress);
    if (isFinished(next)) setSummary(summarise(next, nextProgress));
    else { setQuestion(makeQuestion(currentItem(next))); setHunt(makeHunt(currentItem(next))); }
  }

  function logExtra(skillId: string, outcome: Outcome, timeMs: number, source: 'solo' | 'faded' | 'check', leftApp = false, nextProgress = progress) {
    const record: AnswerRecord = {
      skillId, date: today, level: 1, correct: outcome !== 'miss', hintUsed: outcome === 'hint', timeMs, sessionId, source, leftApp: leftApp || undefined,
    };
    setElapsed((e) => e + timeMs);
    onRecord(record, nextProgress);
  }

  const item = currentItem(running);
  const total = running.items.length;
  const minutes = Math.max(1, Math.round(elapsed / 60000));

  useEffect(() => {
    if (summary) { onFinish?.(summary, minutes); play('done'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  if (summary) {
    const corrected = running.results.filter((r) => r.outcome !== 'miss' && running.items.find((i) => i.id === r.itemId)?.reason === 'retry').map((r) => r.skillId);
    const newBadges = [...badgesNow].filter((b) => !badgesBefore.has(b));
    return <Summary summary={summary} skills={skills} minutes={minutes} onHome={onHome} mode={mode} xpGained={Math.max(0, xpNow - xpBefore)} newBadges={newBadges} corrected={corrected} canDoBefore={canDoBefore} canDoNow={canDoNow} />;
  }
  if (!item) return null;
  const skill = skills[item.skillId];

  return (
    <div className="screen">
      <div className="topbar">
        <button type="button" className="iconbtn" aria-label="Leave the mix" onClick={onHome}>✕</button>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={running.index} aria-label="Mix progress">
          <div style={{ width: `${(running.index / total) * 100}%` }} />
        </div>
        <span className="muted small">{running.index + 1}/{total}</span>
        <button type="button" className="iconbtn" aria-label={muted ? 'Unmute sounds' : 'Mute sounds'} aria-pressed={muted} onClick={onToggleMute}>{muted ? '🔇' : '🔊'}</button>
      </div>

      {item.kind === 'lesson' ? (
        <Lesson
          key={item.id}
          skill={skill}
          generate={(level) => fresh(skill, level)}
          onFaded={(correct, timeMs) => logExtra(skill.id, correct ? 'correct' : 'miss', timeMs, 'faded')}
          onSolo={(_q, outcome, timeMs, leftApp) => logExtra(skill.id, outcome, timeMs, 'solo', leftApp)}
          onDone={() => {
            const r = finishLesson(running, progress);
            onRecord(null, r.progress);
            moveOn(r.session, r.progress);
          }}
        />
      ) : item.kind === 'mistakeHunt' && hunt ? (
        <MistakeHuntView
          key={item.id}
          hunt={hunt}
          skillTitle={skill.title}
          onDone={({ outcome, timeMs, leftApp }) => {
            const r = answerCurrent(running, progress, outcome, { level: progress[skill.id]?.level ?? 1, timeMs, leftApp });
            setElapsed((e) => e + timeMs);
            onRecord(r.record, r.progress);
            moveOn(r.session, r.progress);
          }}
        />
      ) : item.kind === 'check' ? (
        <QuickCheck
          key={item.id}
          skill={skill}
          generate={(level) => fresh(skill, level)}
          onAnswer={(_q, outcome, timeMs, leftApp) => logExtra(skill.id, outcome, timeMs, 'check', leftApp)}
          onDone={(correct) => {
            const r = finishCheck(running, progress, correct);
            onRecord(null, r.progress);
            moveOn(r.session, r.progress);
          }}
        />
      ) : question ? (
        <QuestionView
          key={item.id}
          question={question}
          skillTitle={skill.title}
          misconceptions={skill.misconceptions}
          example={(progress[skill.id]?.box ?? 0) === 2 ? skill.examples[0] : undefined}
          onDone={({ outcome, misconception, timeMs, leftApp }) => {
            const r = answerCurrent(running, progress, outcome, { level: question.level, timeMs, misconception, leftApp });
            setElapsed((e) => e + timeMs);
            onRecord(r.record, r.progress);
            moveOn(r.session, r.progress);
          }}
        />
      ) : null}
    </div>
  );
}
