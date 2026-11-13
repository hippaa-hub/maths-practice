import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { fmt } from '../util';

const ID = 'table-from-formula';
const neg = (n: number) => fmt(n).replace('-', '−');
const br = (n: number) => (n < 0 ? `(${neg(n)})` : neg(n));

function rule(a: number, b: number, sub: number): string {
  // sub = 1 means b − a x
  if (sub) return `${b} − ${a}x`;
  return b === 0 ? `${a}x` : b > 0 ? `${a}x + ${b}` : `${a}x − ${-b}`;
}

export const tableFromFormula: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Tables from a formula (number machines)',
  short: 'Number machines',
  prerequisites: ['order-of-ops'],
  explain: {
    sentences: [
      'A formula like y = 3x − 1 is a number machine: put a number in for x, and out comes y.',
      'Put x = 4 in: 3 × 4 − 1 = 11. The 3x means 3 times x.',
      'Do it for several inputs and you get a table of values: x = 1, 2, 3, 4 gives y = 2, 5, 8, 11.',
      'Follow the order of operations: multiply first, then add or subtract.',
    ],
    rule: 'Swap x for the number, then multiply before you add or subtract.',
    picture: { type: 'table', headers: ['x', '1', '2', '3', '4'], rows: [['y = 3x − 1', '2', '5', '8', '11']] },
  },
  examples: [
    { problem: 'y = 3x − 1. Find y when x = 4.', steps: ['Put 4 in place of x: 3 × 4 − 1', '3 × 4 = 12', '12 − 1 = 11', 'So y = 11.'], answer: '11' },
    { problem: 'y = 2x + 5. Complete the table for x = 1, 2, 3.', steps: ['x = 1: 2 × 1 + 5 = 7', 'x = 2: 2 × 2 + 5 = 9', 'x = 3: 2 × 3 + 5 = 11'], answer: '7, 9, 11' },
  ],
  faded: [
    { problem: 'y = 4x + 3. Find y when x = 5.', steps: [{ given: 'Put 5 in place of x: 4 × 5 + 3' }, { prompt: '4 × 5 = ?', answer: { kind: 'number', value: 20 }, answerText: '20' }, { prompt: '20 + 3 = ?', answer: { kind: 'number', value: 23 }, answerText: '23' }] },
    { problem: 'y = 10 − 2x. Find y when x = 3.', steps: [{ prompt: '2 × 3 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' }, { prompt: '10 − 6 = ?', answer: { kind: 'number', value: 4 }, answerText: '4' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const a = level === 1 ? rng.int(2, 5) : rng.int(2, 9);
    const b = level === 1 ? rng.int(0, 9) : rng.int(-9, 12);
    const sub = level >= 2 && rng.chance(0.3) ? 1 : 0;
    const x = level === 3 ? rng.pick([-1, -2, -3, -4, 0, 10, 12]) : rng.int(1, level === 1 ? 6 : 12);
    const r = sub ? b - a * x : a * x + b;
    const f = rule(a, b, sub);
    const traps: Trap[] = [
      { value: sub ? b - a + x : a + x + b, misconception: 'added-instead', message: `${a}x means ${a} × x, not ${a} + x.` },
      { value: Number(`${a}${Math.abs(x)}`) + (sub ? 0 : b), misconception: 'digits' },
      { value: sub ? (b - a) * x : a * (x + b), misconception: 'order', message: 'Multiply first, then add or subtract.' },
      { value: -r, misconception: 'sign' },
    ].filter((t) => Number.isFinite(t.value) && t.value !== r);
    const prod = a * x;
    return {
      ...base, params: { a, b, x, sub },
      text: rng.pick([`The number machine is y = ${f}. Find y when x = ${neg(x)}.`, `y = ${f}. What is the output when the input is x = ${neg(x)}?`, `Complete the table for y = ${f}: what is y when x = ${neg(x)}?`]),
      answer: { kind: 'number', value: r }, answerText: neg(r),
      hint: `${a}x means ${a} × ${neg(x)}. Work that out first.`,
      steps: [
        `Put ${neg(x)} in place of x: ${sub ? `${b} − ${a} × ${br(x)}` : `${a} × ${br(x)}${b === 0 ? '' : b > 0 ? ` + ${b}` : ` − ${-b}`}`}`,
        `${a} × ${br(x)} = ${neg(prod)}`,
        sub ? `${b} − ${br(prod)} = ${neg(r)}` : b === 0 ? `So y = ${neg(r)}` : `${neg(prod)} ${b > 0 ? '+' : '−'} ${Math.abs(b)} = ${neg(r)}`,
        `So y = ${neg(r)}.`,
      ],
      picture: { type: 'table', headers: ['x', ...[1, 2, 3].map(String), neg(x)], rows: [[`y = ${f}`, ...[1, 2, 3].map((v) => neg(sub ? b - a * v : a * v + b)), '?']] },
      traps,
    };
  },
  compute: ({ a, b, x, sub }) => (sub ? b - a * x : a * x + b),
  mistakes: [
    { problem: 'y = 5x + 2. Find y when x = 3.', steps: ['Put 3 in: 53 + 2', '53 + 2 = 55'], wrongStep: 0, reason: '5x means 5 × x, so 5 × 3 = 15, then 15 + 2 = 17. Writing the digits next to each other is not multiplying.', fixOptions: ['5 × 3 + 2 = 15 + 2 = 17', '53 + 2 = 55', '5 + 3 + 2 = 10'], correctFix: 0 },
    { problem: 'y = 2x + 6. Find y when x = 4.', steps: ['Add first: 4 + 6 = 10', 'Then multiply: 2 × 10 = 20'], wrongStep: 0, reason: 'Multiply first: 2 × 4 = 8, then 8 + 6 = 14.', fixOptions: ['2 × 4 = 8, then 8 + 6 = 14', 'Add first: 4 + 6 = 10, then × 2 = 20', '2 + 4 + 6 = 12'], correctFix: 0 },
    { problem: 'y = 12 − 3x. Find y when x = 2.', steps: ['3 × 2 = 6', 'y = 6 − 12 = −6'], wrongStep: 1, reason: 'The formula is 12 − 3x, so take 6 away from 12: 12 − 6 = 6.', fixOptions: ['y = 12 − 6 = 6', 'y = 6 − 12 = −6', 'y = 12 + 6 = 18'], correctFix: 0 },
  ],
  misconceptions: {
    'added-instead': 'A number next to x means multiply: 3x is 3 × x.',
    digits: 'Putting the digits side by side is not multiplying. 3x with x = 4 is 3 × 4 = 12, not 34.',
    order: 'Multiply before you add or subtract.',
    sign: 'Check the sign at the end: is the answer positive or negative?',
  },
};
