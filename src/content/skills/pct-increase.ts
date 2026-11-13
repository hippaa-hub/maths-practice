import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { NAMES, clean, decimals, fmt, gel, pctOfSteps } from '../util';

const ID = 'pct-increase';

const L1 = { p: [10, 20, 30, 40, 50, 25, 5], a: [20, 40, 50, 60, 80, 100, 120, 150, 200] };
const L2 = { p: [15, 35, 45, 5, 60, 75, 2.5], a: [20, 40, 60, 80, 120, 160, 200, 240, 300] };
const L3 = { p: [12.5, 17.5, 3, 7, 9, 35, 65, 15], a: [40, 80, 120, 160, 200, 300, 400, 500, 600, 800] };

interface Ctx { text: (p: number, a: number) => string; kind: 'money' | 'number'; unit?: string }
const CONTEXTS: Ctx[] = [
  { kind: 'money', text: (p, a) => `A cinema ticket costs ${gel(a)}. The price goes up by ${fmt(p)}%. What is the new price?` },
  { kind: 'money', text: (p, a) => `${NAMES[a % NAMES.length]} gets ${gel(a)} pocket money a month. It goes up by ${fmt(p)}%. How much is it now?` },
  { kind: 'number', unit: 'cm', text: (p, a) => `A sunflower was ${a} cm tall. It grew ${fmt(p)}% taller in a week. How tall is it now?` },
  { kind: 'number', text: (p, a) => `Last year ${a} students joined the chess club. This year ${fmt(p)}% more joined. How many joined this year?` },
  { kind: 'number', text: (p, a) => `Increase ${fmt(a)} by ${fmt(p)}%.` },
];

function picture(a: number, after: number): Picture {
  return { type: 'compare', rows: [{ label: 'Before', value: a, tone: 'blue' }, { label: 'After', value: after, tone: 'green' }] };
}

