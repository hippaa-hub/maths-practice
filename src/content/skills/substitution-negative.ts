import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { fmt } from '../util';

const ID = 'substitution-negative';
const neg = (n: number) => fmt(n).replace('-', '−');
const br = (n: number) => (n < 0 ? `(${neg(n)})` : neg(n));

export const substitutionNegative: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Substitution with negative numbers and brackets',
  short: 'Substitution (−)',
  prerequisites: ['substitution-positive', 'neg-mul-div'],
  explain: {
    sentences: [
      'When the number is negative, put it in brackets as you substitute: if x = −3, then 2x + 7 is 2 × (−3) + 7.',
      'Then use the sign rules: 2 × (−3) = −6, and −6 + 7 = 1.',
      'Subtracting a negative becomes adding: 4 − x with x = −3 is 4 − (−3) = 4 + 3 = 7.',
      'The brackets stop you losing the minus sign.',
    ],
    rule: 'Put the negative number in brackets, then use the sign rules carefully.',
    picture: { type: 'table', headers: ['expression', 'with x = −3'], rows: [['2x + 7', '2 × (−3) + 7 = 1'], ['4 − x', '4 − (−3) = 7'], ['x² + 1', '(−3) × (−3) + 1 = 10']] },
  },
  examples: [
    { problem: 'If x = −3, work out 2x + 7.', steps: ['Put −3 in brackets: 2 × (−3) + 7', '2 × (−3) = −6', '−6 + 7 = 1'], answer: '1' },
    { problem: 'If x = −3, work out 4 − x.', steps: ['Put −3 in brackets: 4 − (−3)', 'Minus a negative is a plus: 4 + 3', '4 + 3 = 7'], answer: '7' },
  ],
  faded: [
    { problem: 'If y = −2, work out 5y + 12.', steps: [{ given: 'Put −2 in brackets: 5 × (−2) + 12' }, { prompt: '5 × (−2) = ?', answer: { kind: 'number', value: -10 }, answerText: '−10' }, { prompt: '−10 + 12 = ?', answer: { kind: 'number', value: 2 }, answerText: '2' }] },
    { problem: 'If a = −4, work out 3(a + 6).', steps: [{ prompt: 'Brackets first: −4 + 6 = ?', answer: { kind: 'number', value: 2 }, answerText: '2' }, { prompt: '3 × 2 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const x = -rng.int(1, level === 1 ? 5 : 9);
    const k = rng.int(2, 6), m = rng.int(1, 12);
    const kind = level === 1 ? rng.int(0, 1) : level === 2 ? rng.int(1, 3) : rng.int(3, 5);
    let text = '', r = 0, steps: string[] = [], traps: Trap[] = [];
    if (kind === 0) { r = k * x + m; text = `If x = ${neg(x)}, work out ${k}x + ${m}.`; steps = [`Put ${neg(x)} in brackets: ${k} × ${br(x)} + ${m}`, `${k} × ${br(x)} = ${neg(k * x)}`, `${neg(k * x)} + ${m} = ${neg(r)}`]; traps = [{ value: k * -x + m, misconception: 'lost-sign' }, { value: -r, misconception: 'sign' }]; }
    else if (kind === 1) { r = m - x; text = `If x = ${neg(x)}, work out ${m} − x.`; steps = [`Put ${neg(x)} in brackets: ${m} − ${br(x)}`, `Minus a negative is a plus: ${m} + ${-x}`, `${m} + ${-x} = ${neg(r)}`]; traps = [{ value: m + x, misconception: 'double-sign', message: `${m} − (${neg(x)}) is ${m} + ${-x}: minus a negative is a plus.` }]; }
    else if (kind === 2) { r = k * x - m; text = `If x = ${neg(x)}, work out ${k}x − ${m}.`; steps = [`Put ${neg(x)} in brackets: ${k} × ${br(x)} − ${m}`, `${k} × ${br(x)} = ${neg(k * x)}`, `${neg(k * x)} − ${m} = ${neg(r)}`]; traps = [{ value: k * -x - m, misconception: 'lost-sign' }, { value: k * x + m, misconception: 'sign' }]; }
    else if (kind === 3) { r = k * (x + m); text = `If x = ${neg(x)}, work out ${k}(x + ${m}).`; steps = [`Brackets first: ${neg(x)} + ${m} = ${neg(x + m)}`, `${k} × ${br(x + m)} = ${neg(r)}`]; traps = [{ value: k * x + m, misconception: 'brackets' }, { value: -r, misconception: 'sign' }]; }
    else if (kind === 4) { r = x * x + m; text = `If x = ${neg(x)}, work out x² + ${m}.`; steps = [`x² means x × x: ${br(x)} × ${br(x)} = ${x * x}`, `${x * x} + ${m} = ${r}`]; traps = [{ value: -(x * x) + m, misconception: 'square-sign', message: `(${neg(x)})² is positive: a negative times a negative.` }, { value: 2 * x + m, misconception: 'square-as-double' }]; }
    else { const y = rng.int(1, 6); r = k * x - m * y + 0; text = `If x = ${neg(x)} and y = ${y}, work out ${k}x − ${m}y.`; steps = [`Put the numbers in: ${k} × ${br(x)} − ${m} × ${y}`, `${k} × ${br(x)} = ${neg(k * x)}; ${m} × ${y} = ${m * y}`, `${neg(k * x)} − ${m * y} = ${neg(r)}`]; traps = [{ value: k * -x - m * y, misconception: 'lost-sign' }, { value: k * x + m * y, misconception: 'sign' }]; return { ...base, params: { x, k, m, kind, y }, text, answer: { kind: 'number', value: r }, answerText: neg(r), hint: 'Put the negative number in brackets first.', steps, traps: traps.filter((t) => t.value !== r) }; }
    return { ...base, params: { x, k, m, kind, y: 0 }, text, answer: { kind: 'number', value: r }, answerText: neg(r), hint: `Write ${neg(x)} in brackets where the letter is, then use the sign rules.`, steps, traps: traps.filter((t) => t.value !== r) };
  },
  compute: ({ x, k, m, kind, y }) => {
    switch (kind) {
      case 0: return k * x + m;
      case 1: return m - x;
      case 2: return k * x - m;
      case 3: return k * (x + m);
      case 4: return x * x + m;
      default: return k * x - m * y;
    }
  },
  mistakes: [
    { problem: 'If x = −4, work out 3x + 5.', steps: ['3 × 4 = 12', '12 + 5 = 17'], wrongStep: 0, reason: 'x is −4, so 3 × (−4) = −12, and −12 + 5 = −7. The minus sign was lost.', fixOptions: ['3 × (−4) = −12, then −12 + 5 = −7', '3 × 4 = 12, then 12 + 5 = 17', '3 − 4 + 5 = 4'], correctFix: 0 },
    { problem: 'If x = −2, work out 10 − x.', steps: ['10 − (−2) = 10 − 2', '10 − 2 = 8'], wrongStep: 0, reason: 'Minus a negative is a plus: 10 − (−2) = 10 + 2 = 12.', fixOptions: ['10 − (−2) = 10 + 2 = 12', '10 − (−2) = 10 − 2 = 8', '10 − (−2) = −12'], correctFix: 0 },
    { problem: 'If x = −5, work out x² + 1.', steps: ['x² = (−5) × (−5) = −25', '−25 + 1 = −24'], wrongStep: 0, reason: 'A negative times a negative is positive: (−5)² = 25, so 25 + 1 = 26.', fixOptions: ['(−5) × (−5) = 25, so 25 + 1 = 26', '(−5) × (−5) = −25', 'x² = 2 × (−5) = −10'], correctFix: 0 },
  ],
  misconceptions: {
    'lost-sign': 'The number is negative. Put it in brackets so the minus sign is not lost.',
    sign: 'Check the sign rules: different signs make a negative, same signs make a positive.',
    'double-sign': 'Minus a negative is a plus.',
    brackets: 'Work out the bracket first, then multiply the whole thing.',
    'square-sign': 'Squaring a negative number gives a positive answer.',
    'square-as-double': 'A square means the number times itself, not times 2.',
  },
};
