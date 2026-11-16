import { UNIT_NAMES } from '../content';
import type { DateKey } from '../engine/dates';
import { canDoCount, LEVEL_AT, LEVELS, levelsReached, unitShare, weekGain, weeklyCounts, type MasteryLog } from '../engine/mastery';
import type { ProgressMap, SkillMeta } from '../engine/types';
import { Mascot } from './Mascot';

const shortDate = (day: string) => {
  const [, m, d] = day.split('-').map(Number);
  return `${d}/${m}`;
};

const UNIT_COLOUR: Record<number, string> = { 1: 'var(--orange)', 2: 'var(--purple)', 0: 'var(--blue)', 4: 'var(--green)' };

interface Props {
  skills: SkillMeta[];
  progress: ProgressMap;
  masteryLog?: MasteryLog;
  today: DateKey;
  onBack: () => void;
}

/** "My progress": what she can do now, and how it grows. No points here — just learning. */
export function MyProgress({ skills, progress, masteryLog, today, onBack }: Props) {
  const now = canDoCount(progress, skills, today);
  const gain = weekGain(masteryLog, now, today);
  const reached = levelsReached(progress, skills, today);
  const weeks = weeklyCounts(masteryLog, now, today, 6);
  const top = Math.max(5, ...weeks.map((w) => w.count));
  // the level she is working on: the first one not reached yet
  const working = LEVELS.findIndex((l) => unitShare(progress, skills, l.unit, today) < LEVEL_AT);

  return (
    <div className="screen">
      <div className="topbar">
        <button type="button" className="iconbtn" aria-label="Back home" onClick={onBack}>←</button>
        <h1 className="grow">My progress</h1>
      </div>

      <div className="hero">
        <Mascot mood={gain > 0 ? 'cheer' : 'happy'} size={84} />
        <div className="cando-hero">
          <div className="big-number">{now}</div>
          <div>
            <b>skill{now === 1 ? '' : 's'} you can do</b>
            <span className="muted small">
              of {skills.length} ·{' '}
              {gain > 0 ? <strong className="good">+{gain} this week</strong> : 'practise to add more this week'}
            </span>
          </div>
        </div>
      </div>
      <p className="muted small">
        A skill counts when you have got it right on different days, so it is strong. If you stop practising it, it drops
        out until you review it again — so this number is real.
      </p>

      <div className="card stack">
        <h2>Week by week</h2>
        <div className="week-bars" role="img" aria-label="Skills you could do at the end of each week">
          {weeks.map((w, i) => (
            <div key={w.week} className="week-bar">
              <span className="n">{w.count}</span>
              <i style={{ height: `${Math.max(4, (w.count / top) * 100)}%` }} className={i === weeks.length - 1 ? 'now' : ''} />
              <small>{i === weeks.length - 1 ? 'now' : shortDate(w.week)}</small>
            </div>
          ))}
        </div>
      </div>

      <h2>My level · {reached} of {LEVELS.length}</h2>
      <div className="level-map">
        {LEVELS.map((l, i) => {
          const value = unitShare(progress, skills, l.unit, today);
          const done = value >= LEVEL_AT;
          const inUnit = skills.filter((s) => s.unit === l.unit).length;
          const colour = done ? 'var(--yellow)' : UNIT_COLOUR[l.unit] ?? 'var(--blue)';
          return (
            <div key={l.unit} className={`level ${done ? 'done' : ''} ${i === working ? 'working' : ''}`}>
              <div className="level-badge" style={{ background: colour }}>{done ? '🐾' : i + 1}</div>
              <div className="level-text">
                <b>{l.can}</b>
                <small className="muted">
                  Level {i + 1} · {UNIT_NAMES[l.unit] ?? l.title} · {Math.round(value * inUnit)} of {inUnit} skills
                </small>
                <span className="level-bar">
                  <i style={{ width: `${Math.max(3, Math.round(value * 100))}%`, background: colour }} />
                  <em style={{ left: `${LEVEL_AT * 100}%` }} title={`${Math.round(LEVEL_AT * 100)}% opens the level`} />
                </span>
              </div>
              {i === working && <Mascot mood="wave" size={44} />}
            </div>
          );
        })}
      </div>
      <p className="muted small">
        A level is yours when you can do {Math.round(LEVEL_AT * 100)}% of that unit’s skills. You can reach them in any
        order.
      </p>
    </div>
  );
}
