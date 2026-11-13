import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { ITEMS, NAMES, capitalise, clean, decimals, fmt, gel, pctOfSteps, pickWhere, shuffleChoices } from '../util';

const ID = 'pct-of-amount';

const L1 = { p: [10, 20, 30, 40, 50, 25, 75, 5], a: [20, 40, 50, 60, 80, 100, 120, 150, 200, 300, 400] };
const L2 = { p: [15, 35, 45, 55, 65, 85, 95, 5, 25, 75], a: [20, 40, 60, 80, 120, 160, 200, 240, 300, 360] };
const L3 = { p: [17.5, 12.5, 2.5, 110, 120, 150, 3, 7, 9, 13, 65, 85], a: [200, 300, 400, 500, 600, 800, 1000, 40, 80, 120, 160] };

interface Ctx { text: (p: number, a: number) => string; kind: 'money' | 'number'; unit?: string }
const CONTEXTS: Ctx[] = [
  { kind: 'money', text: (p, a) => `${capitalise(ITEMS[a % ITEMS.length].name)} costs ${gel(a)}. It is ${fmt(p)}% off. How much money do you save?` },
  { kind: 'number', text: (p, a) => `There are ${a} students in Grade 7. ${fmt(p)}% of them walk to school. How many walk to school?` },
  { kind: 'money', text: (p, a) => `${NAMES[a % NAMES.length]} has ${gel(a)} and spends ${fmt(p)}% of it on a present. How much is the present?` },
  { kind: 'number', text: (p, a) => `Find ${fmt(p)}% of ${fmt(a)}.` },
  { kind: 'number', unit: 'g', text: (p, a) => `A ${a} g bar of chocolate is ${fmt(p)}% cocoa. How many grams of cocoa are in it?` },
  { kind: 'number', unit: 'minutes', text: (p, a) => `The bus from Tbilisi to Batumi takes ${a} minutes. ${fmt(p)}% of that is on the motorway. How many minutes is that?` },
];

function picture(p: number, a: number): Picture {
  if (p <= 100) return { type: 'bar', parts: 10, shaded: p / 10, totalLabel: `${fmt(a)} (100%)`, shadedLabel: `${fmt(p)}%`, partLabel: `10% = ${fmt(a / 10)}` };
  return { type: 'bar', parts: 10, shaded: p / 10, totalLabel: `${fmt(a)} (100%)`, shadedLabel: `${fmt(p)}%` };
}

