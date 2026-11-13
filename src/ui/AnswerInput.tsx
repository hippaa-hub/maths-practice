import { useEffect, useRef } from 'react';
import type { AnswerSpec } from '../engine/answers';
import { Keypad } from './Keypad';

export function unitFor(spec: AnswerSpec): string {
  if (spec.kind === 'money') return 'GEL';
  if (spec.kind === 'percent') return '%';
  return '';
}

/** A typed-answer box with the on-screen keypad. Hardware keyboards work too. */
export function AnswerInput({ value, onChange, onSubmit, spec, label = 'Your answer', autoFocus = true }: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  spec: AnswerSpec;
  label?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  const unit = unitFor(spec);
  return (
    <div className="stack">
      <div className="answer-box">
        <input
          ref={ref}
          className="answer-input"
          aria-label={label}
          inputMode="none"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onSubmit(); }}
        />
        {unit && <span className="answer-unit">{unit}</span>}
      </div>
      <Keypad
        onKey={(k) => onChange(value + k)}
        onDelete={() => onChange(value.slice(0, -1))}
        allowFraction={spec.kind !== 'money' && spec.kind !== 'ratio' && spec.kind !== 'expression'}
        allowPercent={spec.kind === 'percent' || (!!spec.acceptEquivalents && spec.kind !== 'ratio')}
        mode={spec.kind === 'ratio' ? 'ratio' : spec.kind === 'expression' ? 'expression' : 'number'}
        letters={spec.letters}
      />
    </div>
  );
}
