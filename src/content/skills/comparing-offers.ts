import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { ITEMS, clean, decimals, fmt, gel, pctOfSteps } from '../util';

const ID = 'comparing-offers';

type Params = { a1: number; p1: number; a2: number; p2: number; kind: number };

function finals({ a1, p1, a2, p2, kind }: Params): [number, number] {
  if (kind === 0) return [clean(a1 * (1 - p1 / 100)), clean(a2 * (1 - p2 / 100))];
  if (kind === 1) return [clean(a1 * (1 - p1 / 100)), clean(a2 - p2)];
  // kind 2: three items, A = 3 for the price of 2, B = 3 at a2 each with p2% off the lot
  return [clean(2 * a1), clean(3 * a2 * (1 - p2 / 100))];
}

function picture(f1: number, f2: number): Picture {
  return { type: 'compare', rows: [{ label: `Shop A: ${gel(f1)}`, value: f1, tone: 'blue' }, { label: `Shop B: ${gel(f2)}`, value: f2, tone: 'purple' }] };
}

function textFor(params: Params): string {
  const item = ITEMS[(params.a1 + params.a2) % ITEMS.length].name;
  if (params.kind === 0) return `Shop A sells ${item} for ${gel(params.a1)} with ${fmt(params.p1)}% off. Shop B sells the same one for ${gel(params.a2)} with ${fmt(params.p2)}% off. Which shop is cheaper, and by how much? Type the difference in GEL.`;
  if (params.kind === 1) return `Shop A sells ${item} for ${gel(params.a1)} with ${fmt(params.p1)}% off. Shop B sells it for ${gel(params.a2)} with ${gel(params.p2)} off. Which shop is cheaper, and by how much? Type the difference in GEL.`;
  return `Adele needs 3 notebooks. Shop A: ${gel(params.a1)} each, 3 for the price of 2. Shop B: ${gel(params.a2)} each, with ${fmt(params.p2)}% off the total. Which shop is cheaper, and by how much? Type the difference in GEL.`;
}

function stepsFor(params: Params, f1: number, f2: number): string[] {
  const s: string[] = [];
  if (params.kind === 2) {
    s.push(`Shop A: pay for 2 notebooks: 2 × ${fmt(params.a1)} = ${fmt(f1)}`);
    s.push(`Shop B: 3 notebooks cost 3 × ${fmt(params.a2)} = ${fmt(3 * params.a2)}`);
    const d = pctOfSteps(params.p2, 3 * params.a2);
    s.push(...d.steps);
    s.push(`Shop B: ${fmt(3 * params.a2)} − ${fmt(d.value)} = ${fmt(f2)}`);
  } else {
    const d1 = pctOfSteps(params.p1, params.a1);
    s.push('Shop A:', ...d1.steps, `Shop A price: ${fmt(params.a1)} − ${fmt(d1.value)} = ${fmt(f1)}`);
    if (params.kind === 0) {
      const d2 = pctOfSteps(params.p2, params.a2);
      s.push('Shop B:', ...d2.steps, `Shop B price: ${fmt(params.a2)} − ${fmt(d2.value)} = ${fmt(f2)}`);
    } else {
      s.push(`Shop B price: ${fmt(params.a2)} − ${fmt(params.p2)} = ${fmt(f2)}`);
    }
  }
  const cheaper = f1 < f2 ? 'A' : 'B';
  s.push(`Shop ${cheaper} is cheaper: ${fmt(Math.max(f1, f2))} − ${fmt(Math.min(f1, f2))} = ${fmt(Math.abs(f1 - f2))}`);
  s.push(`Answer: Shop ${cheaper}, by ${gel(Math.abs(f1 - f2))}`);
  return s;
}