export const pctOfAmount: Skill = {
  id: ID,
  unit: 1,
  order: 2,
  title: 'Percent of an amount',
  short: '% of amount',
  taught: true,
  prerequisites: ['fdp-conversions'],
  explain: {
    sentences: [
      'To find a percent of an amount, start with an easy percent.',
      '10% is the amount divided by 10. 1% is the amount divided by 100. 50% is a half.',
      'Then build the percent you need. 30% is 3 lots of 10%. 5% is half of 10%.',
      'For example, 30% of 80: 10% of 80 is 8, so 30% is 3 × 8 = 24.',
    ],
    rule: 'OF means multiply: p% of an amount is p/100 × the amount. Quick way: find 10% first, then build up.',
    picture: { type: 'bar', parts: 10, shaded: 3, totalLabel: '80 (100%)', shadedLabel: '30% = 24', partLabel: '10% = 8' },
  },
  examples: [
    {
      problem: 'A hoodie costs 80 GEL. It is 30% off. How much do you save?',
      steps: ['10% of 80 = 80 ÷ 10 = 8', '30% of 80 = 3 × 8 = 24', 'You save 24 GEL.'],
      answer: '24 GEL',
    },
    {
      problem: 'Find 15% of 60.',
      steps: ['10% of 60 = 60 ÷ 10 = 6', '5% of 60 = 6 ÷ 2 = 3', '15% of 60 = 6 + 3 = 9'],
      answer: '9',
    },
  ],
  faded: [
    {
      problem: 'Find 40% of 50.',
      steps: [
        { given: '10% of 50 = 50 ÷ 10 = 5' },
        { prompt: '40% of 50 = 4 × 5 = ?', answer: { kind: 'number', value: 20 }, answerText: '20' },
      ],
    },
    {
      problem: 'A football costs 120 GEL. It is 25% off. How much do you save?',
      steps: [
        { prompt: '50% of 120 = 120 ÷ 2 = ?', answer: { kind: 'number', value: 60 }, answerText: '60', hint: 'Half of 120.' },
        { prompt: '25% of 120 = 60 ÷ 2 = ?', answer: { kind: 'money', value: 30 }, answerText: '30 GEL', hint: '25% is half of 50%.' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    if (level === 3 && rng.chance(0.25)) {
      const p = rng.pick([8, 12, 15, 30, 45]), a = rng.pick([200, 300, 400, 500]);
      const correct = `${p}% means ${p} out of 100, which is ${fmt(p / 100)}, and OF means multiply: ${fmt(p / 100)} × ${a}`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, [`${p}% is ${p}, and OF means multiply: ${p} × ${a}`, `${p}% means divide ${a} by ${p}`]);
      return { skillId: ID, level, params: { p, a, choice: 1 }, text: `Luka works out ${p}% of ${a} as ${fmt(p / 100)} × ${a}. Which explanation says why this is right?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'Percent means per hundred, and OF means multiply.', steps: [`${p}% = ${p}/100 = ${fmt(p / 100)}`, 'OF means multiply', `So ${p}% of ${a} = ${fmt(p / 100)} × ${a} = ${fmt(clean((p * a) / 100))}`], choices, traps: [] };
    }
    const pool = level === 1 ? L1 : level === 2 ? L2 : L3;
    const maxDec = level === 1 ? 0 : level === 2 ? 1 : 2;
    const pairs: [number, number][] = [];
    for (const p of pool.p) for (const a of pool.a) if (decimals((p * a) / 100) <= maxDec) pairs.push([p, a]);
    const [p, a] = rng.pick(pairs);
    const ctx = pickWhere(rng, CONTEXTS, (c) => (p <= 100 || c.kind === 'number'));
    const { steps, value } = pctOfSteps(p, a);
    const unit = ctx.kind === 'money' ? ' GEL' : ctx.unit ? ` ${ctx.unit}` : '';
    const traps: Trap[] = [
      { value: clean(a - p), misconception: 'subtract', message: `${fmt(p)}% is a share of ${fmt(a)}, not ${fmt(p)}${unit} to take away.` },
      { value: clean(a * p), misconception: 'forgot-100' },
      { value: clean(value * 10), misconception: 'decimal', message: `Check the decimal point: 10% of ${fmt(a)} is ${fmt(a / 10)}.` },
      { value: clean(value / 10), misconception: 'decimal', message: `Check the decimal point: 10% of ${fmt(a)} is ${fmt(a / 10)}.` },
      { value: clean(a / p), misconception: 'divide' },
    ].filter((t) => Math.abs(t.value - value) > 1e-9);
    return {
      skillId: ID,
      level,
      params: { p, a },
      text: ctx.text(p, a),
      answer: { kind: ctx.kind, value },
      answerText: `${fmt(value)}${unit}`,
      hint: `OF means multiply. ${p % 10 === 0 || p === 5 || p === 15 || p === 35 ? `Start with 10% of ${fmt(a)}: that is ${fmt(a / 10)}.` : p === 25 || p === 75 || p === 12.5 ? `Start with 50% of ${fmt(a)}: that is ${fmt(a / 2)}.` : `Start with 1% of ${fmt(a)}: that is ${fmt(a / 100)}.`}`,
      steps: [...steps, ctx.kind === 'money' ? `Answer: ${gel(value)}` : `Answer: ${fmt(value)}${unit}`],
      revealPicture: true,
      picture: picture(p, a),
      traps,
    };
  },
  compute: ({ p, a, choice }) => (choice ? 0 : clean((p * a) / 100)),
  mistakes: [
    {
      problem: 'Find 20% of 60.',
      steps: ['10% of 60 = 60 ÷ 10 = 6', '20% of 60 = 2 × 6 = 12', 'Answer: 60 − 12 = 48'],
      wrongStep: 2,
      reason: 'The question asks for 20% of 60, which is 12. Nobody asked you to take it away from 60.',
      fixOptions: ['Answer: 12', 'Answer: 72', 'Answer: 40'],
      correctFix: 0,
    },
    {
      problem: 'A bag costs 50 GEL. It is 30% off. How much do you save?',
      steps: ['30% off means take away 30', '50 − 30 = 20', 'You save 20 GEL'],
      wrongStep: 0,
      reason: '30% is not 30 GEL. It is 30 out of every 100, so 30% of 50 is 15.',
      fixOptions: ['30% of 50 = 3 × 5 = 15', '30% of 50 = 50 − 30 = 20', '30% of 50 = 50 ÷ 30'],
      correctFix: 0,
    },
    {
      problem: 'Find 5% of 80.',
      steps: ['10% of 80 = 8', '5% of 80 = 8 × 2 = 16', 'Answer: 16'],
      wrongStep: 1,
      reason: '5% is half of 10%, so halve 8 instead of doubling it: 5% of 80 = 4.',
      fixOptions: ['5% of 80 = 8 ÷ 2 = 4', '5% of 80 = 80 ÷ 5 = 16', '5% of 80 = 8 − 5 = 3'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    subtract: 'A percent is a share of the amount, not a number of GEL to take away.',
    'forgot-100': 'You multiplied by the percent but forgot to divide by 100.',
    decimal: 'Check the decimal point. 10% means divide by 10.',
    divide: 'Do not divide by the percent. Find 10% or 1% first, then build up.',
  },
};
