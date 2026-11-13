import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { ITEMS, NAMES, at, capitalise, clean, decimals, fmt, gel, pctOfSteps, shuffleChoices } from "../util";

const ID = 'pct-decrease';

const L1 = { p: [10, 20, 30, 40, 50, 25, 5], a: [20, 40, 50, 60, 80, 100, 120, 150, 200] };
const L2 = { p: [15, 35, 45, 5, 60, 75, 2.5], a: [20, 40, 60, 80, 120, 160, 200, 240, 300] };
const L3 = { p: [12.5, 17.5, 3, 7, 9, 35, 65, 15], a: [40, 80, 120, 160, 200, 300, 400, 500, 600, 800] };

interface Ctx { text: (p: number, a: number) => string; kind: 'money' | 'number'; unit?: string }
const CONTEXTS: Ctx[] = [
  { kind: 'money', text: (p, a) => `${capitalise(at(ITEMS, a + p).name)} costs ${gel(a)}. In the sale it is ${fmt(p)}% off. What is the sale price?` },
  { kind: 'money', text: (p, a) => `${at(NAMES, a)} finds a ${fmt(p)}% discount code for ${at(ITEMS, a).name} that costs ${gel(a)}. How much is paid?` },
  { kind: 'number', unit: 'minutes', text: (p, a) => `The old road to Mtskheta took ${a} minutes. The new road is ${fmt(p)}% quicker. How long does it take now?` },
  { kind: 'number', text: (p, a) => `A school had ${a} students. The number went down by ${fmt(p)}%. How many students are there now?` },
  { kind: 'number', text: (p, a) => `Decrease ${fmt(a)} by ${fmt(p)}%.` },
];

function picture(a: number, after: number): Picture {
  return { type: 'compare', rows: [{ label: 'Before', value: a, tone: 'blue' }, { label: 'After', value: after, tone: 'orange' }] };
}

