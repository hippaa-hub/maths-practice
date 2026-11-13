import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { clean, decimals, fmt } from '../util';

const ID = 'converting-rates';

interface RateConv { from: string; to: string; factor: number; how: string; why: string }
const CONVS: RateConv[] = [
  { from: 'L/h', to: 'L/day', factor: 24, how: 'multiply by 24', why: 'There are 24 hours in a day' },
  { from: 'mL/min', to: 'mL/h', factor: 60, how: 'multiply by 60', why: 'There are 60 minutes in an hour' },
  { from: 'm/min', to: 'm/h', factor: 60, how: 'multiply by 60', why: 'There are 60 minutes in an hour' },
  { from: 'km/h', to: 'km/day', factor: 24, how: 'multiply by 24', why: 'There are 24 hours in a day' },
  { from: 'L/day', to: 'L/h', factor: 1 / 24, how: 'divide by 24', why: 'There are 24 hours in a day' },
  { from: 'mL/h', to: 'mL/min', factor: 1 / 60, how: 'divide by 60', why: 'There are 60 minutes in an hour' },
];

export const convertingRates: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Converting rates',
  short: 'Rates',
  taught: true,
  prerequisites: ['converting-units', 'speed-distance-time'],
  explain: {
    sentences: [
      'A rate has two units, like litres per hour. To change the time unit, think how many of the small time units fit in the big one.',
      '5 litres per hour is 5 × 24 = 120 litres per day, because a day has 24 hours.',
      'For speed, change both units: 20 m/s is 20 × 3600 = 72 000 metres per hour, which is 72 km/h.',
      'A shortcut: m/s × 3.6 = km/h, and km/h ÷ 3.6 = m/s.',
    ],
    rule: 'Bigger time unit → multiply the amount. m/s to km/h: × 3.6.',
    picture: { type: 'doubleLine', top: { label: 'm/s', values: [10, 20, 25] }, bottom: { label: 'km/h', values: [36, 72, 90] } },
  },
  examples: [
    {
      problem: 'A tap drips 5 litres per hour. How many litres is that per day?',
      steps: ['There are 24 hours in a day, so multiply by 24', '5 × 24 = 120', 'So 120 L/day.'],
      answer: '120 L/day',
    },
    {
      problem: 'A car travels at 20 m/s. What is that in km/h?',
      steps: ['In one hour (3600 seconds) it goes 20 × 3600 = 72000 metres', '72000 m is 72000 ÷ 1000 = 72 km', 'So 72 km/h.'],
      answer: '72 km/h',
    },
  ],
  faded: [
    {
      problem: 'Water flows at 30 mL per minute. How much is that per hour?',
      steps: [
        { given: 'There are 60 minutes in an hour, so multiply by 60' },
        { prompt: '30 × 60 = ?', answer: { kind: 'number', value: 1800 }, answerText: '1800 mL/h' },
      ],
    },
    {
      problem: 'A runner goes at 5 m/s. What is that in km/h?',
      steps: [
        { prompt: 'In 3600 seconds: 5 × 3600 = ? metres', answer: { kind: 'number', value: 18000 }, answerText: '18000' },
        { prompt: '18000 ÷ 1000 = ? km/h', answer: { kind: 'number', value: 18 }, answerText: '18 km/h' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level >= 2 && rng.chance(level === 2 ? 0.4 : 0.6)) {
      const toKmh = level === 2 || rng.chance(0.5);
      const ms = rng.pick([5, 10, 15, 20, 25, 30, 40, 50]);
      const kmh = clean(ms * 3.6);
      if (toKmh) {
        return {
          ...base, params: { v: ms, factor: 3.6, kind: 1 },
          text: `${rng.pick(['A car', 'A cyclist', 'A train', 'The wind'])} moves at ${ms} m/s. What is that in km/h?`,
          answer: { kind: 'number', value: kmh }, answerText: `${fmt(kmh)} km/h`,
          hint: 'In one hour there are 3600 seconds. Then change metres to km.',
          steps: [`In one hour (3600 seconds): ${ms} × 3600 = ${ms * 3600} metres`, `${ms * 3600} ÷ 1000 = ${fmt(kmh)}`, `So ${fmt(kmh)} km/h.`],
          traps: [
            { value: clean(ms / 3.6), misconception: 'wrong-way', message: 'km/h is a bigger number than m/s: multiply by 3.6.' },
            { value: ms * 3600, misconception: 'forgot-km', message: `${ms * 3600} is metres per hour. Divide by 1000 for km.` },
            { value: ms * 60, misconception: 'wrong-factor' },
          ].filter((t) => Math.abs(t.value - kmh) > 1e-9),
        };
      }
      return {
        ...base, params: { v: kmh, factor: 1 / 3.6, kind: 2 },
        text: `A speed limit is ${fmt(kmh)} km/h. What is that in m/s?`,
        answer: { kind: 'number', value: ms }, answerText: `${ms} m/s`,
        hint: 'km/h ÷ 3.6 = m/s.',
        steps: [`${fmt(kmh)} km is ${fmt(kmh)} × 1000 = ${kmh * 1000} metres in one hour`, `One hour is 3600 seconds: ${kmh * 1000} ÷ 3600 = ${ms}`, `So ${ms} m/s.`],
        traps: [
          { value: clean(kmh * 3.6), misconception: 'wrong-way', message: 'm/s is a smaller number than km/h: divide by 3.6.' },
          { value: clean(kmh / 60), misconception: 'wrong-factor' },
        ].filter((t) => Math.abs(t.value - ms) > 1e-9),
      };
    }
    const c = rng.pick(level === 1 ? CONVS.slice(0, 4) : CONVS);
    let v = 5;
    for (let tries = 0; tries < 50; tries++) {
      v = c.factor < 1 ? rng.pick([24, 48, 72, 120, 240, 60, 180, 300, 600, 900, 1200]) : rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 1.5, 2.5]);
      if (decimals(clean(v * c.factor)) <= 1) break;
    }
    const r = clean(v * c.factor);
    const n = c.factor < 1 ? Math.round(1 / c.factor) : c.factor;
    const traps: Trap[] = [
      { value: clean(c.factor < 1 ? v * n : v / n), misconception: 'wrong-way', message: c.factor < 1 ? `${c.to} is a shorter time, so the amount is smaller: divide by ${n}.` : `${c.to} is a longer time, so the amount is bigger: multiply by ${n}.` },
      { value: clean(v * (n === 24 ? 60 : 24)), misconception: 'wrong-factor' },
    ].filter((t) => Math.abs(t.value - r) > 1e-9);
    const subject = c.from.startsWith('L') ? 'A tap drips' : c.from.startsWith('mL') ? 'A drip gives' : c.from.startsWith('m/') ? 'A snail moves' : 'A car averages';
    return {
      ...base, params: { v, factor: c.factor, kind: 0 },
      text: `${subject} ${fmt(v)} ${c.from}. What is that in ${c.to}?`,
      answer: { kind: 'number', value: r }, answerText: `${fmt(r)} ${c.to}`,
      hint: `${c.why}, so ${c.how}.`,
      steps: [`${c.why}, so ${c.how}`, c.factor < 1 ? `${fmt(v)} ÷ ${n} = ${fmt(r)}` : `${fmt(v)} × ${n} = ${fmt(r)}`, `So ${fmt(r)} ${c.to}.`],
      traps,
    };
  },
  compute: ({ v, factor }) => clean(v * factor),
  mistakes: [
    {
      problem: 'A pump moves 40 L per hour. How much per day?',
      steps: ['A day has 24 hours', '40 ÷ 24 = 1.67 L/day'],
      wrongStep: 1,
      reason: 'A day is longer than an hour, so the pump moves MORE: 40 × 24 = 960 L/day.',
      fixOptions: ['40 × 24 = 960 L/day', '40 ÷ 24 = 1.67 L/day', '40 × 60 = 2400 L/day'],
      correctFix: 0,
    },
    {
      problem: 'Change 10 m/s into km/h.',
      steps: ['In one hour: 10 × 60 = 600 m', '600 ÷ 1000 = 0.6 km/h'],
      wrongStep: 0,
      reason: 'An hour has 3600 seconds, not 60: 10 × 3600 = 36000 m, which is 36 km/h.',
      fixOptions: ['In one hour: 10 × 3600 = 36000 m, so 36 km/h', 'In one hour: 10 × 60 = 600 m', '10 ÷ 3.6 = 2.8 km/h'],
      correctFix: 0,
    },
    {
      problem: 'Change 90 km/h into m/s.',
      steps: ['90 km is 90000 m in one hour', 'One hour is 60 seconds: 90000 ÷ 60 = 1500 m/s'],
      wrongStep: 1,
      reason: 'One hour is 3600 seconds: 90000 ÷ 3600 = 25 m/s.',
      fixOptions: ['One hour is 3600 seconds: 90000 ÷ 3600 = 25 m/s', 'One hour is 60 seconds: 1500 m/s', '90 × 3.6 = 324 m/s'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'wrong-way': 'A longer time unit means a bigger amount (multiply); a shorter one means smaller (divide).',
    'wrong-factor': '60 minutes in an hour, 24 hours in a day, 3600 seconds in an hour.',
    'forgot-km': 'After changing the time, change the distance unit too (1000 m in a km).',
  },
};
