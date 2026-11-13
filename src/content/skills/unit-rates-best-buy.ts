import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { clean, decimals, fmt, gel } from '../util';

const ID = 'unit-rates-best-buy';

const GOODS = [
  { name: 'apples', unit: 'kg' }, { name: 'rice', unit: 'kg' }, { name: 'juice', unit: 'litre' },
  { name: 'pencils', unit: 'pencil' }, { name: 'eggs', unit: 'egg' }, { name: 'stickers', unit: 'sticker' },
];

export const unitRatesBestBuy: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Unit rates and best buy',
  short: 'Best buy',
  taught: true,
  prerequisites: ['recipes-proportion'],
  explain: {
    sentences: [
      'A rate compares two different things, like GEL per kg or km per hour.',
      'A unit rate is the amount for ONE: if 5 kg of apples cost 12 GEL, the unit rate is 12 ÷ 5 = 2.40 GEL per kg.',
      'To find the best buy, work out the price for one unit in each offer and compare. The lower price per unit is the better value.',
    ],
    rule: 'Price ÷ amount = price for one. Compare the price for one.',
    picture: { type: 'compare', rows: [{ label: '6 eggs for 3 GEL → 0.50 each', value: 50, tone: 'blue' }, { label: '10 eggs for 4.50 GEL → 0.45 each', value: 45, tone: 'green' }] },
  },
  examples: [
    {
      problem: '5 kg of apples cost 12 GEL. What is the price per kg?',
      steps: ['Price ÷ amount: 12 ÷ 5 = 2.4', 'So 2.40 GEL per kg.'],
      answer: '2.40 GEL per kg',
    },
    {
      problem: 'Pack A: 6 eggs for 3 GEL. Pack B: 10 eggs for 4.50 GEL. Which is better value?',
      steps: ['Pack A: 3 ÷ 6 = 0.5 per egg', 'Pack B: 4.5 ÷ 10 = 0.45 per egg', '0.45 is less than 0.5, so Pack B is better value.'],
      answer: 'Pack B (0.45 GEL per egg)',
    },
  ],
  faded: [
    {
      problem: '4 litres of juice cost 10 GEL. What is the price per litre?',
      steps: [
        { prompt: 'Price ÷ amount: 10 ÷ 4 = ?', answer: { kind: 'money', value: 2.5 }, answerText: '2.50 GEL' },
      ],
    },
    {
      problem: 'Pack A: 8 pencils for 4 GEL. Pack B: 12 pencils for 4.80 GEL. Which is better value?',
      steps: [
        { prompt: 'Pack A: 4 ÷ 8 = ? per pencil', answer: { kind: 'money', value: 0.5 }, answerText: '0.50 GEL' },
        { prompt: 'Pack B: 4.8 ÷ 12 = ? per pencil', answer: { kind: 'money', value: 0.4 }, answerText: '0.40 GEL' },
        { given: '0.40 is less than 0.50, so Pack B is better value.' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const g = rng.pick(GOODS);
    if (level === 3 && rng.chance(0.4)) {
      const km = rng.pick([300, 400, 500, 600, 800, 1000]), per100 = rng.pick([5, 6, 7, 8, 9, 10, 5.5, 6.5, 7.5]);
      const litres = clean((km / 100) * per100);
      return {
        ...base, params: { qa: km, pa: litres, qb: 0, pb: 0, kind: 2 },
        text: `A car uses ${fmt(litres)} litres of fuel to drive ${km} km. What is its fuel use in litres per 100 km?`,
        answer: { kind: 'number', value: per100 }, answerText: `${fmt(per100)} L/100 km`,
        hint: `PER means divide. How many lots of 100 km in ${km} km? Divide the litres by that.`,
        steps: [`${km} km is ${km / 100} lots of 100 km`, `${fmt(litres)} ÷ ${km / 100} = ${fmt(per100)}`, `So ${fmt(per100)} litres per 100 km`],
        traps: [{ value: clean(km / litres), misconception: 'inverted', message: 'That is km per litre. The question asks litres per 100 km.' }, { value: clean(litres / km), misconception: 'per-km', message: 'That is litres per 1 km. Multiply by 100.' }].filter((t) => Math.abs(t.value - per100) > 1e-9),
      };
    }
    if (level === 1) {
      const qty = rng.pick([2, 3, 4, 5, 6, 8, 10]);
      const per = rng.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 0.25, 0.75, 1.2]);
      const price = clean(qty * per);
      if (decimals(price) > 2) return this.generate(level, rng);
      return {
        ...base,
        params: { qa: qty, pa: price, qb: 0, pb: 0, kind: 0 },
        text: `${qty} ${g.unit === 'kg' || g.unit === 'litre' ? `${g.unit}${qty > 1 ? 's' : ''} of ` : ''}${g.name} cost ${gel(price)}. What is the price for one ${g.unit}?`,
        answer: { kind: 'money', value: per },
        answerText: `${gel(per)} per ${g.unit}`,
        hint: `PER means divide: price ÷ amount, ${fmt(price)} ÷ ${qty}.`,
        steps: [`Price ÷ amount: ${fmt(price)} ÷ ${qty} = ${fmt(per)}`, `So ${gel(per)} per ${g.unit}.`],
        traps: [
          { value: clean(qty / price), misconception: 'inverted', message: 'Divide the PRICE by the amount, not the other way round.' },
          { value: clean(price * qty), misconception: 'multiplied' },
        ].filter((t) => Math.abs(t.value - per) > 1e-9),
      };
    }
    // best buy: two packs
    const qty = (n: number) => (g.unit === 'kg' || g.unit === 'litre' ? `${n} ${g.unit}${n > 1 ? 's' : ''} of ${g.name}` : `${n} ${g.name}`);
    let qa = 0, pa = 0, qb = 0, pb = 0, ua = 0, ub = 0;
    for (let tries = 0; tries < 100; tries++) {
      qa = rng.pick([2, 3, 4, 5, 6, 8]); qb = rng.pick([5, 6, 8, 10, 12, 15, 20]);
      if (qa >= qb) continue;
      ua = rng.pick([0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2, 1.5, 2, 2.5]);
      ub = rng.pick([0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 0.75, 0.9, 1, 1.1, 1.25, 1.6, 2, 2.2]);
      if (ua === ub) continue;
      pa = clean(qa * ua); pb = clean(qb * ub);
      if (decimals(pa) <= 2 && decimals(pb) <= 2 && decimals(ua) <= 2 && decimals(ub) <= 2) break;
    }
    const better = ua < ub ? 'A' : 'B';
    const best = Math.min(ua, ub);
    const traps: Trap[] = [
      { value: Math.max(ua, ub), misconception: 'other-pack', message: `That is the price for one in Pack ${better === 'A' ? 'B' : 'A'}, the dearer one.` },
      { value: Math.min(pa, pb), misconception: 'cheaper-pack', message: 'The cheaper pack is not always the better value. Compare the price for ONE.' },
      { value: clean(Math.abs(ua - ub)), misconception: 'difference' },
    ].filter((t) => Math.abs(t.value - best) > 1e-9);
    return {
      ...base,
      params: { qa, pa, qb, pb, kind: 1 },
      text: `Pack A: ${qty(qa)} for ${gel(pa)}. Pack B: ${qty(qb)} for ${gel(pb)}. Which pack is better value? Type the price for one ${g.unit} in the better pack.`,
      answer: { kind: 'money', value: best },
      answerText: `Pack ${better}, ${gel(best)} per ${g.unit}`,
      hint: 'PER means divide. Work out the price for ONE in each pack, then pick the lower one.',
      steps: [`Pack A: ${fmt(pa)} ÷ ${qa} = ${fmt(ua)} per ${g.unit}`, `Pack B: ${fmt(pb)} ÷ ${qb} = ${fmt(ub)} per ${g.unit}`, `${fmt(best)} is less than ${fmt(Math.max(ua, ub))}, so Pack ${better} is better value.`],
      revealPicture: true,
      picture: { type: 'compare', rows: [{ label: `A: ${fmt(ua)} each`, value: ua, tone: better === 'A' ? 'green' : 'blue' }, { label: `B: ${fmt(ub)} each`, value: ub, tone: better === 'B' ? 'green' : 'blue' }] },
      traps,
    };
  },
  compute: ({ qa, pa, qb, pb, kind }) => (kind === 0 ? clean(pa / qa) : kind === 2 ? clean(pa / (qa / 100)) : Math.min(clean(pa / qa), clean(pb / qb))),
  mistakes: [
    {
      problem: '3 kg of rice cost 7.50 GEL. What is the price per kg?',
      steps: ['3 ÷ 7.5 = 0.4', 'So 0.40 GEL per kg'],
      wrongStep: 0,
      reason: 'Divide the price by the amount: 7.5 ÷ 3 = 2.5, so 2.50 GEL per kg.',
      fixOptions: ['7.5 ÷ 3 = 2.5, so 2.50 GEL per kg', '3 ÷ 7.5 = 0.4, so 0.40 GEL per kg', '7.5 × 3 = 22.5 GEL per kg'],
      correctFix: 0,
    },
    {
      problem: 'Pack A: 4 juices for 6 GEL. Pack B: 10 juices for 12 GEL. Which is better value?',
      steps: ['Pack A costs 6 GEL and Pack B costs 12 GEL', '6 is less than 12, so Pack A is better value'],
      wrongStep: 1,
      reason: 'Compare the price for ONE: A is 6 ÷ 4 = 1.5 each, B is 12 ÷ 10 = 1.2 each. Pack B is better value.',
      fixOptions: ['A: 6 ÷ 4 = 1.5 each; B: 12 ÷ 10 = 1.2 each; B is better value', '6 is less than 12, so A is better value', 'B has more juices, so B is better value'],
      correctFix: 0,
    },
    {
      problem: 'Pack A: 5 pens for 4 GEL. Pack B: 8 pens for 6 GEL. Which is better value?',
      steps: ['A: 4 ÷ 5 = 0.8 each', 'B: 6 ÷ 8 = 0.75 each', '0.8 is more than 0.75, so Pack A is better value'],
      wrongStep: 2,
      reason: 'The LOWER price for one is the better value: 0.75 is lower, so Pack B.',
      fixOptions: ['0.75 is lower, so Pack B is better value', '0.8 is more, so Pack A is better value', 'They are the same'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    inverted: 'Divide the price by the amount to get the price for one.',
    multiplied: 'Divide, do not multiply, to find the price for one.',
    'other-pack': 'That is the dearer pack. The better value is the LOWER price for one.',
    'cheaper-pack': 'A cheaper pack may hold fewer items. Compare the price for one.',
    difference: 'The question asks for the price for one in the better pack, not the difference.',
    'per-km': 'Fuel use is quoted per 100 km, not per 1 km.',
  },
};
