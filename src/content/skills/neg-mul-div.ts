import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { fmt } from '../util';

const ID = 'neg-mul-div';
const neg = (n: number) => fmt(n).replace('-', '−');
const br = (n: number) => (n < 0 ? `(${neg(n)})` : neg(n));

export const negMulDiv: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Negative numbers: multiply and divide',
  short: 'Negatives × ÷',
  taught: true,
  prerequisites: ['neg-add-sub'],
  explain: {
    sentences: [
      'To multiply or divide with negatives, first work out the numbers as if they were positive.',
      'Then decide the sign. Same signs (both positive or both negative) give a positive answer.',
      'Different signs (one positive, one negative) give a negative answer.',
      'For example, (−3) × 4 = −12, and (−3) × (−4) = 12.',
    ],
    rule: 'Same signs → positive. Different signs → negative.',
    picture: { type: 'table', headers: ['×', '+', '−'], rows: [['+', '+', '−'], ['−', '−', '+']] },
  },
  examples: [
    {
      problem: 'Work out (−6) × 5.',
      steps: ['Multiply the numbers: 6 × 5 = 30', 'Different signs, so the answer is negative', '(−6) × 5 = −30'],
      answer: '−30',
    },
    {
      problem: 'Work out (−24) ÷ (−4).',
      steps: ['Divide the numbers: 24 ÷ 4 = 6', 'Same signs, so the answer is positive', '(−24) ÷ (−4) = 6'],
      answer: '6',
    },
  ],
  faded: [
    {
      problem: 'Work out 7 × (−3).',
      steps: [
        { given: 'Multiply the numbers: 7 × 3 = 21' },
        { given: 'Different signs, so the answer is negative' },
        { prompt: '7 × (−3) = ?', answer: { kind: 'number', value: -21 }, answerText: '−21' },
      ],
    },
    {
      problem: 'Work out (−30) ÷ 5.',
      steps: [
        { prompt: 'Divide the numbers: 30 ÷ 5 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' },
        { given: 'Different signs, so the answer is negative' },
        { prompt: '(−30) ÷ 5 = ?', answer: { kind: 'number', value: -6 }, answerText: '−6' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level <= 2) {
      const op = level === 1 ? 0 : rng.int(0, 1); // 0 multiply, 1 divide
      const x = rng.int(2, 12), y = rng.int(2, 12);
      const sx = rng.pick([1, -1]), sy = rng.pick([1, -1, -1]);
      const a = sx * (op === 1 ? x * y : x);
      const b = sy * y;
      const r = op === 0 ? a * b : a / b;
      const same = sx === sy;
      const text = `Work out ${br(a)} ${op === 0 ? '×' : '÷'} ${br(b)}.`;
      const traps: Trap[] = [
        { value: -r, misconception: 'wrong-sign', message: same ? 'Same signs give a POSITIVE answer.' : 'Different signs give a NEGATIVE answer.' },
        { value: op === 0 ? a + b : a - b, misconception: 'added' },
      ].filter((t) => t.value !== r);
      return {
        ...base,
        params: { a, b, c: 1, op },
        text,
        answer: { kind: 'number', value: r },
        answerText: neg(r),
        hint: 'Work out the numbers first, then decide the sign: same signs positive, different signs negative.',
        steps: [
          op === 0 ? `Multiply the numbers: ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(r)}` : `Divide the numbers: ${Math.abs(a)} ÷ ${Math.abs(b)} = ${Math.abs(r)}`,
          same ? 'Same signs, so the answer is positive' : 'Different signs, so the answer is negative',
          `${br(a)} ${op === 0 ? '×' : '÷'} ${br(b)} = ${neg(r)}`,
        ],
        traps,
      };
    }
    // level 3: three numbers
    const a = rng.pick([1, -1]) * rng.int(2, 6), b = rng.pick([1, -1]) * rng.int(2, 6), c = rng.pick([1, -1]) * rng.int(2, 5);
    const mid = a * b, r = mid * c;
    return {
      ...base,
      params: { a, b, c, op: 2 },
      text: `Work out ${br(a)} × ${br(b)} × ${br(c)}.`,
      answer: { kind: 'number', value: r },
      answerText: neg(r),
      hint: 'Multiply the first two, decide the sign, then multiply by the third.',
      steps: [`${br(a)} × ${br(b)} = ${neg(mid)}`, `${br(mid)} × ${br(c)} = ${neg(r)}`, `${[a, b, c].filter((n) => n < 0).length % 2 === 0 ? 'An even number of minus signs: positive' : 'An odd number of minus signs: negative'}`],
      traps: [
        { value: -r, misconception: 'wrong-sign', message: 'Count the minus signs: an odd number makes the answer negative, an even number makes it positive.' },
        { value: a + b + c, misconception: 'added' },
      ].filter((t) => t.value !== r),
    };
  },
  compute: ({ a, b, c, op }) => (op === 0 ? a * b : op === 1 ? a / b : a * b * c),
  mistakes: [
    {
      problem: 'Work out (−4) × (−5).',
      steps: ['4 × 5 = 20', 'There is a minus sign, so the answer is negative: (−4) × (−5) = −20'],
      wrongStep: 1,
      reason: 'Two negatives have the SAME sign, and same signs give a positive answer: 20.',
      fixOptions: ['Same signs, so the answer is positive: 20', 'One minus sign makes it negative: −20', 'Add the numbers: −9'],
      correctFix: 0,
    },
    {
      problem: 'Work out (−18) ÷ 3.',
      steps: ['18 ÷ 3 = 6', 'Different signs, so the answer is negative', '(−18) ÷ 3 = −6', 'Check: −6 × 3 = 18'],
      wrongStep: 3,
      reason: 'The check is wrong: −6 × 3 = −18, which does match the question. The answer −6 is right.',
      fixOptions: ['Check: −6 × 3 = −18', 'Check: −6 × 3 = 18', 'Check: 6 × 3 = 18, so the answer is 6'],
      correctFix: 0,
    },
    {
      problem: 'Work out 5 × (−6).',
      steps: ['5 × (−6) means 5 − 6', '5 − 6 = −1'],
      wrongStep: 0,
      reason: 'The × is a multiplication, not a subtraction: 5 × 6 = 30, different signs, so −30.',
      fixOptions: ['5 × (−6): 5 × 6 = 30, different signs, so −30', '5 × (−6) = 5 − 6 = −1', '5 × (−6) = 30'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'wrong-sign': 'Same signs give a positive answer; different signs give a negative answer.',
    added: 'This is a multiplication or division, not an addition.',
  },
};
