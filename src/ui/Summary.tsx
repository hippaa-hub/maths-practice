import { useEffect } from 'react';
import type { Skill } from '../content/types';
import { BADGES } from '../engine/badges';
import { lolaComment } from '../engine/comments';
import type { SessionMode, SessionSummary } from '../engine/runtime';
import { Badges } from './Badges';
import { Button } from './Button';
import { Mascot } from './Mascot';
import { play } from './sounds';

const COLORS = ['#58cc02', '#1cb0f6', '#ff9600', '#ce82ff', '#ffc800'];

interface Props {
  summary: SessionSummary;
  skills: Record<string, Skill>;
  minutes: number;
  onHome: () => void;
  mode?: SessionMode;
  xpGained?: number;
  newBadges?: string[];
  corrected?: string[];
}

export function Summary({ summary, skills, minutes, onHome, mode = 'mix', xpGained = 0, newBadges = [], corrected = [] }: Props) {
  const remember = summary.rememberSkill ?? summary.newlyLearned[0] ?? summary.stronger[0] ?? summary.weaker[0];
  const title = (id: string) => skills[id]?.title ?? id;
  const comment = lolaComment(summary, title, corrected);
  useEffect(() => { if (newBadges.length) play('badge'); }, [newBadges.length]);
  const heading = mode === 'practice' ? 'Practice done!' : mode === 'lesson' ? 'Lesson done!' : 'Mix done!';
  return (
    <div className="screen">
      <div className="summary-hero">
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, background: COLORS[i % COLORS.length], animationDelay: `${(i % 7) * 0.25}s`, animationDuration: `${1.8 + (i % 5) * 0.3}s` }} />
          ))}
        </div>
        <Mascot mood="cheer" size={120} />
        <h1 className="pop">{heading}</h1>
        {xpGained > 0 && <p className="xp-gain pop">+{xpGained} XP</p>}
      </div>

      <div className="bubble" role="status">{comment}</div>

      {newBadges.length > 0 && (
        <div className="card stack">
          <h2>New badge{newBadges.length > 1 ? 's' : ''}!</h2>
          <Badges earned={new Set(newBadges)} highlight={newBadges} />
          <p className="muted small">{newBadges.map((id) => BADGES.find((b) => b.id === id)?.how).filter(Boolean).join(' · ')}</p>
        </div>
      )}

      <div className="row">
        <div className="stat"><b>{summary.answered}</b><span className="muted small">questions</span></div>
        <div className="stat"><b>{summary.correct}</b><span className="muted small">got right</span></div>
        <div className="stat"><b>{minutes}</b><span className="muted small">minutes</span></div>
      </div>

      {summary.newlyLearned.length > 0 && (
        <div className="card purple stack">
          <h2>New skill learned</h2>
          <p>{summary.newlyLearned.map(title).join(', ')}</p>
        </div>
      )}

      {summary.checked.length > 0 && (
        <div className="card blue stack">
          <h2>Back in the game</h2>
          <p>{summary.checked.map(title).join(', ')} — you remembered {summary.checked.length === 1 ? 'this' : 'these'} from school, so {summary.checked.length === 1 ? 'it goes' : 'they go'} straight into review.</p>
        </div>
      )}

      {mode === 'practice' ? (
        <div className="card blue"><p>Extra practice does not move skills up or down. The Daily Mix does that, at the right moment.</p></div>
      ) : (
      <div className="card green stack">
        <h2>Skills that got stronger</h2>
        {summary.stronger.length ? (
          <ul className="steps">{summary.stronger.map((id) => <li key={id}><span className="n">✓</span><span>{title(id)}</span></li>)}</ul>
        ) : (
          <p>None moved up today. The ones you missed come back tomorrow — that is how they get strong.</p>
        )}
      </div>
      )}

      {remember && skills[remember] && (
        <div className="card stack">
          <h2>One thing to remember</h2>
          <p className="rule">{skills[remember].explain.rule}</p>
          <p className="muted small">{title(remember)}</p>
        </div>
      )}

      <Button block big onClick={onHome}>Back home</Button>
    </div>
  );
}
