import { useRef, useState } from 'react';
import type { MistakeHunt } from '../content/types';
import type { Outcome } from '../engine/types';
import { Button } from './Button';
import { Mascot } from './Mascot';
import { play } from './sounds';

interface Props {
  hunt: MistakeHunt;
  skillTitle: string;
  onDone: (r: { outcome: Outcome; timeMs: number }) => void;
}

/** A solved problem with one wrong step: tap the wrong step, then pick the fix. */
export function MistakeHuntView({ hunt, skillTitle, onDone }: Props) {
  const [found, setFound] = useState(false);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [lastTap, setLastTap] = useState<number | null>(null);
  const [fix, setFix] = useState<string>('');
  const [result, setResult] = useState<'ok' | 'notyet' | null>(null);
  const started = useRef(Date.now());

  function tap(i: number) {
    if (found || result) return;
    setLastTap(i);
    if (i === hunt.wrongStep) setFound(true);
    else setWrongTaps((n) => n + 1);
  }

  function check() {
    if (!fix || result) return;
    const ok = Number(fix) === hunt.correctFix;
    play(ok ? 'correct' : 'notyet');
    setResult(ok ? 'ok' : 'notyet');
  }

  function finish() {
    const outcome: Outcome = result === 'ok' ? (wrongTaps === 0 ? 'correct' : 'hint') : 'miss';
    onDone({ outcome, timeMs: Date.now() - started.current });
  }

  return (
    <div className="stack">
      <div className="card purple stack">
        <span className="chip">Mistake Hunt · {skillTitle}</span>
        <p className="qtext">{hunt.problem}</p>
        <p className="small">Someone solved this, but one step is wrong. <b>Tap the wrong step.</b></p>
      </div>

      <div className="hunt-steps" role="group" aria-label="Solution steps">
        {hunt.steps.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`hunt-step ${found && i === hunt.wrongStep ? 'wrong' : ''} ${!found && lastTap === i ? 'fine' : ''}`}
            aria-label={`Step ${i + 1}`}
            aria-pressed={found && i === hunt.wrongStep}
            disabled={found}
            onClick={() => tap(i)}
          >
            <span className="n">{i + 1}</span>
            <span>{s}</span>
          </button>
        ))}
      </div>

      {!found && lastTap !== null && (
        <div className="card blue" role="status">That step is fine — look again. Which line does not follow the rule?</div>
      )}

      {found && !result && (
        <div className="stack">
          <div className="card orange">
            <b>Found it!</b> Step {hunt.wrongStep + 1} is the slip. Now pick the fix.
          </div>
          <div className="choices" role="radiogroup" aria-label="Choose the fix">
            {hunt.fixOptions.map((o, i) => (
              <button key={i} type="button" role="radio" aria-checked={fix === String(i)} className={`choice ${fix === String(i) ? 'selected' : ''}`} onClick={() => setFix(String(i))}>
                {o}
              </button>
            ))}
          </div>
          <Button block big disabled={!fix} onClick={check}>Check</Button>
        </div>
      )}

      {result && (
        <div className={`feedback ${result === 'ok' ? 'ok' : 'notyet'}`} role="status">
          <div className="row">
            <Mascot mood={result === 'ok' ? 'cheer' : 'think'} size={56} />
            <div className="grow">
              <h2>{result === 'ok' ? 'You fixed it!' : 'Not yet'}</h2>
              <p>{hunt.reason}</p>
              {result !== 'ok' && <p><b>The fix is: {hunt.fixOptions[hunt.correctFix]}</b></p>}
            </div>
          </div>
          <Button block big tone={result === 'ok' ? 'green' : 'orange'} onClick={finish}>Continue</Button>
        </div>
      )}
    </div>
  );
}
