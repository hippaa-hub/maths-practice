import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { ITEMS, NAMES, at, clean, decimals, fmt, gel } from '../util';

const ID = 'fraction-of-amount';

export const fractionOfAmount: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Fraction of an amount',
  short: 'Fraction of amount',
  taught: true,
  prerequisites: ['fractions-simplify'],
  explain: {
    sentences: [
      'To find a fraction of an amount, divide by the bottom number, then multiply by the top number.',
      'For 3/4 of 20: divide 20 by 4 to get one quarter, which is 5. Then 3 quarters is 3 × 5 = 15.',
      'A bar model helps: split the bar into 4 equal parts and shade 3 of them.',
    ],
    rule: 'Divide by the bottom, multiply by the top.',
    picture: { type: 'bar', parts: 4, shaded: 3, totalLabel: '20', shadedLabel: '3/4 of 20 = 15', partLabel: '1/4 = 5' },
  },
  examples: [
    {
      problem: 'Find 3/4 of 20.',
      steps: ['Divide by the bottom: 20 ÷ 4 = 5', 'Multiply by the top: 3 × 5 = 15'],
      answer: '15',
    },
    {
      problem: 'A class of 30 students: 2/5 of them play basketball. How many is that?',
      steps: ['Divide by the bottom: 30 ÷ 5 = 6', 'Multiply by the top: 2 × 6 = 12', '12 students play basketball.'],
      answer: '12',
    },
  ],
  faded: [
    {
      problem: 'Find 2/3 of 24.',
      steps: [
        { prompt: 'Divide by the bottom: 24 ÷ 3 = ?', answer: { kind: 'number', value: 8 }, answerText: '8' },
        { prompt: 'Multiply by the top: 2 × 8 = ?', answer: { kind: 'number', value: 16 }, answerText: '16' },
      ],
    },
    {
      problem: 'Adele has 40 GEL and spends 3/8 of it. How much does she spend?',
      steps: [
        { given: 'Divide by the bottom: 40 ÷ 8 = 5' },
        { prompt: 'Multiply by the top: 3 × 5 = ?', answer: { kind: 'money', value: 15 }, answerText: '15 GEL' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const dens = level === 1 ? [2, 3, 4, 5, 10] : level === 2 ? [3, 4, 5, 6, 8, 10] : [6, 7, 8, 9, 12, 20];
    const d = rng.pick(dens);
    const n = level === 1 ? rng.int(1, Math.min(3, d - 1)) : rng.int(1, d - 1);
    const mults = level === 1 ? [1, 2, 3, 4, 5, 10] : level === 2 ? [2, 3, 4, 5, 6, 8, 10, 12] : [1.5, 2.5, 3, 4, 5, 7, 9, 10, 12.5, 15];
    let a = clean(d * rng.pick(mults));
    for (let tries = 0; tries < 30 && (decimals(clean((a / d) * n)) > 1 || decimals(a) > 1); tries++) a = clean(d * rng.pick(mults));
    if (decimals(clean((a / d) * n)) > 1 || decimals(a) > 1) a = d * 4;
    const one = clean(a / d);
    const r = clean(one * n);
    type Ctx = { text: string; kind: 'money' | 'number'; unit: string };
    const ctxs: Ctx[] = ([
      { kind: 'number', unit: '', text: `Find ${n}/${d} of ${fmt(a)}.` },
      { kind: 'money', unit: ' GEL', text: `${at(NAMES, a)} has ${gel(a)} and spends ${n}/${d} of it on ${at(ITEMS, a + n).name}. How much is spent?` },
      { kind: 'number', unit: '', text: `There are ${fmt(a)} students in Grade 7. ${n}/${d} of them take the bus. How many take the bus?` },
      { kind: 'number', unit: ' km', text: `The road from Tbilisi to Gori is ${fmt(a)} km. After ${n}/${d} of the way, the bus stops. How far has it gone?` },
    ] as Ctx[]).filter((c) => Number.isInteger(a) || c.kind === 'money');
    const ctx = rng.pick(ctxs);
    const traps: Trap[] = [
      { value: clean(a / n), misconception: 'swapped', message: `Divide by the bottom number (${d}), not the top.` },
      { value: one, misconception: 'unit-only', message: `${fmt(one)} is only 1/${d}. Multiply by ${n} to get ${n}/${d}.` },
      { value: clean(a - r), misconception: 'remainder' },
    ].filter((t) => Math.abs(t.value - r) > 1e-9 && Number.isFinite(t.value));
    return {
      skillId: ID,
      level,
      params: { n, d, a },
      text: ctx.text,
      answer: { kind: ctx.kind, value: r },
      answerText: `${fmt(r)}${ctx.unit}`,
      hint: `First find 1/${d} of ${fmt(a)}: divide by ${d}.`,
      steps: [`Divide by the bottom: ${fmt(a)} ÷ ${d} = ${fmt(one)}`, `Multiply by the top: ${n} × ${fmt(one)} = ${fmt(r)}`, `Answer: ${fmt(r)}${ctx.unit}`],
      revealPicture: true,
      picture: { type: 'bar', parts: d, shaded: n, totalLabel: `${fmt(a)}`, shadedLabel: `${n}/${d} = ${fmt(r)}`, partLabel: `1/${d} = ${fmt(one)}` },
      traps,
    };
  },
  compute: ({ n, d, a }) => clean((a / d) * n),
  mistakes: [
    {
      problem: 'Find 2/5 of 30.',
      steps: ['Divide by the top: 30 ÷ 2 = 15', 'Multiply by the bottom: 15 × 5 = 75'],
      wrongStep: 0,
      reason: 'Divide by the BOTTOM number: 30 ÷ 5 = 6, then multiply by the top: 2 × 6 = 12.',
      fixOptions: ['Divide by the bottom: 30 ÷ 5 = 6, then 2 × 6 = 12', 'Divide by the top: 30 ÷ 2 = 15, then 15 × 5 = 75', '30 − 5 = 25'],
      correctFix: 0,
    },
    {
      problem: 'Find 3/4 of 32.',
      steps: ['32 ÷ 4 = 8', 'So 3/4 of 32 is 8'],
      wrongStep: 1,
      reason: '8 is only one quarter. Three quarters is 3 × 8 = 24.',
      fixOptions: ['Multiply by the top: 3 × 8 = 24', 'So 3/4 of 32 is 8', '32 − 8 = 24, so 3/4 is 8'],
      correctFix: 0,
    },
    {
      problem: 'Nino has 60 GEL and spends 1/3 of it. How much does she spend?',
      steps: ['1/3 of 60 means 60 ÷ 3', '60 ÷ 3 = 20', 'She spends 60 − 20 = 40 GEL'],
      wrongStep: 2,
      reason: 'The question asks how much she SPENDS, which is 1/3 of 60 = 20 GEL. 40 GEL is what she has left.',
      fixOptions: ['She spends 20 GEL', 'She spends 60 − 20 = 40 GEL', 'She spends 60 ÷ 2 = 30 GEL'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    swapped: 'Divide by the bottom number, then multiply by the top number.',
    'unit-only': 'That is only one part. Multiply by the top number.',
    remainder: 'That is what is left over, not the fraction the question asked for.',
  },
};
