import { describe, expect, it } from 'vitest';
import { fmt } from '../engine/answers';
import { createRng } from '../engine/rng';
import type { Level } from '../engine/types';
import { SKILLS } from './index';
import type { Picture, Question } from './types';

/** Everything the learner can see BEFORE answering, apart from the question text itself. */
function visibleBeforeAnswer(q: Question): string[] {
  const out: string[] = [q.hint];
  if (q.picture && !q.revealPicture) out.push(...pictureText(q.picture));
  return out;
}

function pictureText(p: Picture): string[] {
  switch (p.type) {
    case 'bar': return [p.totalLabel ?? '', p.shadedLabel ?? '', p.partLabel ?? ''];
    case 'hundred': return [p.label ?? '', `${p.shaded}`];
    case 'compare': return p.rows.map((r) => r.label);
    case 'doubleLine': return p.bottom.values.map(String);
    case 'pattern': return p.labels ?? [];
    case 'table': return p.rows.flat().map(String);
    case 'numberLine': return [...(p.marks ?? []), p.arrow?.to ?? ''].map(String);
    case 'angles': return p.values.map(String);
    case 'parallel': return p.labels.map((l) => l.text);
    case 'solid': return p.dims.map(String);
    case 'triangleArea': return [String(p.base), String(p.height)];
  }
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** True when `num` appears in `text` as a whole number (not inside another number, fraction or ratio). */
function hasNumber(text: string, num: string, loose = false): boolean {
  // Strict: not part of a fraction (2/1), ratio (5:4), percent (10%) or negative (−1).
  const left = loose ? '(^|\\D)' : '(^|[^\\d./:-])';
  const right = loose ? '(?!\\d)(?!\\.\\d)' : '(?![\\d/:%])(?!\\.\\d)';
  return new RegExp(`${left}${esc(num)}${right}`).test(text.replace(/−/g, '-'));
}

describe.each(SKILLS.map((s) => [s.id, s] as const))('%s never shows the answer before it is given', (_id, skill) => {
  it.each([1, 2, 3] as Level[])('level %i', (level) => {
    const rng = createRng(level * 77 + 5);
    for (let i = 0; i < 500; i++) {
      const q = skill.generate(level, rng);
      if (q.answer.kind === 'choice') continue;
      const exact = q.answer.kind === 'fraction' || q.answer.kind === 'ratio' || q.answer.kind === 'expression';
      const answer = exact ? q.answerText.replace(/−/g, '-') : fmt(q.answer.value);
      const inQuestion = exact ? q.text.includes(answer) : hasNumber(q.text, answer, true);
      if (inQuestion) continue; // the number is part of the question's own data
      for (const shown of visibleBeforeAnswer(q)) {
        const leak = exact && !/^-?\d+$/.test(answer) ? shown.replace(/−/g, '-').includes(answer) : hasNumber(shown, answer);
        expect(leak, `${skill.id} L${level}: "${q.text}"\n  answer ${answer} appears before answering in: "${shown}"`).toBe(false);
      }
    }
  });
});
