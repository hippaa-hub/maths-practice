import { useState } from 'react';
import type { FadedStep, Question, Skill } from '../content/types';
import { checkAnswer } from '../engine/answers';
import type { Level, Outcome } from '../engine/types';
import { AnswerInput } from './AnswerInput';
import { Button } from './Button';
import { Picture } from './Picture';
import { QuestionView } from './QuestionView';
import { Steps } from './Steps';

type Stage = 'learn' | 'faded' | 'solo';
const SOLO_COUNT = 3;

interface Props {
  skill: Skill;
  /** Makes a question she has not seen before. */
  generate: (level: Level) => Question;
  onSolo: (q: Question, outcome: Outcome, timeMs: number, leftApp?: boolean) => void;
  onFaded: (correct: boolean, timeMs: number) => void;
  onDone: () => void;
}

/** Three stages for a new skill: Learn, Try with help, Solo. */
export function Lesson({ skill, generate, onSolo, onFaded, onDone }: Props) {
  const [stage, setStage] = useState<Stage>('learn');
  return (
    <div className="stack">
      <div className="tabs" aria-label="Lesson stages">
        {(['learn', 'faded', 'solo'] as Stage[]).map((s, i) => (
          <span key={s} className={`tab ${s === stage ? 'on' : i < ['learn', 'faded', 'solo'].indexOf(stage) ? 'done' : ''}`}>
            {s === 'learn' ? 'Learn' : s === 'faded' ? 'Try with help' : 'Solo'}
          </span>
        ))}
      </div>
      {stage === 'learn' && <Learn skill={skill} onNext={() => setStage('faded')} />}
      {stage === 'faded' && <Faded skill={skill} onFaded={onFaded} onNext={() => setStage('solo')} />}
      {stage === 'solo' && <Solo skill={skill} generate={generate} onSolo={onSolo} onDone={onDone} />}
    </div>
  );
}

function Learn({ skill, onNext }: { skill: Skill; onNext: () => void }) {
  const [ex, setEx] = useState(0);
  const [shown, setShown] = useState(1);
  const example = skill.examples[ex];
  const allShown = shown >= example.steps.length;
  const lastExample = ex >= skill.examples.length - 1;
  return (
    <div className="stack">
      <div className="card stack">
        <span className="chip">New skill</span>
        <h1>{skill.title}</h1>
        {skill.explain.sentences.map((s, i) => <p key={i}>{s}</p>)}
        <p className="rule">{skill.explain.rule}</p>
        <Picture spec={skill.explain.picture} />
      </div>
      <div className="card purple stack">
        <span className="chip">Example {ex + 1} of {skill.examples.length}</span>
        <p className="qtext">{example.problem}</p>
        <Steps steps={example.steps} shown={shown} />
        {allShown && <p><b>Answer: {example.answer}</b></p>}
        {!allShown ? (
          <Button tone="blue" block onClick={() => setShown(shown + 1)}>Next step</Button>
        ) : !lastExample ? (
          <Button tone="blue" block onClick={() => { setEx(ex + 1); setShown(1); }}>Next example</Button>
        ) : (
          <Button block big onClick={onNext}>Try with help</Button>
        )}
      </div>
    </div>
  );
}

function Faded({ skill, onFaded, onNext }: { skill: Skill; onFaded: (correct: boolean, timeMs: number) => void; onNext: () => void }) {
  const [fi, setFi] = useState(0);
  const [si, setSi] = useState(0);
  const [typed, setTyped] = useState('');
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState<'open' | 'notyet' | 'done' | 'shown'>('open');
  const [started, setStarted] = useState(Date.now());
  const problem = skill.faded[fi];
  const steps = problem.steps;
  const current = steps[si] as FadedStep | undefined;
  const finished = si >= steps.length;
  const lastProblem = fi >= skill.faded.length - 1;

  function advance() {
    setSi(si + 1);
    setTyped('');
    setTries(0);
    setStatus('open');
    setStarted(Date.now());
  }
  function check() {
    if (!current || !('prompt' in current) || !typed.trim()) return;
    if (checkAnswer(typed, current.answer)) {
      onFaded(tries === 0, Date.now() - started);
      setStatus('done');
    } else if (tries === 0) {
      setTries(1);
      setStatus('notyet');
    } else {
      onFaded(false, Date.now() - started);
      setStatus('shown');
    }
  }

  return (
    <div className="stack">
      <div className="card stack">
        <span className="chip">Try with help · {fi + 1} of {skill.faded.length}</span>
        <p className="qtext">{problem.problem}</p>
        <ol className="steps">
          {steps.slice(0, Math.min(si + 1, steps.length)).map((s, i) => (
            <li key={i}>
              <span className="n">{i + 1}</span>
              {'given' in s ? (
                <span>{s.given}</span>
              ) : i < si || status === 'done' || status === 'shown' ? (
                <span className={status === 'shown' && i === si ? '' : ''}>{s.prompt.replace('?', s.answerText.replace(/ \(.*\)$/, ''))} {i === si && status === 'done' && '✓'}</span>
              ) : (
                <span>{s.prompt}</span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {!finished && current && 'given' in current && (
        <Button tone="blue" block onClick={advance}>Next</Button>
      )}

      {!finished && current && 'prompt' in current && status !== 'done' && status !== 'shown' && (
        <div className="faded-blank">
          {status === 'notyet' && <p><b>Not yet.</b> {current.hint ?? 'Have one more go.'}</p>}
          <AnswerInput value={typed} onChange={setTyped} onSubmit={check} spec={current.answer} label="Fill in the blank" />
          <Button block disabled={!typed.trim()} onClick={check}>Check</Button>
        </div>
      )}

      {!finished && current && 'prompt' in current && (status === 'done' || status === 'shown') && (
        <div className={`faded-blank ${status === 'done' ? 'done' : ''}`}>
          <p>{status === 'done' ? <b>That's it!</b> : <><b>Not yet.</b> The answer is <b>{current.answerText}</b> — look at the step above.</>}</p>
          <Button block onClick={advance}>Next</Button>
        </div>
      )}

      {finished && (
        <Button block big onClick={() => {
          if (lastProblem) onNext();
          else { setFi(fi + 1); setSi(0); setTyped(''); setTries(0); setStatus('open'); setStarted(Date.now()); }
        }}>
          {lastProblem ? 'Solo time' : 'Next problem'}
        </Button>
      )}
    </div>
  );
}

function Solo({ skill, generate, onSolo, onDone }: { skill: Skill; generate: Props['generate']; onSolo: Props['onSolo']; onDone: () => void }) {
  const [n, setN] = useState(0);
  const [q, setQ] = useState<Question>(() => generate(1));
  return (
    <div className="stack">
      <p className="muted small center">Solo · question {n + 1} of {SOLO_COUNT}</p>
      <QuestionView
        key={n}
        question={q}
        skillTitle={skill.title}
        misconceptions={skill.misconceptions}
        continueLabel={n + 1 >= SOLO_COUNT ? 'Finish lesson' : 'Continue'}
        onDone={({ outcome, timeMs, leftApp }) => {
          onSolo(q, outcome, timeMs, leftApp);
          if (n + 1 >= SOLO_COUNT) { onDone(); return; }
          setQ(generate(1));
          setN(n + 1);
        }}
      />
    </div>
  );
}
