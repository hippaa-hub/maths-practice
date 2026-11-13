import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { NAMES, clean, decimals, fmt, gel, shuffleChoices } from '../util';

const ID = 'pct-change';

const L1 = { old: [10, 20, 25, 40, 50, 80, 100, 200], p: [10, 20, 25, 50, 75, 100] };
const L2 = { old: [30, 60, 120, 150, 250, 300, 400, 48, 64, 16], p: [5, 15, 35, 45, 12.5, 25, 50, 60, 150] };
const L3 = { old: [8, 16, 32, 64, 48, 96, 125, 250, 400, 640], p: [12.5, 37.5, 62.5, 87.5, 2.5, 7.5, 4, 6, 110, 120, 175] };

interface Ctx { text: (oldV: number, newV: number, dir: 'increase' | 'decrease') => string; kind: 'money' | 'number'; allow: 'up' | 'down' | 'both' }
const CONTEXTS: Ctx[] = [
  { kind: 'money', allow: 'both', text: (o, n, d) => `Khachapuri cost ${gel(o)} last year. Now it costs ${gel(n)}. What is the percentage ${d}?` },
  { kind: 'number', allow: 'down', text: (o, n, d) => `${NAMES[o % NAMES.length]}'s 100 m time went from ${o} seconds to ${n} seconds. What is the percentage ${d}?` },
  { kind: 'number', allow: 'both', text: (o, n, d) => `A shop sold ${o} ice creams in March and ${n} in July. What is the percentage ${d}?` },
  { kind: 'number', allow: 'both', text: (o, n, d) => `A channel had ${o} followers and now has ${n}. What is the percentage ${d}?` },
  { kind: 'number', allow: 'both', text: (o, n, d) => `An amount changes from ${fmt(o)} to ${fmt(n)}. What is the percentage ${d}?` },
];

function picture(oldV: number, newV: number): Picture {
  return { type: 'compare', rows: [{ label: `Before: ${fmt(oldV)}`, value: oldV, tone: 'blue' }, { label: `After: ${fmt(newV)}`, value: newV, tone: newV > oldV ? 'green' : 'orange' }] };
}

