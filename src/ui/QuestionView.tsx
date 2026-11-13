import { useRef, useState } from 'react';
import type { Example, Question } from '../content/types';
import { checkAnswer } from '../engine/answers';
import type { Outcome } from '../engine/types';
import { AnswerInput } from './AnswerInput';
import { Button } from './Button';
import { Mascot } from './Mascot';
import { Picture } from './Picture';
import { Steps } from './Steps';
import { play } from './sounds';

export interface QuestionResult {
  outcome: Outcome;
  misconception?: string;
  timeMs: number;
}

interface Props {
  question: Question;
  skillTitle: string;
  misconceptions: Record<string, string>;
  /** When given, a "Show me an example" button appears (used for skills in box 2). */
  example?: Example;
  onDone: (r: QuestionResult) => void;
  continueLabel?: string;
}

export function QuestionView({ question, skillTitle, misconceptions, example, onDone, continueLabel = 'Continue' }: Props) {
  const [typed, setTyped] = useState('');
  const [hintShown, setHintShown] = useState(false);
  const [exampleShown, setExampleShown] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; message?: string; misconception?: string } | null>(null);
  const started = useRef(Date.now());
  const isChoice = question.answer.kind === 'choice';

  function check() {
    if (!typed.trim() || result) return;
    const correct = checkAnswer(typed, question.answer);
    play(correct ? 'correct' : 'notyet');
    if (correct) { setResult({ correct: true }); return; }
    const trap = question.traps.find((t) => checkAnswer(typed, { ...question.answer, value: t.value, ratio: t.ratio ?? question.answer.ratio, simplest: false, acceptEquivalents: true }));
    setResult({ correct: false, message: trap ? trap.message ?? misconceptions[trap.misconception] : undefined, misconception: trap?.misconception });
  }

  function finish() {
    if (!result) return;
    const outcome: Outcome = !result.correct ? 'miss' : hintShown ? 'hint' : 'correct';
    onDone({ outcome, misconception: result.misconception, timeMs: Date.now() - started.current });
  }

  return (
    <div className="stack">
      <div className="card stack">
        <span className="chip">{skillTitle}</span>
        <p className="qtext">{question.text}</p>
        {question.picture && (!question.revealPicture || result) && <Picture spec={question.picture} />}
      </div>

      {hintShown && (
        <div className="card blue">
          <b>Hint:</b> {question.hint}
        </div>
      )}
      {exampleShown && example && (
        <div className="card purple stack">
          <b>Example: {example.problem}</b>
          <Steps steps={example.steps} />
        </div>
      )}

      {!result && (
        isChoice ? (
          <div className="choices" role="radiogroup" aria-label="Choose an answer">
            {question.choices!.map((c, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={typed === String(i)}
                className={`choice ${typed === String(i) ? 'selected' : ''}`}
                onClick={() => setTyped(String(i))}
              >
                {c}
              </button>
            ))}
          </div>
        ) : (
          <AnswerInput value={typed} onChange={setTyped} onSubmit={check} spec={question.answer} />
        )
      )}

      {!result && (
        <div className="stack">
          <div className="row">
            {!hintShown && <Button tone="ghost" small onClick={() => setHintShown(true)}>Hint</Button>}
            {example && !exampleShown && <Button tone="ghost" small onClick={() => setExampleShown(true)}>Show me an example</Button>}
          </div>
          <Button block big disabled={!typed.trim()} onClick={check}>Check</Button>
        </div>
      )}

      {result && (
        <div className={`feedback ${result.correct ? 'ok' : 'notyet'}`} role="status">
          <div className="row">
            <Mascot mood={result.correct ? 'cheer' : 'think'} size={56} />
            <div className="grow">
              <h2>{result.correct ? (hintShown ? 'Got it, with a hint' : 'Nice!') : 'Not yet'}</h2>
              {!result.correct && <p>{result.message ?? 'Here is the method:'}</p>}
              {!result.correct && <p><b>The answer is {question.answerText}.</b></p>}
            </div>
          </div>
          <Steps steps={question.steps} />
          <Button block big tone={result.correct ? 'green' : 'orange'} onClick={finish}>{continueLabel}</Button>
        </div>
      )}
    </div>
  );
}
