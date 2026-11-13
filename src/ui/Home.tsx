import type { Skill } from '../content';
import type { DateKey } from '../engine/dates';
import { isDue, stateOf } from '../engine/spacing';
import { minutesThisWeek, practiceDaysThisWeek } from '../engine/stats';
import type { AnswerRecord, ProgressMap } from '../engine/types';
import { Badges } from './Badges';
import { Button } from './Button';
import { Mascot, type Mood } from './Mascot';
import { XpBar } from './XpBar';

const WEEK_GOAL = 3;

interface Props {
  name: string;
  skills: Skill[];
  progress: ProgressMap;
  log: AnswerRecord[];
  today: DateKey;
  message: string;
  mood: Mood;
  canStart: boolean;
  onStart: () => void;
  onMap: () => void;
  xp: number;
  badges: Set<string>;
  muted: boolean;
  onToggleMute: () => void;
}

export function Home({ name, skills, progress, log, today, message, mood, canStart, onStart, onMap, xp, badges, muted, onToggleMute }: Props) {
  const days = practiceDaysThisWeek(log, today).length;
  const minutes = minutesThisWeek(log, today);
  const states = skills.map((s) => (progress[s.id] ? stateOf(progress[s.id]) : 'new'));
  const strong = states.filter((s) => s === 'strong' || s === 'mastered').length;
  const learning = states.filter((s) => s === 'learning').length;
  const due = skills.filter((s) => progress[s.id] && isDue(progress[s.id], today)).length;
  return (
    <div className="screen">
      <div className="row">
        <XpBar xp={xp} />
        <button type="button" className="iconbtn" aria-label={muted ? 'Unmute sounds' : 'Mute sounds'} aria-pressed={muted} onClick={onToggleMute}>{muted ? '🔇' : '🔊'}</button>
      </div>

      <div className="hero">
        <Mascot mood={mood} size={104} />
        <div className="bubble" role="status">{message}</div>
      </div>

      <div className="stack">
        <Button block big disabled={!canStart} onClick={onStart}>Start today's mix</Button>
        <p className="muted small center">{canStart ? `About 10 minutes · ${due} to review today` : 'All done for today — see you tomorrow!'}</p>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 className="grow">This week</h2>
          <span className="chip">{minutes} min</span>
        </div>
        <div className="goal" aria-label={`${days} of ${WEEK_GOAL} practice days this week`}>
          {Array.from({ length: WEEK_GOAL }, (_, i) => (
            <span key={i} className={`circle ${i < days ? 'done' : ''}`}>{i < days ? '★' : i + 1}</span>
          ))}
          <span className="muted small">{Math.min(days, WEEK_GOAL)} of {WEEK_GOAL} days · goal: {WEEK_GOAL} days a week</span>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 className="grow">Skills</h2>
          <Button tone="ghost" small onClick={onMap}>See the map</Button>
        </div>
        <div className="row">
          <div className="stat"><b>{strong}</b><span className="muted small">strong</span></div>
          <div className="stat"><b>{learning}</b><span className="muted small">learning</span></div>
          <div className="stat"><b>{skills.length - strong - learning}</b><span className="muted small">to come</span></div>
        </div>
      </div>

      <div className="card stack">
        <h2>Badges · {badges.size}</h2>
        <Badges earned={badges} />
      </div>

      <p className="muted small center">Hi {name} — your progress is saved on this device only.</p>

      <nav className="nav" aria-label="Main">
        <button type="button" className="on" aria-current="page"><span className="ico">🏠</span>Home</button>
        <button type="button" onClick={onMap}><span className="ico">🗺️</span>Skills</button>
      </nav>
    </div>
  );
}
