import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';

/**
 * Class topic "Operations with algebraic expressions" (ManageBac task for 27 Nov).
 * The teacher's own pages were not posted, so this practises the topic itself:
 * multiplying a bracket by a number. Replace or adjust when her worksheet is known.
 */
const ID = 'expand-brackets';
/** "3x + 6", "8a − 12", "6x + 6" */
function show(coef: number, letter: string, constant: number): string {
  const first = `${coef === 1 ? '' : coef}${letter}`;
  if (constant === 0) return first;
  return `${first} ${constant < 0 ? '−' : '+'} ${Math.abs(constant)}`;
}

export const expandBrackets: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Expanding brackets',
  short: 'Brackets',
  prerequisites: ['multiply-terms'],
  explain: {
    sentences: [
      '3(x + 2) means 3 × (x + 2): three lots of everything inside the bracket.',
      'Multiply the number outside by each term inside: 3 × x = 3x and 3 × 2 = 6.',
      'So 3(x + 2) = 3x + 6. Keep the + or − sign that was inside the bracket.',
      'If there are more terms after the bracket, collect like terms at the end.',
    ],
    rule: 'Multiply the number outside by every term inside the bracket.',
    picture: { type: 'table', headers: ['×', 'x', '+ 2'], rows: [['3', '3x', '+ 6']] },
  },
  examples: [
    { problem: 'Expand 3(x + 2).', steps: ['3 × x = 3x', '3 × 2 = 6', 'So 3(x + 2) = 3x + 6'], answer: '3x + 6' },
    { problem: 'Expand 4(2a − 3).', steps: ['4 × 2a = 8a', '4 × 3 = 12', 'The sign inside is −, so 4(2a − 3) = 8a − 12'], answer: '8a − 12' },
  ],
  faded: [
    { problem: 'Expand 5(y + 4).', steps: [{ given: '5 × y = 5y' }, { prompt: '5 × 4 = ?', answer: { kind: 'number', value: 20 }, answerText: '20' }, { prompt: 'Answer: ? (type it with y)', answer: { kind: 'expression', value: 0, expression: '5y + 20', letters: ['y'] }, answerText: '5y + 20' }] },
    { problem: 'Expand 2(3p − 7).', steps: [{ prompt: 'Numbers: 2 × 3 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' }, { prompt: '2 × 7 = ?', answer: { kind: 'number', value: 14 }, answerText: '14' }, { prompt: 'Answer: ? (type it with p)', answer: { kind: 'expression', value: 0, expression: '6p - 14', letters: ['p'] }, answerText: '6p − 14' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const u = rng.pick(['x', 'a', 'y', 'n', 'p', 'k']);
    const U = 2; // value used to compare expressions
    const k = rng.int(2, 9);
    const m = level === 1 ? 1 : rng.int(1, 5);
    const c = (level === 1 ? 1 : rng.pick([1, -1])) * rng.int(1, 9);
    const inside = show(m, u, c);
    const bracket = `${k}(${inside})`;
    const expanded = show(k * m, u, k * c);
    const lines = [
      `${k} × ${m === 1 ? '' : m}${u} = ${k * m}${u}`,
      `${k} × ${Math.abs(c)} = ${k * Math.abs(c)}`,
    ];

    if (level === 3) {
      const extra = rng.int(1, 6);
      const text = `${bracket} + ${extra === 1 ? '' : extra}${u}`;
      const answer = show(k * m + extra, u, k * c);
      const value = (k * m + extra) * U + k * c;
      return {
        ...base, params: { value },
        text: `Expand and simplify ${text}.`,
        answer: { kind: 'expression', value, expression: `${k * m + extra}${u}+${k * c}`.replace('+-', '-'), letters: [u] },
        answerText: answer,
        hint: `First multiply out the bracket. Then collect the ${u} terms.`,
        steps: [...lines, `So ${bracket} = ${expanded}`, `Collect the ${u} terms: ${k * m} + ${extra} = ${k * m + extra}`, `Answer: ${answer}`],
        traps: [],
      };
    }

    const value = k * m * U + k * c;
    return {
      ...base, params: { value },
      text: `Expand ${bracket}.`,
      answer: { kind: 'expression', value, expression: `${k * m}${u}+${k * c}`.replace('+-', '-'), letters: [u] },
      answerText: expanded,
      hint: 'Multiply the number outside by each term inside the bracket. Keep the sign from inside.',
      steps: [...lines, `So ${bracket} = ${expanded}`],
      traps: [],
    };
  },
  compute: ({ value }) => value,
  mistakes: [
    { problem: 'Expand 3(x + 2).', steps: ['3 × x = 3x', 'So 3(x + 2) = 3x + 2'], wrongStep: 1, reason: 'The 3 multiplies every term inside, also the 2: 3 × 2 = 6. The answer is 3x + 6.', fixOptions: ['So 3(x + 2) = 3x + 6', 'So 3(x + 2) = 3x + 2', 'So 3(x + 2) = 5x'], correctFix: 0 },
    { problem: 'Expand 5(a − 4).', steps: ['5 × a = 5a', '5 × 4 = 20', 'So 5(a − 4) = 5a + 20'], wrongStep: 2, reason: 'The sign inside the bracket is −, so it stays −: 5a − 20.', fixOptions: ['So 5(a − 4) = 5a − 20', 'So 5(a − 4) = 5a + 20', 'So 5(a − 4) = 5a − 4'], correctFix: 0 },
    { problem: 'Expand 2(4y + 3).', steps: ['2 + 4 = 6, so 6y', '2 × 3 = 6', 'So 6y + 6'], wrongStep: 0, reason: 'Multiply, do not add: 2 × 4y = 8y. The answer is 8y + 6.', fixOptions: ['2 × 4 = 8, so 8y', '2 + 4 = 6, so 6y', '4 − 2 = 2, so 2y'], correctFix: 0 },
  ],
  misconceptions: { 'first-term-only': 'The number outside multiplies every term inside the bracket, not just the first one.', 'lost-sign': 'Keep the + or − sign that was inside the bracket.' },
};