export const pctDecrease: Skill = {
  id: ID,
  unit: 1,
  order: 5,
  title: 'Percent decrease',
  short: '% decrease',
  taught: true,
  prerequisites: ['pct-increase'],
  explain: {
    sentences: [
      'A percent decrease means the amount shrinks by a share of itself. Sales and discounts are decreases.',
      'First find the percent of the amount. Then TAKE it off.',
      'For example, 80 GEL with 25% off: 25% of 80 is 20, so you pay 80 − 20 = 60 GEL.',
      'Another way: you pay 100% − 25% = 75% of the price, and 75% of 80 is 60.',
    ],
    rule: 'Find the percent, then take it off. The answer is smaller than you started with.',
    picture: { type: 'compare', rows: [{ label: 'Before: 80', value: 80, tone: 'blue' }, { label: 'After: 60', value: 60, tone: 'orange' }] },
  },
  examples: [
    {
      problem: 'A jacket costs 80 GEL. It is 25% off. What is the sale price?',
      steps: ['50% of 80 = 80 ÷ 2 = 40', '25% of 80 = 40 ÷ 2 = 20', 'Take it off: 80 − 20 = 60', 'Sale price: 60 GEL'],
      answer: '60 GEL',
    },
    {
      problem: 'Decrease 120 by 15%.',
      steps: ['10% of 120 = 12', '5% of 120 = 6', '15% of 120 = 12 + 6 = 18', 'Take it off: 120 − 18 = 102'],
      answer: '102',
    },
  ],
  faded: [
    {
      problem: 'A bag costs 60 GEL with 10% off. What do you pay?',
      steps: [
        { given: '10% of 60 = 60 ÷ 10 = 6' },
        { prompt: 'Take it off: 60 − 6 = ?', answer: { kind: 'money', value: 54 }, answerText: '54 GEL' },
      ],
    },
    {
      problem: 'Decrease 200 by 35%.',
      steps: [
        { prompt: '10% of 200 = ?', answer: { kind: 'number', value: 20 }, answerText: '20' },
        { prompt: '5% of 200 = ?', answer: { kind: 'number', value: 10 }, answerText: '10', hint: 'Half of 10%.' },
        { given: '35% of 200 = 3 × 20 + 10 = 70' },
        { prompt: 'Take it off: 200 − 70 = ?', answer: { kind: 'number', value: 130 }, answerText: '130' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    if (level === 3 && rng.chance(0.25)) {
      const p = rng.pick([10, 20, 25, 30, 40]);
      const correct = `Because 100% − ${p}% = ${100 - p}%: after the discount you pay ${100 - p}% of the price`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, [`Because ${p}% off means you pay ${p}% of the price`, `Because ${100 - p} is bigger than ${p}`]);
      return { skillId: ID, level, params: { p, a: 100, choice: 1 }, text: `A jacket is ${p}% off. Nino says the sale price is ${100 - p}% of the original price. Why is she right?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'The whole price is 100%. A decrease SUBTRACTS.', steps: ['The full price is 100%', `Taking ${p}% off leaves 100% − ${p}% = ${100 - p}%`, `So the sale price is ${100 - p}% of the original (multiplier ${fmt((100 - p) / 100)})`], choices, traps: [] };
    }
    const pool = level === 1 ? L1 : level === 2 ? L2 : L3;
    const maxDec = level === 1 ? 0 : level === 2 ? 1 : 2;
    const pairs: [number, number][] = [];
    for (const p of pool.p) for (const a of pool.a) if (decimals((p * a) / 100) <= maxDec) pairs.push([p, a]);
    const [p, a] = rng.pick(pairs);
    const ctx = rng.pick(CONTEXTS);
    const disc = clean((p * a) / 100);
    const after = clean(a - disc);
    const unit = ctx.kind === 'money' ? ' GEL' : ctx.unit ? ` ${ctx.unit}` : '';
    const useMultiplier = level === 3 && p % 5 === 0;
    const steps = useMultiplier
      ? [`100% − ${p}% = ${100 - p}%`, `${100 - p}% = ${fmt((100 - p) / 100)}`, `${fmt((100 - p) / 100)} × ${fmt(a)} = ${fmt(after)}`, `Answer: ${fmt(after)}${unit}`]
      : [...pctOfSteps(p, a).steps, `Take it off: ${fmt(a)} − ${fmt(disc)} = ${fmt(after)}`, `Answer: ${fmt(after)}${unit}`];
    const traps: Trap[] = [
      { value: disc, misconception: 'only-discount', message: `${fmt(disc)} is the discount. Take it off: ${fmt(a)} − ${fmt(disc)} = ${fmt(after)}.` },
      { value: clean(a + disc), misconception: 'added' },
      { value: clean(a - p), misconception: 'subtract-number', message: `${fmt(p)}% is not ${fmt(p)}${unit}. Find ${fmt(p)}% of ${fmt(a)} first.` },
      { value: clean(a * (1 - p)), misconception: 'forgot-100' },
    ].filter((t) => Math.abs(t.value - after) > 1e-9);
    return {
      skillId: ID,
      level,
      params: { p, a },
      text: ctx.text(p, a),
      answer: { kind: ctx.kind, value: after },
      answerText: `${fmt(after)}${unit}`,
      hint: `A decrease SUBTRACTS. First find ${fmt(p)}% of ${fmt(a)}, then take it away from ${fmt(a)}. (Multiplier: 1 − ${fmt(p)}/100.)`,
      steps,
      picture: picture(a, after),
      traps,
    };
  },
  compute: ({ p, a, choice }) => (choice ? 0 : clean(a * (1 - p / 100))),
  mistakes: [
    {
      problem: 'A scooter costs 200 GEL with 30% off. What is the sale price?',
      steps: ['10% of 200 = 20', '30% of 200 = 3 × 20 = 60', 'Sale price: 60 GEL'],
      wrongStep: 2,
      reason: '60 GEL is the discount, not the price. Take it off: 200 − 60 = 140 GEL.',
      fixOptions: ['Sale price: 200 − 60 = 140 GEL', 'Sale price: 200 + 60 = 260 GEL', 'Sale price: 200 − 30 = 170 GEL'],
      correctFix: 0,
    },
    {
      problem: 'Decrease 50 by 20%.',
      steps: ['20% off means take away 20', '50 − 20 = 30'],
      wrongStep: 0,
      reason: '20% of 50 is 10, not 20. Find the percent of the amount before taking it off.',
      fixOptions: ['20% of 50 = 10, so take away 10', '20% of 50 = 20, so take away 20', '20% of 50 = 2, so take away 2'],
      correctFix: 0,
    },
    {
      problem: 'A bus journey took 40 minutes. The new road is 15% quicker. How long does it take now?',
      steps: ['10% of 40 = 4', '5% of 40 = 2', '15% of 40 = 4 + 2 = 6', '40 + 6 = 46 minutes'],
      wrongStep: 3,
      reason: 'Quicker means less time, so take the 6 minutes off: 40 − 6 = 34 minutes.',
      fixOptions: ['40 − 6 = 34 minutes', '40 + 6 = 46 minutes', '40 − 15 = 25 minutes'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'only-discount': 'That is just the discount. Take it off the original amount.',
    added: 'A decrease makes the amount smaller. Take the percent off, do not add it.',
    'subtract-number': 'A percent is a share of the amount, not a number of GEL to take away.',
    'forgot-100': 'You multiplied by the percent but forgot to divide by 100.',
  },
};
