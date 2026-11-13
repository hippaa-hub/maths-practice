import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { clean, decimals, fmt } from '../util';

const ID = 'converting-units';

interface Conv { big: string; small: string; factor: number; kind: 'time' | 'length' | 'volume' | 'mass' }
const CONVS: Conv[] = [
  { big: 'hours', small: 'minutes', factor: 60, kind: 'time' },
  { big: 'minutes', small: 'seconds', factor: 60, kind: 'time' },
  { big: 'm', small: 'cm', factor: 100, kind: 'length' },
  { big: 'km', small: 'm', factor: 1000, kind: 'length' },
  { big: 'cm', small: 'mm', factor: 10, kind: 'length' },
  { big: 'L', small: 'mL', factor: 1000, kind: 'volume' },
  { big: 'kg', small: 'g', factor: 1000, kind: 'mass' },
];

export const convertingUnits: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Converting units: time, length and volume',
  short: 'Units',
  taught: true,
  prerequisites: ['decimals-x10'],
  explain: {
    sentences: [
      'To change big units into small units, multiply: 2 km is 2 × 1000 = 2000 m.',
      'To change small units into big units, divide: 350 cm is 350 ÷ 100 = 3.5 m.',
      'Time is different: 1 hour is 60 minutes and 1 minute is 60 seconds, so multiply or divide by 60, not 100.',
      'Ask yourself: should the number get bigger or smaller? Smaller units mean a bigger number.',
    ],
    rule: 'Same units first! Big → small: multiply. Small → big: divide. Length and volume use 10, 100, 1000; time uses 60.',
    picture: { type: 'table', headers: ['1 km', '1 m', '1 L', '1 hour'], rows: [['1000 m', '100 cm', '1000 mL', '60 min']] },
  },
  examples: [
    {
      problem: 'Change 2.5 hours into minutes.',
      steps: ['1 hour is 60 minutes, so multiply by 60', '2.5 × 60 = 150', 'So 150 minutes.'],
      answer: '150 minutes',
    },
    {
      problem: 'Change 350 cm into metres.',
      steps: ['100 cm make 1 m, so divide by 100', '350 ÷ 100 = 3.5', 'So 3.5 m.'],
      answer: '3.5 m',
    },
  ],
  faded: [
    {
      problem: 'Change 4 km into metres.',
      steps: [
        { given: '1 km is 1000 m, so multiply by 1000' },
        { prompt: '4 × 1000 = ?', answer: { kind: 'number', value: 4000 }, answerText: '4000 m' },
      ],
    },
    {
      problem: 'Change 90 minutes into hours.',
      steps: [
        { given: '60 minutes make 1 hour, so divide by 60' },
        { prompt: '90 ÷ 60 = ?', answer: { kind: 'number', value: 1.5 }, answerText: '1.5 hours' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const c = rng.pick(CONVS);
    const toSmall = level === 1 ? rng.chance(0.7) : rng.chance(0.5);
    let big = 1;
    for (let tries = 0; tries < 50; tries++) {
      if (level === 1) big = rng.int(1, 9);
      else if (level === 2) big = c.factor === 60 ? rng.pick([1.5, 2.5, 0.5, 3.5, 4.5, 0.25, 0.75]) : clean(rng.int(1, 99) / 10);
      else big = c.factor === 60 ? rng.pick([1.25, 2.75, 0.1, 0.2, 0.3, 1.1, 3.25]) : clean(rng.int(1, 999) / 100);
      if (decimals(clean(big * c.factor)) === 0) break;
    }
    const small = clean(big * c.factor);
    if (level === 3 && c.kind === 'time' && c.big === 'hours' && rng.chance(0.5)) {
      // 2 h 20 min -> minutes
      const h = rng.int(1, 4), m = rng.pick([5, 10, 15, 20, 25, 30, 40, 45, 50]);
      const total = h * 60 + m;
      return {
        ...base, params: { big: h, factor: 60, toSmall: 1, extra: m },
        text: `Change ${h} hours ${m} minutes into minutes.`,
        answer: { kind: 'number', value: total }, answerText: `${total} minutes`,
        hint: `${h} hours is ${h} × 60 minutes. Then add the ${m}.`,
        steps: [`${h} hours is ${h} × 60 = ${h * 60} minutes`, `Add the extra minutes: ${h * 60} + ${m} = ${total}`, `So ${total} minutes.`],
        traps: [
          { value: Number(`${h}${m}`), misconception: 'digits', message: `${h} h ${m} min is not ${h}${m} minutes. An hour is 60 minutes.` },
          { value: h * 100 + m, misconception: 'digits' },
        ].filter((t) => t.value !== total),
      };
    }
    if (toSmall) {
      const traps: Trap[] = [
        { value: clean(big / c.factor), misconception: 'wrong-way', message: `${c.small} are smaller than ${c.big}, so the number must get bigger: multiply.` },
        { value: clean(big * (c.factor === 60 ? 100 : c.factor === 100 ? 1000 : 100)), misconception: 'wrong-factor', message: `1 ${c.big.replace(/s$/, '')} is ${c.factor} ${c.small}.` },
      ].filter((t) => Math.abs(t.value - small) > 1e-9);
      return {
        ...base, params: { big, factor: c.factor, toSmall: 1, extra: 0 },
        text: `Change ${fmt(big)} ${c.big} into ${c.small}.`,
        answer: { kind: 'number', value: small }, answerText: `${fmt(small)} ${c.small}`,
        hint: `1 ${c.big.replace(/s$/, '')} is ${c.factor} ${c.small}. Multiply.`,
        steps: [`1 ${c.big.replace(/s$/, '')} is ${c.factor} ${c.small}, so multiply by ${c.factor}`, `${fmt(big)} × ${c.factor} = ${fmt(small)}`, `So ${fmt(small)} ${c.small}.`],
        traps,
      };
    }
    const traps: Trap[] = [
      { value: clean(small * c.factor), misconception: 'wrong-way', message: `${c.big} are bigger than ${c.small}, so the number must get smaller: divide.` },
      { value: clean(small / (c.factor === 60 ? 100 : c.factor === 100 ? 1000 : 100)), misconception: 'wrong-factor', message: `${c.factor} ${c.small} make 1 ${c.big.replace(/s$/, '')}.` },
    ].filter((t) => Math.abs(t.value - big) > 1e-9);
    return {
      ...base, params: { big, factor: c.factor, toSmall: 0, extra: 0 },
      text: `Change ${fmt(small)} ${c.small} into ${c.big}.`,
      answer: { kind: 'number', value: big }, answerText: `${fmt(big)} ${c.big}`,
      hint: `${c.factor} ${c.small} make 1 ${c.big.replace(/s$/, '')}. Divide.`,
      steps: [`${c.factor} ${c.small} make 1 ${c.big.replace(/s$/, '')}, so divide by ${c.factor}`, `${fmt(small)} ÷ ${c.factor} = ${fmt(big)}`, `So ${fmt(big)} ${c.big}.`],
      traps,
    };
  },
  compute: ({ big, factor, toSmall, extra }) => (toSmall ? clean(big * factor + extra) : big),
  mistakes: [
    {
      problem: 'Change 3 hours into minutes.',
      steps: ['1 hour is 100 minutes', '3 × 100 = 300 minutes'],
      wrongStep: 0,
      reason: 'An hour has 60 minutes, not 100: 3 × 60 = 180 minutes.',
      fixOptions: ['1 hour is 60 minutes: 3 × 60 = 180', '1 hour is 100 minutes: 300', '3 ÷ 60 = 0.05'],
      correctFix: 0,
    },
    {
      problem: 'Change 250 cm into metres.',
      steps: ['100 cm make 1 m, so multiply by 100', '250 × 100 = 25000 m'],
      wrongStep: 0,
      reason: 'Metres are bigger than centimetres, so the number gets smaller: divide. 250 ÷ 100 = 2.5 m.',
      fixOptions: ['Divide by 100: 250 ÷ 100 = 2.5 m', 'Multiply by 100: 25000 m', 'Divide by 10: 25 m'],
      correctFix: 0,
    },
    {
      problem: 'Change 1.5 litres into millilitres.',
      steps: ['1 L is 1000 mL, so multiply by 1000', '1.5 × 1000 = 150 mL'],
      wrongStep: 1,
      reason: '1.5 × 1000 moves the digits three places: 1500 mL.',
      fixOptions: ['1.5 × 1000 = 1500 mL', '1.5 × 1000 = 150 mL', '1.5 × 1000 = 15000 mL'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'wrong-way': 'Smaller units mean a bigger number (multiply); bigger units mean a smaller number (divide).',
    'wrong-factor': 'Check the conversion: 100 cm in a metre, 1000 m in a km, 1000 mL in a litre, 60 minutes in an hour.',
    digits: 'Hours and minutes are not decimal: an hour is 60 minutes.',
  },
};
