import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { ITEMS, NAMES, at, clean, decimals, fmt, gel, pctOfSteps, shuffleChoices } from '../util';

const ID = 'profit-loss';

function picture(cost: number, sell: number): Picture {
  return { type: 'compare', rows: [{ label: `Cost: ${gel(cost)}`, value: cost, tone: 'blue' }, { label: `Sold for: ${gel(sell)}`, value: sell, tone: sell >= cost ? 'green' : 'orange' }] };
}

export const profitLoss: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Percentage profit and loss',
  short: 'Profit & loss',
  taught: true,
  prerequisites: ['pct-change'],
  explain: {
    sentences: [
      'A shop buys something for the cost price and sells it for the selling price.',
      'If the selling price is higher, the difference is the profit. If it is lower, the difference is a loss.',
      'Percentage profit (or loss) compares the profit with the COST price: profit ÷ cost price × 100.',
      'For example, bought for 40 GEL and sold for 50 GEL: profit 10, and 10 ÷ 40 × 100 = 25% profit.',
    ],
    rule: 'Percentage profit or loss = (difference ÷ cost price) × 100. Always divide by the cost price.',
    picture: { type: 'compare', rows: [{ label: 'Cost: 40', value: 40, tone: 'blue' }, { label: 'Sold for: 50', value: 50, tone: 'green' }] },
  },
  examples: [
    {
      problem: 'A shop buys a bag for 40 GEL and sells it for 50 GEL. What is the percentage profit?',
      steps: ['Profit = selling price − cost price', '50 − 40 = 10', 'Divide by the COST price', '10 ÷ 40 = 0.25', '0.25 × 100 = 25', 'So a 25% profit.'],
      answer: '25% profit',
    },
    {
      problem: 'Nino buys a game for 60 GEL and sells it for 45 GEL. What is the percentage loss?',
      steps: ['Loss = cost price − selling price', '60 − 45 = 15', 'Divide by the COST price', '15 ÷ 60 = 0.25', '0.25 × 100 = 25', 'So a 25% loss.'],
      answer: '25% loss',
    },
  ],
  faded: [
    {
      problem: 'Bought for 20 GEL, sold for 26 GEL. What is the percentage profit?',
      steps: [
        { prompt: 'Profit: 26 − 20 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' },
        { given: 'Divide by the cost price, 20' },
        { prompt: '6 ÷ 20 × 100 = ? (as a percent)', answer: { kind: 'percent', value: 30 }, answerText: '30%' },
      ],
    },
    {
      problem: 'A scooter cost 200 GEL and is sold for 150 GEL. What is the percentage loss?',
      steps: [
        { prompt: 'Loss: 200 − 150 = ?', answer: { kind: 'number', value: 50 }, answerText: '50' },
        { prompt: 'Divide by the cost price: 50 ÷ 200 = ?', answer: { kind: 'number', value: 0.25 }, answerText: '0.25' },
        { prompt: '0.25 × 100 = ? (as a percent)', answer: { kind: 'percent', value: 25 }, answerText: '25%' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.3)) {
      // Find the selling price from the cost and the percentage profit.
      const cost = rng.pick([40, 50, 80, 120, 200, 250]);
      const p = rng.pick([10, 20, 25, 30, 40, 50, 15, 35]);
      const sell = clean(cost * (1 + p / 100));
      const { steps } = pctOfSteps(p, cost);
      return {
        ...base,
        params: { cost, sell, kind: 1 },
        text: `A shop buys ${at(ITEMS, cost + p).name} for ${gel(cost)} and wants a ${p}% profit. What should the selling price be?`,
        answer: { kind: 'money', value: sell },
        answerText: gel(sell),
        hint: `Find ${p}% of ${cost}, then add it to the cost price.`,
        steps: [...steps, `Selling price = ${cost} + ${fmt(clean(cost * p / 100))} = ${fmt(sell)}`],
        revealPicture: true,
        picture: picture(cost, sell),
        traps: [
          { value: clean(cost * p / 100), misconception: 'profit-only' },
          { value: clean(cost - cost * p / 100), misconception: 'wrong-direction' },
        ].filter((t) => Math.abs(t.value - sell) > 1e-9),
      };
    }
    if (level === 3 && rng.chance(0.25)) {
      const cost = rng.pick([40, 80, 200]), sell = cost + rng.pick([10, 20, 40]);
      const correct = `(${sell} − ${cost}) ÷ ${cost} × 100`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, [`(${sell} − ${cost}) ÷ ${sell} × 100`, `${sell} ÷ ${cost} × 100`, `${sell} − ${cost}`]);
      return {
        ...base,
        params: { cost, sell, kind: 2 },
        text: `Bought for ${gel(cost)}, sold for ${gel(sell)}. Which calculation gives the percentage profit?`,
        answer: { kind: 'choice', value: 0, choice: correctIndex },
        answerText: correct,
        hint: 'Percentage profit = profit ÷ cost price × 100.',
        steps: [`Profit = ${sell} − ${cost}`, `Divide by the cost price, ${cost}, and multiply by 100`, `So: ${correct}`],
        choices,
        traps: [],
      };
    }
    const pool = level === 1 ? { cost: [20, 40, 50, 80, 100, 200], p: [10, 20, 25, 50, 75] } : level === 2 ? { cost: [30, 60, 120, 150, 250, 300, 48, 64], p: [5, 15, 35, 45, 12.5, 25, 40] } : { cost: [16, 32, 48, 64, 125, 250, 400, 640], p: [12.5, 37.5, 62.5, 2.5, 7.5, 4, 6, 110, 150] };
    const triples: [number, number, number][] = [];
    for (const cost of pool.cost) for (const p of pool.p) {
      const up = clean(cost * (1 + p / 100));
      if (decimals(up) === 0) triples.push([cost, up, p]);
      if (p < 100) { const down = clean(cost * (1 - p / 100)); if (decimals(down) === 0 && down > 0) triples.push([cost, down, p]); }
    }
    const [cost, sell, p] = rng.pick(triples);
    const profit = sell >= cost;
    const diff = Math.abs(sell - cost);
    const dec = clean(diff / cost);
    const who = at(NAMES, cost);
    const item = at(ITEMS, cost + sell).name;
    const text = rng.pick([
      `A shop buys ${item} for ${gel(cost)} and sells it for ${gel(sell)}. What is the percentage ${profit ? 'profit' : 'loss'}?`,
      `${who} buys ${item} for ${gel(cost)} and later sells it for ${gel(sell)}. What is the percentage ${profit ? 'profit' : 'loss'}?`,
    ]);
    const traps: Trap[] = [
      { value: clean((diff / sell) * 100), misconception: 'divide-by-selling', message: `Divide by the cost price, ${fmt(cost)}, not the selling price.` },
      { value: diff, misconception: 'profit-only', message: `${fmt(diff)} GEL is the ${profit ? 'profit' : 'loss'}. Now divide by ${fmt(cost)} and multiply by 100.` },
      { value: clean((sell / cost) * 100), misconception: 'no-subtract' },
    ].filter((t) => Math.abs(t.value - p) > 1e-9);
    return {
      ...base,
      params: { cost, sell, kind: 0 },
      text,
      answer: { kind: 'percent', value: p },
      answerText: `${fmt(p)}%`,
      hint: `Find the ${profit ? 'profit' : 'loss'} first: ${fmt(Math.max(cost, sell))} − ${fmt(Math.min(cost, sell))}. Then divide by the cost price, ${fmt(cost)}.`,
      steps: [
        profit ? 'Profit = selling price − cost price' : 'Loss = cost price − selling price',
        `${fmt(Math.max(cost, sell))} − ${fmt(Math.min(cost, sell))} = ${fmt(diff)}`,
        'Divide by the COST price',
        `${fmt(diff)} ÷ ${fmt(cost)} = ${fmt(dec)}`,
        `${fmt(dec)} × 100 = ${fmt(p)}`,
        `So a ${fmt(p)}% ${profit ? 'profit' : 'loss'}.`,
      ],
      revealPicture: true,
      picture: picture(cost, sell),
      traps,
    };
  },
  compute: ({ cost, sell, kind }) => (kind === 1 ? sell : clean((Math.abs(sell - cost) / cost) * 100)),
  mistakes: [
    {
      problem: 'Bought for 50 GEL, sold for 60 GEL. What is the percentage profit?',
      steps: ['Profit: 60 − 50 = 10', '10 ÷ 60 = 0.167', 'So about 16.7% profit'],
      wrongStep: 1,
      reason: 'Divide by the COST price (50), not the selling price: 10 ÷ 50 = 0.2, so 20% profit.',
      fixOptions: ['10 ÷ 50 = 0.2, so 20% profit', '10 ÷ 60 = 0.167, so 16.7% profit', '60 ÷ 50 = 1.2, so 120% profit'],
      correctFix: 0,
    },
    {
      problem: 'Bought for 80 GEL, sold for 60 GEL. What is the percentage loss?',
      steps: ['Loss: 80 − 60 = 20', '20 ÷ 80 = 0.25', 'So a 0.25% loss'],
      wrongStep: 2,
      reason: '0.25 is the decimal. Multiply by 100: 25% loss.',
      fixOptions: ['0.25 × 100 = 25, so a 25% loss', 'So a 0.25% loss', '0.25 × 10 = 2.5, so a 2.5% loss'],
      correctFix: 0,
    },
    {
      problem: 'A bag costs the shop 40 GEL. The shop wants 30% profit. What is the selling price?',
      steps: ['30% of 40 = 12', 'Selling price = 12 GEL'],
      wrongStep: 1,
      reason: '12 GEL is the profit. The selling price is cost plus profit: 40 + 12 = 52 GEL.',
      fixOptions: ['Selling price = 40 + 12 = 52 GEL', 'Selling price = 12 GEL', 'Selling price = 40 − 12 = 28 GEL'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'divide-by-selling': 'Divide by the cost price, the price the shop paid, not the selling price.',
    'profit-only': 'That is the profit or loss in GEL, not the percent.',
    'no-subtract': 'Find the difference first (profit or loss), then divide by the cost price.',
    'wrong-direction': 'A profit means the selling price is HIGHER than the cost price.',
  },
};
