import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { fmt } from '../util';

const ID = 'squares-of-negatives';
const neg = (n: number) => fmt(n).replace('-', '−');

export const squaresOfNegatives: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: '(−3)² and −3²: squares of negatives',
  short: '(−3)² vs −3²',
  prerequisites: ['neg-mul-div'],
  variety: 12,
  explain: {
    sentences: [
      '(−3)² means (−3) × (−3). A negative times a negative is positive, so (−3)² = 9.',
      '−3² is different: the square only belongs to the 3, so it means −(3 × 3) = −9.',
      'The brackets decide what gets squared. With brackets, the minus sign is squared too; without, it is not.',
      'Any number squared is positive or zero, so a square can never be negative.',
    ],
    rule: 'With brackets, (−3)² = 9. Without brackets, −3² = −9. The brackets say what is squared.',
    picture: { type: 'table', headers: ['', 'means', 'value'], rows: [['(−3)²', '(−3) × (−3)', '9'], ['−3²', '−(3 × 3)', '−9']] },
  },
  examples: [
    { problem: 'Work out (−4)².', steps: ['(−4)² means (−4) × (−4)', 'A negative times a negative is positive', '(−4) × (−4) = 16'], answer: '16' },
    { problem: 'Work out −4².', steps: ['−4² means −(4 × 4): only the 4 is squared', '4 × 4 = 16', 'So −4² = −16'], answer: '−16' },
  ],
  faded: [
    { problem: 'Work out (−6)².', steps: [{ given: '(−6)² means (−6) × (−6)' }, { prompt: '(−6) × (−6) = ?', answer: { kind: 'number', value: 36 }, answerText: '36' }] },
    { problem: 'Work out −6².', steps: [{ given: 'Only the 6 is squared: −(6 × 6)' }, { prompt: '−(6 × 6) = ?', answer: { kind: 'number', value: -36 }, answerText: '−36' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const n = rng.int(2, level === 1 ? 7 : 12);
    const kind = level === 1 ? rng.int(0, 1) : level === 2 ? rng.int(0, 2) : rng.int(2, 3);
    if (kind === 0) {
      return { ...base, params: { n, kind }, text: `Work out (${neg(-n)})².`, answer: { kind: 'number', value: n * n }, answerText: String(n * n), hint: 'The brackets mean the whole −' + n + ' is squared: a negative times a negative.', steps: [`(${neg(-n)})² means (${neg(-n)}) × (${neg(-n)})`, 'A negative times a negative is positive', `(${neg(-n)}) × (${neg(-n)}) = ${n * n}`], traps: [{ value: -n * n, misconception: 'bracket-sign', message: 'With brackets the minus is squared too: negative × negative = positive.' }, { value: -2 * n, misconception: 'square-as-double' }].filter((t) => t.value !== n * n) };
    }
    if (kind === 1) {
      return { ...base, params: { n, kind }, text: `Work out −${n}².`, answer: { kind: 'number', value: -n * n }, answerText: neg(-n * n), hint: `Without brackets only the ${n} is squared.`, steps: [`−${n}² means −(${n} × ${n}): only the ${n} is squared`, `${n} × ${n} = ${n * n}`, `So −${n}² = ${neg(-n * n)}`], traps: [{ value: n * n, misconception: 'no-bracket-sign', message: `Without brackets, the minus is NOT squared: −${n}² = −${n * n}.` }, { value: -2 * n, misconception: 'square-as-double' }].filter((t) => t.value !== -n * n) };
    }
    if (kind === 2) {
      const r = n * n - n * n; // (−n)² − n² = 0
      const m = rng.int(2, 9);
      const r2 = n * n + m;
      return { ...base, params: { n, kind, m }, text: `Work out (${neg(-n)})² + ${m}.`, answer: { kind: 'number', value: r2 }, answerText: String(r2), hint: 'Square first (the bracket makes it positive), then add.', steps: [`(${neg(-n)})² = (${neg(-n)}) × (${neg(-n)}) = ${n * n}`, `${n * n} + ${m} = ${r2}`, `(Note: (${neg(-n)})² − ${n}² would be ${r})`], traps: [{ value: -n * n + m, misconception: 'bracket-sign' }, { value: -2 * n + m, misconception: 'square-as-double' }].filter((t) => t.value !== r2) };
    }
    const m = rng.int(1, 9);
    const r = -n * n + m;
    const traps: Trap[] = [{ value: n * n + m, misconception: 'no-bracket-sign' }, { value: -(n * n + m), misconception: 'sign' }].filter((t) => t.value !== r);
    return { ...base, params: { n, kind, m }, text: `Work out −${n}² + ${m}.`, answer: { kind: 'number', value: r }, answerText: neg(r), hint: `Only the ${n} is squared, so −${n}² is negative. Then add ${m}.`, steps: [`−${n}² means −(${n} × ${n}) = ${neg(-n * n)}`, `${neg(-n * n)} + ${m} = ${neg(r)}`], traps };
  },
  compute: ({ n, kind, m }) => (kind === 0 ? n * n : kind === 1 ? -n * n : kind === 2 ? n * n + m : -n * n + m),
  mistakes: [
    { problem: 'Work out (−5)².', steps: ['(−5)² means −(5 × 5)', 'So (−5)² = −25'], wrongStep: 0, reason: 'The brackets mean the whole −5 is squared: (−5) × (−5) = 25.', fixOptions: ['(−5)² means (−5) × (−5) = 25', '(−5)² means −(5 × 5) = −25', '(−5)² means −5 × 2 = −10'], correctFix: 0 },
    { problem: 'Work out −7².', steps: ['−7² means (−7) × (−7)', 'So −7² = 49'], wrongStep: 0, reason: 'Without brackets only the 7 is squared: −(7 × 7) = −49.', fixOptions: ['−7² means −(7 × 7) = −49', '−7² means (−7) × (−7) = 49', '−7² means −7 × 2 = −14'], correctFix: 0 },
    { problem: 'If x = −2, work out x².', steps: ['x² = −2² = −4'], wrongStep: 0, reason: 'Substitute with brackets: x² = (−2)² = (−2) × (−2) = 4.', fixOptions: ['x² = (−2)² = 4', 'x² = −2² = −4', 'x² = 2 × (−2) = −4'], correctFix: 0 },
  ],
  misconceptions: {
    'bracket-sign': 'With brackets, the minus sign is squared too, so the answer is positive.',
    'no-bracket-sign': 'Without brackets, only the number is squared; the minus stays in front.',
    'square-as-double': 'A square means the number times itself, not times 2.',
    sign: 'Work out the square first, then add the other number carefully.',
  },
};
