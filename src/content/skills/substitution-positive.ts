import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';

const ID = 'substitution-positive';

export const substitutionPositive: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Substitution with positive numbers',
  short: 'Substitution',
  prerequisites: ['order-of-ops'],
  explain: {
    sentences: [
      'Substitution means swapping a letter for a number and working out the value.',
      'If a = 4, then 2a + 3 is 2 × 4 + 3 = 8 + 3 = 11. Remember 2a means 2 × a.',
      'Letters next to each other also mean multiply: ab is a × b.',
      'Follow the order of operations: multiply first, then add or subtract.',
    ],
    rule: 'Swap the letter for its number, multiply first, then add or subtract.',
    picture: { type: 'table', headers: ['expression', 'with a = 4, b = 3'], rows: [['2a + b', '2 × 4 + 3 = 11'], ['ab', '4 × 3 = 12'], ['5a − 2b', '20 − 6 = 14']] },
  },
  examples: [
    { problem: 'If a = 4 and b = 3, work out 2a + b.', steps: ['Put the numbers in: 2 × 4 + 3', '2 × 4 = 8', '8 + 3 = 11'], answer: '11' },
    { problem: 'If p = 5 and q = 2, work out 3p − 4q.', steps: ['Put the numbers in: 3 × 5 − 4 × 2', '3 × 5 = 15; 4 × 2 = 8', '15 − 8 = 7'], answer: '7' },
  ],
  faded: [
    { problem: 'If x = 6, work out 4x − 5.', steps: [{ prompt: '4 × 6 = ?', answer: { kind: 'number', value: 24 }, answerText: '24' }, { prompt: '24 − 5 = ?', answer: { kind: 'number', value: 19 }, answerText: '19' }] },
    { problem: 'If a = 3 and b = 7, work out ab + a.', steps: [{ given: 'ab means a × b' }, { prompt: '3 × 7 = ?', answer: { kind: 'number', value: 21 }, answerText: '21' }, { prompt: '21 + 3 = ?', answer: { kind: 'number', value: 24 }, answerText: '24' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const a = rng.int(2, level === 1 ? 6 : 9), b = rng.int(2, level === 1 ? 6 : 9);
    const k = rng.int(2, 5), m = rng.int(1, 9);
    const kind = level === 1 ? rng.int(0, 1) : level === 2 ? rng.int(1, 3) : rng.int(3, 5);
    let text = '', r = 0, steps: string[] = [], traps: Trap[] = [];
    let j = 0;
    if (kind === 0) { r = k * a + m; text = `If a = ${a}, work out ${k}a + ${m}.`; steps = [`Put the number in: ${k} × ${a} + ${m}`, `${k} × ${a} = ${k * a}`, `${k * a} + ${m} = ${r}`]; traps = [{ value: Number(`${k}${a}`) + m, misconception: 'digits' }, { value: k + a + m, misconception: 'added' }, { value: k * (a + m), misconception: 'order' }]; }
    else if (kind === 1) { r = k * a + b; text = `If a = ${a} and b = ${b}, work out ${k}a + b.`; steps = [`Put the numbers in: ${k} × ${a} + ${b}`, `${k} × ${a} = ${k * a}`, `${k * a} + ${b} = ${r}`]; traps = [{ value: Number(`${k}${a}`) + b, misconception: 'digits' }, { value: k + a + b, misconception: 'added' }]; }
    else if (kind === 2) { r = a * b; text = `If a = ${a} and b = ${b}, work out ab.`; steps = ['ab means a × b', `${a} × ${b} = ${r}`]; traps = [{ value: Number(`${a}${b}`), misconception: 'digits' }, { value: a + b, misconception: 'added' }]; }
    else if (kind === 3) { j = rng.int(2, 4); r = k * a - j * b; if (r < 0) return this.generate(level, rng); text = `If a = ${a} and b = ${b}, work out ${k}a − ${j}b.`; steps = [`Put the numbers in: ${k} × ${a} − ${j} × ${b}`, `${k} × ${a} = ${k * a}; ${j} × ${b} = ${j * b}`, `${k * a} − ${j * b} = ${r}`]; traps = [{ value: (k * a - j) * b, misconception: 'order' }, { value: k * a + j * b, misconception: 'sign' }]; }
    else if (kind === 4) { r = a * a + b; text = `If a = ${a} and b = ${b}, work out a² + b.`; steps = [`a² means a × a: ${a} × ${a} = ${a * a}`, `${a * a} + ${b} = ${r}`]; traps = [{ value: 2 * a + b, misconception: 'square-as-double', message: `a² is a × a = ${a * a}, not 2 × a.` }]; }
    else { r = k * (a + b); text = `If a = ${a} and b = ${b}, work out ${k}(a + b).`; steps = [`Brackets first: ${a} + ${b} = ${a + b}`, `${k}(a + b) means ${k} × ${a + b} = ${r}`]; traps = [{ value: k * a + b, misconception: 'brackets', message: `${k}(a + b) multiplies the whole bracket: ${k} × (${a} + ${b}).` }]; }
    return { ...base, params: { a, b, k, m, kind, j }, text, answer: { kind: 'number', value: r }, answerText: String(r), hint: 'A number next to a letter means multiply. Multiply first.', steps, traps: traps.filter((t) => t.value !== r) };
  },
  compute: ({ a, b, k, m, kind, j }) => {
    switch (kind) {
      case 0: return k * a + m;
      case 1: return k * a + b;
      case 2: return a * b;
      case 3: return k * a - j * b;
      case 4: return a * a + b;
      case 5: return k * (a + b);
      default: return NaN;
    }
  },
  mistakes: [
    { problem: 'If x = 7, work out 3x + 1.', steps: ['3x with x = 7 is 37', '37 + 1 = 38'], wrongStep: 0, reason: '3x means 3 × x = 3 × 7 = 21, so 21 + 1 = 22.', fixOptions: ['3 × 7 = 21, so 21 + 1 = 22', '3x with x = 7 is 37', '3 + 7 + 1 = 11'], correctFix: 0 },
    { problem: 'If a = 5 and b = 2, work out ab.', steps: ['ab means a + b', '5 + 2 = 7'], wrongStep: 0, reason: 'Letters next to each other multiply: ab = 5 × 2 = 10.', fixOptions: ['ab means a × b: 5 × 2 = 10', 'ab means a + b: 7', 'ab means 52'], correctFix: 0 },
    { problem: 'If y = 4, work out 2y + 6.', steps: ['4 + 6 = 10', '2 × 10 = 20'], wrongStep: 0, reason: 'Multiply first: 2 × 4 = 8, then 8 + 6 = 14.', fixOptions: ['2 × 4 = 8, then 8 + 6 = 14', '4 + 6 = 10, then 2 × 10 = 20', '2 + 4 + 6 = 12'], correctFix: 0 },
  ],
  misconceptions: {
    digits: 'A number next to a letter means multiply, not write the digits together.',
    added: 'A number next to a letter means multiply, not add.',
    order: 'Multiply before you add or subtract.',
    sign: 'Check whether the expression adds or subtracts the second part.',
    'square-as-double': 'A square means the number times itself, not times 2.',
    brackets: 'A number outside brackets multiplies everything inside them.',
  },
};