export const pctIncrease: Skill = {
  id: ID,
  unit: 1,
  order: 4,
  title: 'Percent increase',
  short: '% increase',
  taught: true,
  prerequisites: ['pct-of-amount'],
  explain: {
    sentences: [
      'A percent increase means the amount grows by a share of itself.',
      'First find the percent of the amount. Then ADD it on.',
      'For example, 50 GEL goes up by 20%: 20% of 50 is 10, so the new price is 50 + 10 = 60 GEL.',
      'Another way: the new amount is 100% + 20% = 120% of the old one, and 120% is 1.2, so 1.2 × 50 = 60.',
    ],
    rule: 'Find the percent, then add it on. The answer is bigger than you started with.',
    picture: { type: 'compare', rows: [{ label: 'Before: 50', value: 50, tone: 'blue' }, { label: 'After: 60', value: 60, tone: 'green' }] },
  },
  examples: [
    {
      problem: 'A ticket costs 50 GEL. The price goes up by 20%. What is the new price?',
      steps: ['10% of 50 = 50 ÷ 10 = 5', '20% of 50 = 2 × 5 = 10', 'Add it on: 50 + 10 = 60', 'New price: 60 GEL'],
      answer: '60 GEL',
    },
    {
      problem: 'Increase 80 by 15%.',
      steps: ['10% of 80 = 8', '5% of 80 = 4', '15% of 80 = 8 + 4 = 12', 'Add it on: 80 + 12 = 92'],
      answer: '92',
    },
  ],
  faded: [
    {
      problem: 'A plant was 40 cm tall and grew 25% taller. How tall is it now?',
      steps: [
        { given: '25% of 40 = 40 ÷ 4 = 10' },
        { prompt: 'Add it on: 40 + 10 = ?', answer: { kind: 'number', value: 50 }, answerText: '50 cm' },
      ],
    },
    {
      problem: 'Increase 120 by 30%.',
      steps: [
        { prompt: '10% of 120 = ?', answer: { kind: 'number', value: 12 }, answerText: '12' },
        { prompt: '30% of 120 = 3 × 12 = ?', answer: { kind: 'number', value: 36 }, answerText: '36' },
        { prompt: 'Add it on: 120 + 36 = ?', answer: { kind: 'number', value: 156 }, answerText: '156' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const pool = level === 1 ? L1 : level === 2 ? L2 : L3;
    const maxDec = level === 1 ? 0 : level === 2 ? 1 : 2;
    const pairs: [number, number][] = [];
    for (const p of pool.p) for (const a of pool.a) if (decimals((p * a) / 100) <= maxDec) pairs.push([p, a]);
    const [p, a] = rng.pick(pairs);
    const ctx = rng.pick(CONTEXTS);
    const inc = clean((p * a) / 100);
    const after = clean(a + inc);
    const unit = ctx.kind === 'money' ? ' GEL' : ctx.unit ? ` ${ctx.unit}` : '';
    const useMultiplier = level === 3 && p % 5 === 0;
    const steps = useMultiplier
      ? [`100% + ${p}% = ${100 + p}%`, `${100 + p}% = ${fmt((100 + p) / 100)}`, `${fmt((100 + p) / 100)} × ${fmt(a)} = ${fmt(after)}`, `Answer: ${fmt(after)}${unit}`]
      : [...pctOfSteps(p, a).steps, `Add it on: ${fmt(a)} + ${fmt(inc)} = ${fmt(after)}`, `Answer: ${fmt(after)}${unit}`];
    const traps: Trap[] = [
      { value: inc, misconception: 'only-increase', message: `${fmt(inc)} is the increase. Add it on: ${fmt(a)} + ${fmt(inc)} = ${fmt(after)}.` },
      { value: clean(a - inc), misconception: 'subtracted' },
      { value: clean(a + p), misconception: 'added-number', message: `${fmt(p)}% is not ${fmt(p)}${unit}. Find ${fmt(p)}% of ${fmt(a)} first.` },
      { value: clean(a * (1 + p)), misconception: 'forgot-100' },
    ].filter((t) => Math.abs(t.value - after) > 1e-9);
    return {
      skillId: ID,
      level,
      params: { p, a },
      text: ctx.text(p, a),
      answer: { kind: ctx.kind, value: after },
      answerText: `${fmt(after)}${unit}`,
      hint: `An increase ADDS. First find ${fmt(p)}% of ${fmt(a)}, then add it to ${fmt(a)}. (Multiplier: 1 + ${fmt(p)}/100.)`,
      steps,
      picture: picture(a, after),
      traps,
    };
  },
  compute: ({ p, a }) => clean(a * (1 + p / 100)),
  mistakes: [
    {
      problem: 'A ticket costs 40 GEL. The price goes up by 25%. What is the new price?',
      steps: ['25% of 40 = 40 ÷ 4 = 10', 'New price: 10 GEL'],
      wrongStep: 1,
      reason: '10 GEL is only the increase. The new price is the old price plus the increase: 40 + 10 = 50 GEL.',
      fixOptions: ['New price: 40 + 10 = 50 GEL', 'New price: 40 − 10 = 30 GEL', 'New price: 40 + 25 = 65 GEL'],
      correctFix: 0,
    },
    {
      problem: 'Increase 60 by 10%.',
      steps: ['10% means add 10', '60 + 10 = 70'],
      wrongStep: 0,
      reason: '10% of 60 is 6, not 10. A percent is a share of the amount, not a number of units.',
      fixOptions: ['10% of 60 = 6, so add 6', '10% of 60 = 10, so add 10', '10% of 60 = 0.6, so add 0.6'],
      correctFix: 0,
    },
    {
      problem: 'A plant was 80 cm and grew 15% taller. How tall is it now?',
      steps: ['10% of 80 = 8', '5% of 80 = 4', '15% of 80 = 8 + 4 = 12', '80 − 12 = 68 cm'],
      wrongStep: 3,
      reason: 'It grew taller, so the increase is added on: 80 + 12 = 92 cm.',
      fixOptions: ['80 + 12 = 92 cm', '80 + 15 = 95 cm', '80 − 12 = 68 cm'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'only-increase': 'That is just the increase. Add it on to the original amount.',
    subtracted: 'An increase makes the amount bigger. Add the percent on, do not take it off.',
    'added-number': 'A percent is a share of the amount, not a number of GEL to add.',
    'forgot-100': 'You multiplied by the percent but forgot to divide by 100.',
  },
};
