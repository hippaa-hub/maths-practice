import { useState } from 'react';
import { UNIT_NAMES, type Skill } from '../content';
import type { DateKey } from '../engine/dates';
import { daysBetween } from '../engine/dates';
import { newProgress, stateOf } from '../engine/spacing';
import type { ProgressMap, SkillState } from '../engine/types';
import { Button } from './Button';
import pawLearning from '../assets/paw-learning.png';
import pawMastered from '../assets/paw-mastered.png';
import pawNew from '../assets/paw-new.png';
import pawStrong from '../assets/paw-strong.png';

/** Units the class has not reached yet: visible, but marked "coming later". */
const FUTURE_UNITS: Array<{ unit: number; when: string; skills: string[] }> = [
  { unit: 3, when: 'from mid January', skills: ['Coordinates in four quadrants', 'Table of values to graph', 'Gradient', 'Intercept', 'Match equation, table and graph', 'One- and two-step equations', 'Equations with brackets', 'Word problems to equations'] },
  { unit: 5, when: 'from mid May', skills: ['Mean, median, mode, range', 'Reading charts', 'Choosing a chart', 'Probability scale', 'Probability of single events', 'Listing outcomes', 'Experimental vs expected'] },
];

const STATE_LABEL: Record<SkillState, string> = { new: 'New', learning: 'Learning', strong: 'Strong', mastered: 'Mastered' };
const PAW: Record<SkillState, string> = { new: pawNew, learning: pawLearning, strong: pawStrong, mastered: pawMastered };
const UNIT_ORDER = [1, 2, 0, 4];

export type MapAction = 'lesson' | 'check' | 'practice';

interface Props {
  skills: Skill[];
  progress: ProgressMap;
  today: DateKey;
  onStart: (skillId: string, action: MapAction) => void;
  onBack: () => void;
}

export function SkillMap({ skills, progress, today, onStart, onBack }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const prog = (id: string) => progress[id] ?? newProgress(id);
  const unlocked = (s: Skill) => s.taught || s.prerequisites.every((p) => !byId[p] || prog(p).box >= 2);
  const selected = open ? byId[open] : null;

  function actionFor(s: Skill): { action: MapAction; label: string } | { locked: string } {
    const p = prog(s.id);
    if (p.box >= 1) return { action: 'practice', label: 'Practise (3 questions)' };
    if (s.taught && !p.checkResult) return { action: 'check', label: 'Quick check' };
    if (unlocked(s)) return { action: 'lesson', label: 'Start the lesson' };
    const missing = s.prerequisites.filter((id) => byId[id] && prog(id).box < 2).map((id) => byId[id].title);
    return { locked: `Needs first: ${missing.join(', ')}` };
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button type="button" className="iconbtn" aria-label="Back home" onClick={onBack}>←</button>
        <h1 className="grow">Skill map</h1>
      </div>

      {UNIT_ORDER.map((u) => {
        const inUnit = skills.filter((s) => s.unit === u).sort((a, b) => a.order - b.order);
        if (!inUnit.length) return null;
        const strong = inUnit.filter((s) => ['strong', 'mastered'].includes(stateOf(prog(s.id)))).length;
        return (
          <section key={u} className="stack">
            <div className="row">
              <h2 className="grow">Unit {u}: {UNIT_NAMES[u]}</h2>
              <span className="chip strong">{strong}/{inUnit.length} strong</span>
            </div>
            <ol className="path" aria-label={`Unit ${u} skills`}>
              {inUnit.map((s, i) => {
                const st = stateOf(prog(s.id));
                const locked = st === 'new' && !s.taught && !unlocked(s);
                return (
                  <li key={s.id} className={`path-item ${i % 2 ? 'right' : 'left'}`}>
                    <button
                      type="button"
                      className={`node ${st} ${locked ? 'locked' : ''} ${open === s.id ? 'open' : ''}`}
                      aria-label={`${s.title}: ${locked ? 'locked' : STATE_LABEL[st]}`}
                      onClick={() => setOpen(open === s.id ? null : s.id)}
                    >
                      <img src={PAW[st]} alt="" draggable={false} />
                      {locked && <span className="node-lock" aria-hidden="true">🔒</span>}
                    </button>
                    <span className="node-label">{s.short}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      {FUTURE_UNITS.map((f) => (
        <section key={f.unit} className="stack future">
          <div className="row">
            <h2 className="grow">Unit {f.unit}: {UNIT_NAMES[f.unit]}</h2>
            <span className="chip">coming later</span>
          </div>
          <p className="muted small">The class starts this {f.when}. {f.skills.length} skills: {f.skills.join(', ')}.</p>
        </section>
      ))}

      {selected && (
        <div className="sheet" role="dialog" aria-label={selected.title}>
          <div className="card stack">
            <div className="row">
              <div className="grow">
                <h2>{selected.title}</h2>
                <p className="muted small">
                  {STATE_LABEL[stateOf(prog(selected.id))]}
                  {prog(selected.id).box >= 1 && prog(selected.id).dueDate && ` · next review ${daysBetween(today, prog(selected.id).dueDate) <= 0 ? 'today' : `in ${daysBetween(today, prog(selected.id).dueDate)} day${daysBetween(today, prog(selected.id).dueDate) === 1 ? '' : 's'}`}`}
                  {selected.taught && prog(selected.id).box === 0 && ' · done at school'}
                </p>
              </div>
              <button type="button" className="iconbtn" aria-label="Close" onClick={() => setOpen(null)}>✕</button>
            </div>
            <p className="rule">{selected.explain.rule}</p>
            {(() => {
              const a = actionFor(selected);
              return 'locked' in a
                ? <p className="muted small">🔒 {a.locked}</p>
                : <Button block big onClick={() => onStart(selected.id, a.action)}>{a.label}</Button>;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
