import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { simplify } from '../util';

const ID = 'fractions-mul-div';

export const fractionsMulDiv: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Fractions: multiply and divide',
  short: 'Fractions × ÷',
  taught: true,
  prerequisites: ['fractions-simplify'],
  explain: {
    sentences: [
      'To multiply fractions, multiply the tops together and multiply the bottoms together. No need for the same bottoms.',
      'For example, 2/3 × 3/4 = 6/12 = 1/2.',
      'To divide by a fraction, flip the second fraction upside down and multiply instead.',
      'For example, 2/3 ÷ 3/4 = 2/3 × 4/3 = 8/9.',
    ],
    rule: 'Multiply: tops × tops, bottoms × bottoms. Divide: flip the second fraction, then multiply.',
    picture: { type: 'bar', parts: 12, shaded: 6, totalLabel: '2/3 × 3/4 = 6/12', shadedLabel: '= 1/2' },
  },
  examples: [
    {
      problem: 'Work out 2/3 × 3/4.',
      steps: ['Multiply the tops: 2 × 3 = 6', 'Multiply the bottoms: 3 × 4 = 12', 'So 2/3 × 3/4 = 6/12', 'Simplify: 6/12 = 1/2'],
      answer: '1/2',
    },
    {
      problem: 'Work out 2/3 ÷ 3/4.',
      steps: ['Flip the second fraction: 3/4 becomes 4/3', 'Now multiply: 2/3 × 4/3', 'Tops: 2 × 4 = 8, bottoms: 3 × 3 = 9', 'So 2/3 ÷ 3/4 = 8/9'],
      answer: '8/9',
    },
  ],
  faded: [
    {
      problem: 'Work out 1/2 × 4/5.',
      steps: [
        { prompt: 'Multiply the tops: 1 × 4 = ?', answer: { kind: 'number', value: 4 }, answerText: '4' },
        { prompt: 'Multiply the bottoms: 2 × 5 = ?', answer: { kind: 'number', value: 10 }, answerText: '10' },
        { prompt: 'Simplify 4/10 = ? (as a fraction)', answer: { kind: 'fraction', value: 0.4, ratio: [2, 5], simplest: true }, answerText: '2/5' },
      ],
    },
    {
      problem: 'Work out 3/5 ÷ 2/3.',
      steps: [
        { given: 'Flip the second fraction: 2/3 becomes 3/2' },
        { given: 'Now multiply: 3/5 × 3/2' },
        { prompt: '3/5 × 3/2 = ? (as a fraction)', answer: { kind: 'fraction', value: 0.9, ratio: [9, 10], simplest: true }, answerText: '9/10' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.4)) return mixedTimes(rng);
    const op = level === 1 ? 0 : level === 2 ? rng.int(0, 1) : 1;
    const dens = level === 1 ? [2, 3, 4, 5] : level === 2 ? [2, 3, 4, 5, 6] : [3, 4, 5, 6, 7, 8];
    const b = rng.pick(dens), d = rng.pick(dens);
    const a = rng.int(1, b - 1), c = rng.int(1, d - 1);
    const whole = level === 1 && rng.chance(0.4);
    if (whole) {
      const w = rng.int(2, 6);
      const top = a * w;
      const [sn, sd] = simplify(top, b);
      return {
        ...base,
        params: { a, b, c: w, d: 1, op: 0 },
        text: `Work out ${a}/${b} × ${w}. Give your answer in its simplest form.`,
        answer: { kind: 'fraction', value: sn / sd, ratio: [sn, sd], simplest: true, acceptEquivalents: true },
        answerText: sd === 1 ? String(sn) : `${sn}/${sd}`,
        hint: `${w} is the same as ${w}/1. Multiply the tops, multiply the bottoms.`,
        steps: [`${w} = ${w}/1`, `Multiply the tops: ${a} × ${w} = ${top}`, `Multiply the bottoms: ${b} × 1 = ${b}`, sd === b ? `So ${a}/${b} × ${w} = ${sn}/${sd}` : `${top}/${b} = ${sn}/${sd}`],
        traps: [
          { value: (a * w) / (b * w), misconception: 'multiplied-bottom', message: `Only the top is multiplied by ${w}: the bottom stays ${b}.` },
        ].filter((t) => Math.abs(t.value - sn / sd) > 1e-9),
      };
    }
    if (op === 0) {
      const top = a * c, bottom = b * d;
      const [sn, sd] = simplify(top, bottom);
      const traps: Trap[] = [
        { value: (a * d + c * b) / (b * d), misconception: 'added' },
        { value: top / bottom === sn / sd ? -1 : top / bottom, misconception: 'not-simplified' },
        { value: (a * c) / Math.max(b, d), misconception: 'one-bottom' },
      ].filter((t) => t.value > 0 && Math.abs(t.value - sn / sd) > 1e-9);
      return {
        ...base,
        params: { a, b, c, d, op },
        text: `Work out ${a}/${b} × ${c}/${d}. Give your answer in its simplest form.`,
        answer: { kind: 'fraction', value: sn / sd, ratio: [sn, sd], simplest: true },
        answerText: `${sn}/${sd}`,
        hint: 'Tops times tops, bottoms times bottoms.',
        steps: [`Multiply the tops: ${a} × ${c} = ${top}`, `Multiply the bottoms: ${b} × ${d} = ${bottom}`, `So ${a}/${b} × ${c}/${d} = ${top}/${bottom}`, ...(sd !== bottom ? [`Simplify: ${top}/${bottom} = ${sn}/${sd}`] : [])],
        traps,
      };
    }
    const top = a * d, bottom = b * c;
    const [sn, sd] = simplify(top, bottom);
    const traps: Trap[] = [
      { value: (a * c) / (b * d), misconception: 'no-flip', message: 'To divide, flip the SECOND fraction first, then multiply.' },
      { value: (b * d) / (a * c), misconception: 'no-flip' },
      { value: top / bottom === sn / sd ? -1 : top / bottom, misconception: 'not-simplified' },
    ].filter((t) => t.value > 0 && Math.abs(t.value - sn / sd) > 1e-9);
    return {
      ...base,
      params: { a, b, c, d, op },
      text: `Work out ${a}/${b} ÷ ${c}/${d}. Give your answer in its simplest form.`,
      answer: { kind: 'fraction', value: sn / sd, ratio: [sn, sd], simplest: true, acceptEquivalents: true },
      answerText: sd === 1 ? String(sn) : `${sn}/${sd}`,
      hint: `Flip ${c}/${d} to ${d}/${c}, then multiply.`,
      steps: [`Flip the second fraction: ${c}/${d} becomes ${d}/${c}`, `Now multiply: ${a}/${b} × ${d}/${c}`, `Tops: ${a} × ${d} = ${top}, bottoms: ${b} × ${c} = ${bottom}`, `So ${a}/${b} ÷ ${c}/${d} = ${top}/${bottom}`, ...(sd !== bottom ? [`Simplify: ${top}/${bottom} = ${sn}/${sd}`] : [])],
      traps,
    };
  },
  compute: ({ a, b, c, d, op }) => (op === 0 ? (a * c) / (b * d) : (a * d) / (b * c)),
  variety: 15,
  mistakes: [
    {
      problem: 'Work out 1/2 × 1/3.',
      steps: ['Make the bottoms the same: 3/6 × 2/6', '3 × 2 = 6; 6 × 6 = 36', 'So 6/36 = 1/6'],
      wrongStep: 0,
      reason: 'You do not need the same bottoms to multiply. Just 1 × 1 = 1 and 2 × 3 = 6, so 1/6. (The answer happened to be right, but the method is wrong and slow.)',
      fixOptions: ['Multiply straight away: 1 × 1 = 1, 2 × 3 = 6, so 1/6', 'Make the bottoms the same first', 'Add instead: 1/2 + 1/3'],
      correctFix: 0,
    },
    {
      problem: 'Work out 3/4 ÷ 1/2.',
      steps: ['Multiply the tops: 3 × 1 = 3', 'Multiply the bottoms: 4 × 2 = 8', 'So 3/4 ÷ 1/2 = 3/8'],
      wrongStep: 0,
      reason: 'To divide, flip the second fraction first: 3/4 × 2/1 = 6/4 = 3/2.',
      fixOptions: ['Flip 1/2 to 2/1, then 3/4 × 2/1 = 6/4 = 3/2', 'Multiply the tops: 3 × 1 = 3', 'Flip the first fraction: 4/3 × 1/2'],
      correctFix: 0,
    },
    {
      problem: 'Work out 2/5 × 5/6.',
      steps: ['Tops: 2 × 5 = 10', 'Bottoms: 5 × 6 = 30', 'So the answer is 10/30'],
      wrongStep: 2,
      reason: '10/30 is right but not in its simplest form: 10/30 = 1/3.',
      fixOptions: ['Simplify: 10/30 = 1/3', 'So the answer is 10/30', '10/30 = 1/30'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    added: 'This is a multiplication: tops × tops and bottoms × bottoms. No common bottom needed.',
    'not-simplified': 'That is right, but the question asks for the simplest form.',
    'one-bottom': 'Multiply the bottoms together too.',
    'no-flip': 'To divide by a fraction, flip it upside down and multiply.',
    'multiplied-bottom': 'A whole number is over 1, so it only multiplies the top.',
    'mixed-parts': 'Change a mixed number into an improper fraction before multiplying.',
    'wholes-only': 'The fraction part of the mixed number counts too.',
  },
};

/** Level 3: a mixed number times a fraction. Improper fraction first, then tops × tops, bottoms × bottoms. */
function mixedTimes(rng: Rng): Question {
  const w = rng.int(1, 3), b = rng.pick([2, 3, 4, 5]), a = rng.int(1, b - 1);
  const d = rng.pick([2, 3, 4, 5, 6]), c = rng.int(1, d - 1);
  const n1 = w * b + a;
  const top = n1 * c, bottom = b * d;
  const [sn, sd] = simplify(top, bottom);
  const whole = Math.floor(sn / sd), rem = sn - whole * sd;
  const mixedText = sd === 1 ? String(sn) : whole > 0 ? `${whole} ${rem}/${sd}` : `${sn}/${sd}`;
  return {
    skillId: ID, level: 3,
    params: { a: n1, b, c, d, op: 0 },
    text: `Work out ${w} ${a}/${b} × ${c}/${d}. Give your answer in its simplest form.`,
    answer: { kind: 'fraction', value: sn / sd, ratio: [sn, sd], simplest: true, acceptEquivalents: true },
    answerText: mixedText,
    hint: `Change ${w} ${a}/${b} into an improper fraction first: ${w} × ${b} + ${a} over ${b}.`,
    steps: [`${w} ${a}/${b} = ${n1}/${b}`, `Multiply the tops: ${n1} × ${c} = ${top}`, `Multiply the bottoms: ${b} × ${d} = ${bottom}`, `So ${n1}/${b} × ${c}/${d} = ${top}/${bottom}`, ...(sd !== bottom ? [`Simplify: ${top}/${bottom} = ${sn}/${sd}`] : []), ...(whole > 0 && sd !== 1 ? [`As a mixed number: ${mixedText}`] : [])],
    traps: [
      { value: w * (c / d) + (a * c) / (b * d), misconception: 'mixed-parts', message: 'Change the mixed number to an improper fraction before multiplying; the whole and the fraction cannot be multiplied separately like that.' },
      { value: (w * c) / d, misconception: 'wholes-only' },
    ].filter((t) => Number.isFinite(t.value) && t.value > 0 && Math.abs(t.value - sn / sd) > 1e-9),
  };
}
