import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { gcd, simplify } from '../util';

const ID = 'fractions-add-sub';
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

export const fractionsAddSub: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Fractions: add and subtract',
  short: 'Fractions + −',
  taught: true,
  prerequisites: ['fractions-simplify'],
  explain: {
    sentences: [
      'You can only add or subtract fractions when the bottom numbers are the same.',
      'If they are different, change them into equivalent fractions with the same bottom number first.',
      'Then add or subtract the top numbers only. The bottom number stays the same.',
      'For example, 2/3 + 1/4: both become twelfths, 8/12 + 3/12 = 11/12.',
    ],
    rule: 'Same bottoms first. Then add or subtract the tops; the bottom stays the same.',
    picture: { type: 'bar', parts: 12, shaded: 11, totalLabel: '8/12 + 3/12', shadedLabel: '11/12' },
  },
  examples: [
    {
      problem: 'Work out 2/3 + 1/4.',
      steps: ['Make the bottoms the same: 3 and 4 both go into 12', '2/3 = 8/12', '1/4 = 3/12', 'Add the tops: 8/12 + 3/12 = 11/12'],
      answer: '11/12',
    },
    {
      problem: 'Work out 5/6 − 1/3.',
      steps: ['Make the bottoms the same: 3 goes into 6', '1/3 = 2/6', 'Subtract the tops: 5/6 − 2/6 = 3/6', 'Simplify: 3/6 = 1/2'],
      answer: '1/2',
    },
  ],
  faded: [
    {
      problem: 'Work out 1/2 + 1/4.',
      steps: [
        { given: 'Make the bottoms the same: 2 goes into 4' },
        { prompt: '1/2 = ?/4', answer: { kind: 'number', value: 2 }, answerText: '2' },
        { prompt: '2/4 + 1/4 = ? (as a fraction)', answer: { kind: 'fraction', value: 0.75, ratio: [3, 4], simplest: true }, answerText: '3/4' },
      ],
    },
    {
      problem: 'Work out 3/4 − 1/6.',
      steps: [
        { given: 'Make the bottoms the same: 4 and 6 both go into 12' },
        { prompt: '3/4 = ?/12', answer: { kind: 'number', value: 9 }, answerText: '9' },
        { prompt: '1/6 = ?/12', answer: { kind: 'number', value: 2 }, answerText: '2' },
        { prompt: '9/12 − 2/12 = ? (as a fraction)', answer: { kind: 'fraction', value: 7 / 12, ratio: [7, 12], simplest: true }, answerText: '7/12' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.5)) return mixedQuestion(rng);
    const op = rng.int(0, 1); // 0 add, 1 subtract
    let a = 1, b = 2, c = 1, d = 4;
    for (let tries = 0; tries < 100; tries++) {
      if (level === 1) {
        // same bottom, or one bottom divides the other
        d = rng.pick([4, 6, 8, 10, 12]);
        b = rng.pick([d, ...[2, 3, 4, 5, 6].filter((x) => d % x === 0 && x < d)]);
        a = rng.int(1, b - 1); c = rng.int(1, d - 1);
      } else if (level === 2) {
        b = rng.pick([2, 3, 4, 5, 6]); d = rng.pick([3, 4, 5, 6, 8, 10]);
        if (b === d) continue;
        a = rng.int(1, b - 1); c = rng.int(1, d - 1);
      } else {
        b = rng.pick([3, 4, 5, 6, 8, 9]); d = rng.pick([4, 6, 8, 9, 10, 12]);
        if (b === d) continue;
        a = rng.int(1, b - 1); c = rng.int(1, d - 1);
      }
      const val = op === 0 ? a / b + c / d : a / b - c / d;
      if (val > 0 && val <= 1 && lcm(b, d) <= 72) break;
    }
    const L = lcm(b, d);
    const na = a * (L / b), nc = c * (L / d);
    const top = op === 0 ? na + nc : na - nc;
    if (top <= 0) return this.generate(level, rng);
    const [sn, sd] = simplify(top, L);
    const value = sn / sd;
    const sym = op === 0 ? '+' : '−';
    const steps: string[] = [];
    if (b === d) steps.push(`The bottoms are already the same (${b})`);
    else {
      steps.push(`Make the bottoms the same: ${b} and ${d} both go into ${L}`);
      if (b !== L) steps.push(`${a}/${b} = ${na}/${L}`);
      if (d !== L) steps.push(`${c}/${d} = ${nc}/${L}`);
    }
    steps.push(`${op === 0 ? 'Add' : 'Subtract'} the tops: ${na}/${L} ${sym} ${nc}/${L} = ${top}/${L}`);
    if (sd !== L) steps.push(`Simplify: ${top}/${L} = ${sn}/${sd}`);
    const traps: Trap[] = [
      { value: (op === 0 ? a + c : a - c) / (op === 0 ? b + d : Math.abs(b - d) || 1), misconception: 'add-bottoms', message: 'Do not add or subtract the bottom numbers. Make them the same first.' },
      { value: (op === 0 ? a + c : a - c) / b, misconception: 'tops-only' },
      { value: top / L === value ? -1 : top / L, misconception: 'not-simplified' },
    ].filter((t) => Number.isFinite(t.value) && t.value > 0 && Math.abs(t.value - value) > 1e-9);
    return {
      ...base,
      params: { a, b, c, d, op },
      text: `Work out ${a}/${b} ${sym} ${c}/${d}. Give your answer in its simplest form.`,
      answer: { kind: 'fraction', value, ratio: [sn, sd], simplest: true },
      answerText: `${sn}/${sd}`,
      hint: b === d ? 'The bottoms are the same, so just work with the tops.' : `What number do ${b} and ${d} both go into?`,
      steps,
      revealPicture: true,
      picture: { type: 'bar', parts: L <= 16 ? L : sd, shaded: L <= 16 ? top : sn, totalLabel: `${sn}/${sd}` },
      traps,
    };
  },
  compute: ({ a, b, c, d, op }) => (op === 0 ? a / b + c / d : a / b - c / d),
  variety: 15,
  mistakes: [
    {
      problem: 'Work out 1/2 + 1/3.',
      steps: ['Add the tops: 1 + 1 = 2', 'Add the bottoms: 2 + 3 = 5', 'So 1/2 + 1/3 = 2/5'],
      wrongStep: 1,
      reason: 'Never add the bottoms. Make them the same first: 3/6 + 2/6 = 5/6.',
      fixOptions: ['Make the bottoms the same: 3/6 + 2/6 = 5/6', 'Add the bottoms: 2 + 3 = 5', 'Multiply the bottoms and keep the tops: 2/6'],
      correctFix: 0,
    },
    {
      problem: 'Work out 3/4 − 1/4.',
      steps: ['The bottoms are the same', 'Subtract the tops: 3 − 1 = 2', 'Subtract the bottoms: 4 − 4 = 0', 'So the answer is 2/0'],
      wrongStep: 2,
      reason: 'The bottom stays the same: 3/4 − 1/4 = 2/4 = 1/2.',
      fixOptions: ['The bottom stays 4: 2/4 = 1/2', 'Subtract the bottoms: 4 − 4 = 0', 'Add the bottoms: 8'],
      correctFix: 0,
    },
    {
      problem: 'Work out 1/6 + 1/3.',
      steps: ['3 goes into 6, so 1/3 = 2/6', '1/6 + 2/6 = 3/6', 'So the answer is 3/6'],
      wrongStep: 2,
      reason: '3/6 is right but not in its simplest form: 3/6 = 1/2.',
      fixOptions: ['Simplify: 3/6 = 1/2', 'So the answer is 3/6', '3/6 = 3/12'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'add-bottoms': 'Never add or subtract the bottom numbers. Make them the same first.',
    'tops-only': 'The bottoms must be the same before you work with the tops.',
    'not-simplified': 'That is right, but the question asks for the simplest form.',
    'wholes-only': 'Change the mixed numbers to improper fractions, then add or subtract everything.',
  },
};

/** Level 3: mixed numbers, e.g. 1 1/2 + 2 3/4. Change to improper fractions first. */
function mixedQuestion(rng: Rng): Question {
  const op = rng.int(0, 1);
  let w1 = 1, a = 1, b = 2, w2 = 2, c = 3, d = 4;
  for (let tries = 0; tries < 100; tries++) {
    b = rng.pick([2, 3, 4, 5, 6, 8]); d = rng.pick([2, 3, 4, 5, 6, 8]);
    a = rng.int(1, b - 1); c = rng.int(1, d - 1);
    w1 = rng.int(1, 4); w2 = rng.int(1, 3);
    if (gcd(a, b) !== 1 || gcd(c, d) !== 1) continue;
    const v = op === 0 ? w1 + a / b + w2 + c / d : w1 + a / b - (w2 + c / d);
    if (v > 0 && lcm(b, d) <= 24) break;
  }
  const n1 = w1 * b + a, n2 = w2 * d + c;
  const L = lcm(b, d);
  const m1 = n1 * (L / b), m2 = n2 * (L / d);
  const top = op === 0 ? m1 + m2 : m1 - m2;
  const [sn, sd] = simplify(top, L);
  const whole = Math.floor(sn / sd), rem = sn - whole * sd;
  const mixedText = sd === 1 ? String(sn) : whole > 0 ? `${whole} ${rem}/${sd}` : `${sn}/${sd}`;
  const sym = op === 0 ? '+' : '−';
  const steps = [
    `Change to improper fractions: ${w1} ${a}/${b} = ${n1}/${b}; ${w2} ${c}/${d} = ${n2}/${d}`,
    ...(b === d ? [] : [`Same bottoms: ${b} and ${d} both go into ${L}`, ...(b !== L ? [`${n1}/${b} = ${m1}/${L}`] : []), ...(d !== L ? [`${n2}/${d} = ${m2}/${L}`] : [])]),
    `${m1}/${L} ${sym} ${m2}/${L} = ${top}/${L}`,
    ...(sd !== L ? [`Simplify: ${top}/${L} = ${sn}/${sd}`] : []),
    ...(whole > 0 && sd !== 1 ? [`As a mixed number: ${sn}/${sd} = ${mixedText}`] : []),
  ];
  return {
    skillId: ID, level: 3,
    params: { a: n1, b, c: n2, d, op },
    text: `Work out ${w1} ${a}/${b} ${sym} ${w2} ${c}/${d}. Give your answer in its simplest form.`,
    answer: { kind: 'fraction', value: sn / sd, ratio: [sn, sd], simplest: true },
    answerText: mixedText,
    hint: 'Change each mixed number into an improper fraction first (whole × bottom + top).',
    steps,
    traps: [
      { value: (op === 0 ? w1 + w2 : w1 - w2) + (op === 0 ? (a + c) / (b + d) : (a - c) / (Math.abs(b - d) || 1)), misconception: 'add-bottoms' },
      { value: op === 0 ? w1 + w2 : w1 - w2, misconception: 'wholes-only', message: 'You handled the whole numbers but not the fraction parts.' },
    ].filter((t) => Number.isFinite(t.value) && t.value > 0 && Math.abs(t.value - sn / sd) > 1e-9),
  };
}
