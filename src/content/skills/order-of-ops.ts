import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { fmt } from '../util';

const ID = 'order-of-ops';

export const orderOfOps: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Order of operations',
  short: 'BIDMAS',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'When a calculation has several parts, there is an agreed order so everyone gets the same answer.',
      'Brackets first. Then indices (squares). Then multiply and divide, from left to right. Then add and subtract, from left to right.',
      'So 3 + 4 × 5 is 3 + 20 = 23, not 7 × 5 = 35.',
      'People remember it as BIDMAS: Brackets, Indices, Division and Multiplication, Addition and Subtraction.',
    ],
    rule: 'Brackets, then squares, then × and ÷, then + and −.',
    picture: { type: 'table', headers: ['B', 'I', 'DM', 'AS'], rows: [['( )', 'x²', '× ÷', '+ −'], ['first', 'second', 'third', 'last']] },
  },
  examples: [
    {
      problem: 'Work out 3 + 4 × 5.',
      steps: ['Multiply first: 4 × 5 = 20', 'Then add: 3 + 20 = 23'],
      answer: '23',
    },
    {
      problem: 'Work out (3 + 4) × 5.',
      steps: ['Brackets first: 3 + 4 = 7', 'Then multiply: 7 × 5 = 35'],
      answer: '35',
    },
  ],
  faded: [
    {
      problem: 'Work out 20 − 2 × 6.',
      steps: [
        { prompt: 'Multiply first: 2 × 6 = ?', answer: { kind: 'number', value: 12 }, answerText: '12' },
        { prompt: 'Then subtract: 20 − 12 = ?', answer: { kind: 'number', value: 8 }, answerText: '8' },
      ],
    },
    {
      problem: 'Work out 4 × (9 − 3) + 2.',
      steps: [
        { prompt: 'Brackets first: 9 − 3 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' },
        { given: 'Then multiply: 4 × 6 = 24' },
        { prompt: 'Then add: 24 + 2 = ?', answer: { kind: 'number', value: 26 }, answerText: '26' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const traps = (r: number, ...wrong: Array<[number, string]>): Trap[] =>
      wrong.map(([value, misconception]) => ({ value, misconception })).filter((t) => t.value !== r && Number.isFinite(t.value));
    if (level === 1) {
      const kind = rng.int(0, 2);
      const a = rng.int(2, 12), b = rng.int(2, 9), c = rng.int(2, 9);
      if (kind === 0) {
        const r = a + b * c;
        return { ...base, params: { a, b, c, d: 0, kind }, text: `Work out ${a} + ${b} × ${c}.`, answer: { kind: 'number', value: r }, answerText: fmt(r),
          hint: 'Multiply before you add.', steps: [`Multiply first: ${b} × ${c} = ${b * c}`, `Then add: ${a} + ${b * c} = ${r}`],
          traps: traps(r, [(a + b) * c, 'left-to-right']) };
      }
      if (kind === 1) {
        const r = (a + b) * c;
        return { ...base, params: { a, b, c, d: 0, kind }, text: `Work out (${a} + ${b}) × ${c}.`, answer: { kind: 'number', value: r }, answerText: fmt(r),
          hint: 'Brackets first.', steps: [`Brackets first: ${a} + ${b} = ${a + b}`, `Then multiply: ${a + b} × ${c} = ${r}`],
          traps: traps(r, [a + b * c, 'ignored-brackets']) };
      }
      const big = a * b + c;
      const r = big - b * c;
      return { ...base, params: { a: big, b, c, d: 0, kind }, text: `Work out ${big} − ${b} × ${c}.`, answer: { kind: 'number', value: r }, answerText: fmt(r),
        hint: 'Multiply before you subtract.', steps: [`Multiply first: ${b} × ${c} = ${b * c}`, `Then subtract: ${big} − ${b * c} = ${r}`],
        traps: traps(r, [(big - b) * c, 'left-to-right']) };
    }
    if (level === 2) {
      const kind = rng.int(3, 4);
      const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9), d = rng.int(1, c - 1 < 1 ? 1 : c - 1);
      if (kind === 3) {
        const r = a * b + c * d;
        return { ...base, params: { a, b, c, d, kind }, text: `Work out ${a} × ${b} + ${c} × ${d}.`, answer: { kind: 'number', value: r }, answerText: fmt(r),
          hint: 'Do both multiplications first, then add.', steps: [`${a} × ${b} = ${a * b}`, `${c} × ${d} = ${c * d}`, `${a * b} + ${c * d} = ${r}`],
          traps: traps(r, [(a * b + c) * d, 'left-to-right']) };
      }
      const r = a + b * (c - d);
      return { ...base, params: { a, b, c, d, kind }, text: `Work out ${a} + ${b} × (${c} − ${d}).`, answer: { kind: 'number', value: r }, answerText: fmt(r),
        hint: 'Brackets first, then multiply, then add.', steps: [`Brackets first: ${c} − ${d} = ${c - d}`, `Then multiply: ${b} × ${c - d} = ${b * (c - d)}`, `Then add: ${a} + ${b * (c - d)} = ${r}`],
        traps: traps(r, [(a + b) * (c - d), 'left-to-right'], [a + b * c - d, 'ignored-brackets']) };
    }
    const kind = rng.int(5, 6);
    const a = rng.int(2, 9), b = rng.int(2, 7);
    if (kind === 5) {
      const r = a + b * b;
      return { ...base, params: { a, b, c: 0, d: 0, kind }, text: `Work out ${a} + ${b}².`, answer: { kind: 'number', value: r }, answerText: fmt(r),
        hint: `${b}² means ${b} × ${b}. Do the square first.`, steps: [`Square first: ${b}² = ${b} × ${b} = ${b * b}`, `Then add: ${a} + ${b * b} = ${r}`],
        traps: traps(r, [(a + b) * (a + b), 'ignored-brackets'], [a + b * 2, 'square-as-double']) };
    }
    const c = rng.int(2, 4);
    const diff = c * rng.int(2, 5);
    const big = diff + b;
    const r = ((big - b) / c) * a;
    return { ...base, params: { a, b, c, d: big, kind }, text: `Work out (${big} − ${b}) ÷ ${c} × ${a}.`, answer: { kind: 'number', value: r }, answerText: fmt(r),
      hint: 'Brackets first, then ÷ and × from left to right.', steps: [`Brackets first: ${big} − ${b} = ${diff}`, `Then divide: ${diff} ÷ ${c} = ${diff / c}`, `Then multiply: ${diff / c} × ${a} = ${r}`],
      traps: traps(r, [diff / (c * a), 'left-to-right']) };
  },
  compute: ({ a, b, c, d, kind }) => {
    switch (kind) {
      case 0: return a + b * c;
      case 1: return (a + b) * c;
      case 2: return a - b * c;
      case 3: return a * b + c * d;
      case 4: return a + b * (c - d);
      case 5: return a + b * b;
      default: return ((d - b) / c) * a;
    }
  },
  mistakes: [
    {
      problem: 'Work out 2 + 3 × 4.',
      steps: ['Add first: 2 + 3 = 5', 'Then multiply: 5 × 4 = 20'],
      wrongStep: 0,
      reason: 'Multiplication comes before addition. 3 × 4 = 12 first, then 2 + 12 = 14.',
      fixOptions: ['Multiply first: 3 × 4 = 12, then 2 + 12 = 14', 'Add first: 2 + 3 = 5, then 5 × 4 = 20', 'Multiply everything: 2 × 3 × 4 = 24'],
      correctFix: 0,
    },
    {
      problem: 'Work out 5 × (2 + 3).',
      steps: ['5 × 2 = 10', '10 + 3 = 13'],
      wrongStep: 0,
      reason: 'The brackets come first: 2 + 3 = 5, then 5 × 5 = 25.',
      fixOptions: ['Brackets first: 2 + 3 = 5, then 5 × 5 = 25', '5 × 2 = 10, then 10 + 3 = 13', '5 + 2 + 3 = 10'],
      correctFix: 0,
    },
    {
      problem: 'Work out 10 − 4 + 2.',
      steps: ['Add first: 4 + 2 = 6', '10 − 6 = 4'],
      wrongStep: 0,
      reason: 'Adding and subtracting are done from left to right: 10 − 4 = 6, then 6 + 2 = 8.',
      fixOptions: ['Left to right: 10 − 4 = 6, then 6 + 2 = 8', 'Add first: 4 + 2 = 6, then 10 − 6 = 4', '10 − 4 − 2 = 4'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'left-to-right': 'Do not just go left to right. Multiply and divide before you add and subtract.',
    'ignored-brackets': 'Brackets come first, whatever is inside them.',
    'square-as-double': 'A square means multiply the number by itself, not by 2.',
  },
};
