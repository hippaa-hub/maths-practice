import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';

const ID = 'like-terms';
const neg = (n: number) => String(n).replace('-', '−');

function show(coefs: Record<string, number>, constant: number): string {
  const parts: string[] = [];
  for (const [v, k] of Object.entries(coefs)) {
    if (k === 0) continue;
    const abs = Math.abs(k) === 1 ? '' : String(Math.abs(k));
    parts.push(`${k < 0 ? '−' : parts.length ? '+' : ''} ${abs}${v}`.trim());
  }
  if (constant !== 0) parts.push(`${constant < 0 ? '−' : parts.length ? '+' : ''} ${Math.abs(constant)}`.trim());
  if (!parts.length) return '0';
  return parts.join(' ').replace(/^\+ /, '').replace(/^− /, '−');
}
const machine = (coefs: Record<string, number>, constant: number) => Object.entries(coefs).map(([v, k]) => `${k}${v}`).concat(String(constant)).join('+').replace(/\+-/g, '-');

export const likeTerms: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Collecting like terms',
  short: 'Like terms',
  taught: true,
  prerequisites: ['neg-add-sub'],
  explain: {
    sentences: [
      'Like terms have exactly the same letter: 3a and 4a are like terms, but 3a and 2b are not.',
      'To simplify, add or subtract the numbers in front of matching letters: 3a + 4a = 7a.',
      'Keep the sign with its term: in 5x − 2y − 3x + 7y, the x terms are 5x and −3x (2x), the y terms are −2y and 7y (5y).',
      'Numbers on their own are like terms with each other.',
    ],
    rule: 'Only add or subtract terms with the same letter. The sign in front belongs to the term.',
    picture: { type: 'table', headers: ['a terms', 'b terms', 'numbers'], rows: [['3a + 4a', '2b − b', '+ 5'], ['7a', 'b', '5']] },
  },
  examples: [
    { problem: 'Simplify 3a + 2b + 4a − b.', steps: ['a terms: 3a + 4a = 7a', 'b terms: 2b − b = b', 'So 3a + 2b + 4a − b = 7a + b'], answer: '7a + b' },
    { problem: 'Simplify 5x − 2y − 3x + 7y.', steps: ['x terms: 5x − 3x = 2x', 'y terms: −2y + 7y = 5y', 'So the answer is 2x + 5y'], answer: '2x + 5y' },
  ],
  faded: [
    { problem: 'Simplify 6a + 3 + 2a − 1.', steps: [{ prompt: 'a terms: 6a + 2a = ?a', answer: { kind: 'number', value: 8 }, answerText: '8' }, { prompt: 'numbers: 3 − 1 = ?', answer: { kind: 'number', value: 2 }, answerText: '2' }, { given: 'So 8a + 2' }] },
    { problem: 'Simplify 4x + 5y − x − 2y.', steps: [{ prompt: 'x terms: 4x − x = ?x', answer: { kind: 'number', value: 3 }, answerText: '3' }, { prompt: 'y terms: 5y − 2y = ?y', answer: { kind: 'number', value: 3 }, answerText: '3' }, { prompt: 'Answer: ? (type it with x and y)', answer: { kind: 'expression', value: 0, expression: '3x + 3y', letters: ['x', 'y'] }, answerText: '3x + 3y' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const [u, v] = rng.pick([['a', 'b'], ['x', 'y'], ['p', 'q'], ['m', 'n']]);
    const terms: Array<[string, number]> = [];
    const n = level === 1 ? 3 : level === 2 ? 4 : 5;
    const coefs: Record<string, number> = { [u]: 0, [v]: 0 };
    let constant = 0;
    for (let i = 0; i < n; i++) {
      const letter = level === 1 ? (i < 2 ? u : rng.pick([u, ''])) : rng.pick([u, u, v, v, '']);
      const k = level === 1 ? rng.int(1, 7) : rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7]);
      terms.push([letter, k]);
      if (letter) coefs[letter] += k; else constant += k;
    }
    if (coefs[u] === 0 && coefs[v] === 0) return this.generate(level, rng);
    const text = terms.map(([l, k], i) => `${i === 0 ? (k < 0 ? '−' : '') : k < 0 ? ' − ' : ' + '}${Math.abs(k) === 1 && l ? '' : Math.abs(k)}${l}`).join('');
    const answer = show(coefs, constant);
    const letters = [u, v].filter((l) => coefs[l] !== 0);
    const groups = [u, v].filter((l) => terms.some(([t]) => t === l)).map((l) => `${l} terms: ${terms.filter(([t]) => t === l).map(([, k], i) => (i === 0 ? neg(k) : k < 0 ? `− ${-k}` : `+ ${k}`)).join(' ')} → ${neg(coefs[l])}${l}`);
    const nums = terms.some(([t]) => t === '') ? [`numbers: ${terms.filter(([t]) => t === '').map(([, k], i) => (i === 0 ? neg(k) : k < 0 ? `− ${-k}` : `+ ${k}`)).join(' ')} = ${neg(constant)}`] : [];
    return {
      ...base,
      params: { value: coefs[u] * 2 + coefs[v] * 3 + constant },
      text: `Simplify ${text}.`,
      answer: { kind: 'expression', value: coefs[u] * 2 + coefs[v] * 3 + constant, expression: machine(coefs, constant), letters: letters.length ? letters : [u] },
      answerText: answer,
      hint: `Collect the ${u} terms together, then the ${v} terms, then the plain numbers. Keep each sign with its term.`,
      steps: [...groups, ...nums, `So ${text} = ${answer}`],
      traps: [],
    };
  },
  compute: ({ value }) => value,
  variety: 15,
  mistakes: [
    { problem: 'Simplify 3a + 2b.', steps: ['3a + 2b = 5ab'], wrongStep: 0, reason: 'a and b are different letters, so they cannot be added together. 3a + 2b is already as simple as it gets.', fixOptions: ['3a + 2b cannot be simplified', '3a + 2b = 5ab', '3a + 2b = 5'], correctFix: 0 },
    { problem: 'Simplify 5x − 2x + 4.', steps: ['5x − 2x = 3x', '3x + 4 = 7x'], wrongStep: 1, reason: '4 is a plain number, not an x term: the answer is 3x + 4.', fixOptions: ['3x + 4 stays as it is', '3x + 4 = 7x', '3x + 4 = 7'], correctFix: 0 },
    { problem: 'Simplify 6y − 4 − 2y + 1.', steps: ['y terms: 6y + 2y = 8y', 'numbers: −4 + 1 = −3', 'So 8y − 3'], wrongStep: 0, reason: 'The sign belongs to the term: it is −2y, so 6y − 2y = 4y. Answer 4y − 3.', fixOptions: ['y terms: 6y − 2y = 4y', 'y terms: 6y + 2y = 8y', 'y terms: 6y × 2y'], correctFix: 0 },
  ],
  misconceptions: { 'different-letters': 'Only terms with the same letter can be combined.', 'lost-sign': 'The sign in front of a term belongs to that term.' },
};