export const pctChange: Skill = {
  id: ID,
  unit: 1,
  order: 6,
  title: 'Percentage change',
  short: '% change',
  taught: true,
  prerequisites: ['pct-one-of-another'],
  explain: {
    sentences: [
      'Percentage change tells you how big a change is compared with where it started.',
      'First find the change: the difference between the new and the old amount.',
      'Then divide the change by the ORIGINAL amount and multiply by 100.',
      'For example, 8 GEL to 10 GEL: the change is 2, and 2 ÷ 8 × 100 = 25, so a 25% increase.',
    ],
    rule: 'Percentage change = change ÷ original × 100. Always divide by the original.',
    picture: { type: 'compare', rows: [{ label: 'Before: 8', value: 8, tone: 'blue' }, { label: 'After: 10', value: 10, tone: 'green' }] },
  },
  examples: [
    {
      problem: 'Khachapuri cost 8 GEL last year and 10 GEL now. What is the percentage increase?',
      steps: ['Change = new − old', '10 − 8 = 2', 'Divide the change by the ORIGINAL amount', '2 ÷ 8 = 0.25', '0.25 × 100 = 25', 'So it is a 25% increase.'],
      answer: '25%',
    },
    {
      problem: "Nino's 100 m time went from 20 seconds to 16 seconds. What is the percentage decrease?",
      steps: ['Change = old − new', '20 − 16 = 4', 'Divide the change by the ORIGINAL amount', '4 ÷ 20 = 0.2', '0.2 × 100 = 20', 'So it is a 20% decrease.'],
      answer: '20%',
    },
  ],
  faded: [
    {
      problem: 'A shop sold 40 ice creams in March and 50 in July. What is the percentage increase?',
      steps: [
        { given: 'Change: 50 − 40 = 10' },
        { prompt: 'Divide by the original: 10 ÷ 40 = ?', answer: { kind: 'number', value: 0.25 }, answerText: '0.25', hint: '10 out of 40 is a quarter.' },
        { prompt: '0.25 × 100 = ? (as a percent)', answer: { kind: 'percent', value: 25 }, answerText: '25%' },
      ],
    },
    {
      problem: 'A price goes from 50 GEL to 30 GEL. What is the percentage decrease?',
      steps: [
        { prompt: 'Change: 50 − 30 = ?', answer: { kind: 'number', value: 20 }, answerText: '20' },
        { given: 'Divide by the original (50), not the new amount.' },
        { prompt: '20 ÷ 50 × 100 = ? (as a percent)', answer: { kind: 'percent', value: 40 }, answerText: '40%' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const pool = level === 1 ? L1 : level === 2 ? L2 : L3;
    if (level === 3 && rng.chance(0.3)) return choiceQuestion(rng);
    const triples: [number, number, number][] = [];
    for (const oldV of pool.old) for (const p of pool.p) {
      const up = clean(oldV * (1 + p / 100));
      if (decimals(up) === 0 && decimals(p) <= 1) triples.push([oldV, up, p]);
      if (p < 100) {
        const down = clean(oldV * (1 - p / 100));
        if (decimals(down) === 0 && down > 0 && decimals(p) <= 1) triples.push([oldV, down, p]);
      }
    }
    const [oldV, newV, p] = rng.pick(triples);
    const dir = newV > oldV ? 'increase' : 'decrease';
    const ctx = rng.pick(CONTEXTS.filter((c) => c.allow === 'both' || (c.allow === 'down' && dir === 'decrease')));
    const diff = clean(Math.abs(newV - oldV));
    const dec = clean(diff / oldV);
    const traps: Trap[] = [
      { value: clean((diff / newV) * 100), misconception: 'divide-by-new', message: `Divide by the original amount, ${fmt(oldV)}, not the new one.` },
      { value: diff, misconception: 'change-only', message: `${fmt(diff)} is the change. Now divide by ${fmt(oldV)} and multiply by 100.` },
      { value: clean((newV / oldV) * 100), misconception: 'no-subtract' },
      { value: dec, misconception: 'no-100' },
    ].filter((t) => Math.abs(t.value - p) > 1e-9);
    return {
      skillId: ID,
      level,
      params: { oldV, newV },
      text: ctx.text(oldV, newV, dir),
      answer: { kind: 'percent', value: p },
      answerText: `${fmt(p)}%`,
      hint: `Find the change first: ${fmt(Math.max(oldV, newV))} − ${fmt(Math.min(oldV, newV))}. Then divide by ${fmt(oldV)}, the original.`,
      steps: [
        dir === 'increase' ? 'Change = new − old' : 'Change = old − new',
        `${fmt(Math.max(oldV, newV))} − ${fmt(Math.min(oldV, newV))} = ${fmt(diff)}`,
        'Divide the change by the ORIGINAL amount',
        `${fmt(diff)} ÷ ${fmt(oldV)} = ${fmt(dec)}`,
        `${fmt(dec)} × 100 = ${fmt(p)}`,
        `So it is a ${fmt(p)}% ${dir}.`,
      ],
      picture: picture(oldV, newV),
      traps,
    };
  },
  compute: ({ oldV, newV }) => clean((Math.abs(newV - oldV) / oldV) * 100),
  mistakes: [
    {
      problem: 'A price goes from 40 GEL to 50 GEL. What is the percentage increase?',
      steps: ['Change: 50 − 40 = 10', '10 ÷ 50 = 0.2', '0.2 × 100 = 20', 'So a 20% increase'],
      wrongStep: 1,
      reason: 'Divide by the ORIGINAL price, 40, not the new one: 10 ÷ 40 = 0.25, so 25%.',
      fixOptions: ['10 ÷ 40 = 0.25', '50 ÷ 40 = 1.25', '10 ÷ 50 = 0.2'],
      correctFix: 0,
    },
    {
      problem: 'Followers went from 200 to 250. What is the percentage increase?',
      steps: ['250 ÷ 200 = 1.25', '1.25 × 100 = 125', 'So a 125% increase'],
      wrongStep: 0,
      reason: 'You must use the CHANGE, not the new amount: 250 − 200 = 50, then 50 ÷ 200 = 0.25, so 25%.',
      fixOptions: ['Change: 250 − 200 = 50, then 50 ÷ 200 = 0.25', '250 ÷ 200 = 1.25 is right', 'Change: 250 + 200 = 450'],
      correctFix: 0,
    },
    {
      problem: 'A time went from 25 seconds to 20 seconds. What is the percentage decrease?',
      steps: ['Change: 25 − 20 = 5', '5 ÷ 25 = 0.2', 'So a 0.2% decrease'],
      wrongStep: 2,
      reason: '0.2 is the decimal. Multiply by 100: 0.2 × 100 = 20, so a 20% decrease.',
      fixOptions: ['0.2 × 100 = 20, so a 20% decrease', 'So a 0.2% decrease is right', '0.2 × 10 = 2, so a 2% decrease'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'divide-by-new': 'Always divide by the original amount, the one you started with.',
    'change-only': 'That is the change in GEL or units, not the percent. Divide by the original and × 100.',
    'no-subtract': 'Find the change first (new − old) before dividing.',
    'no-100': 'That is the decimal. Multiply by 100 to get the percent.',
  },
};

function choiceQuestion(rng: Rng): Question {
  const oldV = rng.pick([40, 50, 80, 200]);
  const newV = rng.pick([oldV + 10, oldV + 20, oldV - 10]);
  const correct = `(${newV} − ${oldV}) ÷ ${oldV} × 100`;
  const { choices, correctIndex } = shuffleChoices(rng, correct, [
    `(${newV} − ${oldV}) ÷ ${newV} × 100`,
    `${newV} ÷ ${oldV} × 100`,
    `${newV} − ${oldV}`,
  ]);
  return {
    skillId: ID,
    level: 3,
    params: { oldV, newV, choice: 1 },
    text: `Which calculation gives the percentage change from ${fmt(oldV)} GEL to ${fmt(newV)} GEL?`,
    answer: { kind: 'choice', value: 0, choice: correctIndex },
    answerText: correct,
    hint: 'Percentage change = change ÷ original × 100.',
    steps: ['Percentage change = change ÷ original × 100', `The change is ${fmt(newV)} − ${fmt(oldV)}, and the original is ${fmt(oldV)}.`, `So: ${correct}`],
    choices,
    traps: [],
  };
}