export const comparingOffers: Skill = {
  id: ID,
  unit: 1,
  order: 8,
  title: 'Comparing offers',
  short: 'Best offer',
  taught: true,
  prerequisites: ['pct-decrease'],
  explain: {
    sentences: [
      'Shops advertise offers in different ways: a percent off, some GEL off, or "3 for 2".',
      'You cannot compare the offers by looking at them. Work out the final price of each.',
      'Then compare the final prices. The lower one is the better deal.',
      'A bigger percent off is not always cheaper if the starting price is higher.',
    ],
    rule: 'Work out the final price of each offer, then compare the final prices.',
    picture: { type: 'compare', rows: [{ label: 'Shop A: 45 GEL', value: 45, tone: 'blue' }, { label: 'Shop B: 48 GEL', value: 48, tone: 'purple' }] },
  },
  examples: [
    {
      problem: 'Shop A: 60 GEL with 25% off. Shop B: 60 GEL with 10 GEL off. Which is cheaper, and by how much?',
      steps: ['Shop A:', '50% of 60 = 60 ÷ 2 = 30', '25% is half of 50%: 25% of 60 = 30 ÷ 2 = 15', 'Shop A price: 60 − 15 = 45', 'Shop B price: 60 − 10 = 50', 'Shop A is cheaper: 50 − 45 = 5', 'Answer: Shop A, by 5 GEL'],
      answer: 'Shop A, by 5 GEL',
    },
    {
      problem: 'Shop A: 80 GEL with 20% off. Shop B: 70 GEL with 10% off. Which is cheaper, and by how much?',
      steps: ['Shop A:', '10% of 80 = 8', '20% of 80 = 2 × 8 = 16', 'Shop A price: 80 − 16 = 64', 'Shop B:', '10% of 70 = 7', 'Shop B price: 70 − 7 = 63', 'Shop B is cheaper: 64 − 63 = 1', 'Answer: Shop B, by 1 GEL'],
      answer: 'Shop B, by 1 GEL',
    },
  ],
  faded: [
    {
      problem: 'Shop A: 40 GEL with 25% off. Shop B: 40 GEL with 12 GEL off. Which is cheaper, and by how much?',
      steps: [
        { given: '25% of 40 = 10, so Shop A price: 40 − 10 = 30 GEL' },
        { prompt: 'Shop B price: 40 − 12 = ?', answer: { kind: 'money', value: 28 }, answerText: '28 GEL' },
        { prompt: 'Difference: 30 − 28 = ?', answer: { kind: 'money', value: 2 }, answerText: '2 GEL (Shop B is cheaper)' },
      ],
    },
    {
      problem: 'Shop A: 50 GEL with 20% off. Shop B: 45 GEL with 10% off. Which is cheaper, and by how much?',
      steps: [
        { prompt: 'Shop A: 20% of 50 = ?', answer: { kind: 'number', value: 10 }, answerText: '10' },
        { given: 'Shop A price: 50 − 10 = 40 GEL' },
        { prompt: 'Shop B: 10% of 45 = ?', answer: { kind: 'number', value: 4.5 }, answerText: '4.5' },
        { prompt: 'Shop B price: 45 − 4.5 = ?', answer: { kind: 'money', value: 40.5 }, answerText: '40.5 GEL' },
        { prompt: 'Difference: 40.5 − 40 = ?', answer: { kind: 'money', value: 0.5 }, answerText: '0.5 GEL (Shop A is cheaper)' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const candidates: Params[] = [];
    if (level === 1) {
      for (const a1 of [40, 50, 60, 80, 100, 120]) for (const p1 of [10, 20, 25, 50]) for (const a2 of [40, 50, 60, 80, 100, 120]) for (const p2 of [10, 20, 25, 50]) candidates.push({ a1, p1, a2, p2, kind: 0 });
    } else if (level === 2) {
      for (const a1 of [40, 50, 60, 80, 100, 120, 150]) for (const p1 of [10, 20, 25, 50, 15, 30]) for (const a2 of [40, 50, 60, 80, 100, 120, 150]) for (const p2 of [5, 8, 10, 12, 15, 20, 25, 30]) candidates.push({ a1, p1, a2, p2, kind: 1 });
    } else {
      for (const a1 of [3, 4, 5, 6, 8, 10]) for (const a2 of [3, 4, 5, 6, 8, 10]) for (const p2 of [10, 20, 25, 30, 40, 50]) candidates.push({ a1, p1: 0, a2, p2, kind: 2 });
      for (const a1 of [80, 120, 160, 200]) for (const p1 of [15, 35, 45, 12.5]) for (const a2 of [80, 120, 160, 200]) for (const p2 of [15, 35, 45, 12.5]) candidates.push({ a1, p1, a2, p2, kind: 0 });
    }
    const ok = candidates.filter((c) => {
      const [f1, f2] = finals(c);
      return f1 !== f2 && decimals(f1) <= (level === 1 ? 0 : 1) && decimals(f2) <= (level === 1 ? 0 : 1) && Math.abs(f1 - f2) <= 60;
    });
    const params = rng.pick(ok);
    const [f1, f2] = finals(params);
    const diff = clean(Math.abs(f1 - f2));
    const traps: Trap[] = [
      { value: clean(Math.abs(params.p1 - params.p2)), misconception: 'compare-percents' },
      { value: clean(Math.abs(params.a1 - params.a2)), misconception: 'compare-prices' },
      { value: f1, misconception: 'gave-price', message: `${gel(f1)} is Shop A's price. The question asks how much cheaper the better shop is.` },
      { value: f2, misconception: 'gave-price', message: `${gel(f2)} is Shop B's price. The question asks how much cheaper the better shop is.` },
    ].filter((t) => Math.abs(t.value - diff) > 1e-9);
    const cheaper = f1 < f2 ? 'A' : 'B';
    return {
      skillId: ID,
      level,
      params: { ...params },
      text: textFor(params),
      answer: { kind: 'money', value: diff },
      answerText: `Shop ${cheaper}, by ${gel(diff)}`,
      hint: 'Work out what you would actually pay in each shop. Then subtract.',
      steps: stepsFor(params, f1, f2),
      picture: picture(f1, f2),
      traps,
    };
  },
  compute: (params) => {
    const [f1, f2] = finals(params as Params);
    return clean(Math.abs(f1 - f2));
  },
  mistakes: [
    {
      problem: 'Shop A: 100 GEL with 20% off. Shop B: 80 GEL with 10% off. Which is cheaper?',
      steps: ['20% off is more than 10% off', 'So Shop A is cheaper'],
      wrongStep: 0,
      reason: 'A bigger percent does not mean a lower price. Work out both prices: A = 80 GEL, B = 72 GEL, so Shop B is cheaper.',
      fixOptions: ['Shop A: 100 − 20 = 80. Shop B: 80 − 8 = 72. Shop B is cheaper.', '20% off is more, so Shop A is cheaper', 'Shop A: 100 − 20 = 80. Shop B: 80 − 10 = 70.'],
      correctFix: 0,
    },
    {
      problem: 'Shop A: 60 GEL with 25% off. Shop B: 60 GEL with 12 GEL off. Which is cheaper, and by how much?',
      steps: ['Shop A: 25% of 60 = 15, so 60 − 15 = 45', 'Shop B: 60 − 12 = 48', 'Shop A is cheaper by 45 GEL'],
      wrongStep: 2,
      reason: 'The difference between the prices is 48 − 45 = 3 GEL. 45 GEL is the price, not the saving.',
      fixOptions: ['Shop A is cheaper by 48 − 45 = 3 GEL', 'Shop A is cheaper by 45 GEL', 'Shop B is cheaper by 3 GEL'],
      correctFix: 0,
    },
    {
      problem: 'Shop A: 50 GEL with 10% off. Shop B: 40 GEL with 10% off. Which is cheaper, and by how much?',
      steps: ['Both have 10% off, so they are the same', 'Difference: 0 GEL'],
      wrongStep: 0,
      reason: 'The same percent off different prices gives different prices: A = 45 GEL, B = 36 GEL.',
      fixOptions: ['Shop A: 50 − 5 = 45. Shop B: 40 − 4 = 36. Shop B by 9 GEL.', 'Both 10% off, so the same', 'Shop A: 50 − 10 = 40. Shop B: 40 − 10 = 30.'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'compare-percents': 'Comparing the percents is not enough. Work out the final price in each shop.',
    'compare-prices': 'Comparing the starting prices ignores the offers. Work out the final prices.',
    'gave-price': 'That is one shop\'s price. The question asks for the difference between the two.',
  },
};
