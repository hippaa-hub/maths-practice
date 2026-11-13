import { useState } from 'react';
import type { Question, Skill } from '../content/types';
import type { Rng } from '../engine/rng';
import { CHECK_PASS, CHECK_QUESTIONS } from '../engine/spacing';
import type { Outcome } from '../engine/types';
import { Button } from './Button';
import { Mascot } from './Mascot';
import { QuestionView } from './QuestionView';

interface Props {
  skill: Skill;
  rng: Rng;
  onAnswer: (q: Question, outcome: Outcome, timeMs: number) => void;
  onDone: (correct: number) => void;
  onQuestion?: (q: Question) => void;
}

/** Three questions on a skill the class has already taught. 2 right = straight into the review cycle. */
export function QuickCheck({ skill, rng, onAnswer, onDone, onQuestion }: Props) {
  const [n, setN] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [q, setQ] = useState<Question>(() => {
    const first = skill.generate(1, rng);
    onQuestion?.(first);
    return first;
  });

  if (finished) {
    const passed = correct >= CHECK_PASS;
    return (
      <div className={`card ${passed ? 'green' : 'blue'} stack`} role="status">
        <div className="row">
          <Mascot mood={passed ? 'cheer' : 'happy'} size={64} />
          <div className="grow">
            <h2>{passed ? 'You remember this one' : 'Let’s go through this one properly'}</h2>
            <p>
              {passed
                ? `${correct} of ${CHECK_QUESTIONS} right. ${skill.title} goes into your review pile and comes back in 2 days.`
                : `${correct} of ${CHECK_QUESTIONS} right. No problem — the full lesson for ${skill.title} is next in line, with examples first.`}
            </p>
          </div>
        </div>
        <Button block big onClick={() => onDone(correct)}>Continue</Button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card blue">
        <b>Quick check · {skill.title}</b>
        <p className="small">You did this at school. {CHECK_QUESTIONS} questions — get {CHECK_PASS} right and it skips the lesson. Question {n + 1} of {CHECK_QUESTIONS}.</p>
      </div>
      <QuestionView
        key={n}
        question={q}
        skillTitle={skill.title}
        misconceptions={skill.misconceptions}
        continueLabel={n + 1 >= CHECK_QUESTIONS ? 'See result' : 'Continue'}
        onDone={({ outcome, timeMs }) => {
          onAnswer(q, outcome, timeMs);
          const c = correct + (outcome === 'correct' ? 1 : 0);
          setCorrect(c);
          if (n + 1 >= CHECK_QUESTIONS) { setFinished(true); return; }
          const next = skill.generate(1, rng);
          onQuestion?.(next);
          setQ(next);
          setN(n + 1);
        }}
      />
    </div>
  );
}
