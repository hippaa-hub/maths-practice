import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { clean, decimals, fmt } from '../util';

const ID = 'speed-distance-time';

const TRIPS = ['A bus from Tbilisi to Batumi', 'A train to Kutaisi', 'A cyclist', 'A car on the motorway', 'A runner', 'A ferry on the Black Sea'];

function hours(h: number): string {
  if (Number.isInteger(h)) return `${h} hour${h === 1 ? '' : 's'}`;
  if (h === 0.5) return 'half an hour';
  return `${fmt(h)} hours`;
}

export const speedDistanceTime: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Speed, distance and time',
  short: 'Speed',
  taught: true,
  prerequisites: ['unit-rates-best-buy'],
  explain: {
    sentences: [
      'Speed is a rate: how far you go in one unit of time, such as kilometres per hour (km/h).',
      'Speed = distance ÷ time. A bus that covers 120 km in 2 hours has a speed of 60 km/h.',
      'Turn it round to find the others: distance = speed × time, and time = distance ÷ speed.',
      'Keep the units matching: if the speed is in km/h, the time must be in hours (90 minutes is 1.5 hours).',
    ],
    rule: 'Speed = distance ÷ time. Distance = speed × time. Time = distance ÷ speed.',
    picture: { type: 'table', headers: ['distance', 'time', 'speed'], rows: [['120 km', '2 h', '60 km/h'], ['D', 'T', 'D ÷ T']] },
  },
  examples: [
    {
      problem: 'A bus travels 120 km in 2 hours. What is its speed?',
      steps: ['Speed = distance ÷ time', '120 ÷ 2 = 60', 'So the speed is 60 km/h.'],
      answer: '60 km/h',
    },
    {
      problem: 'A cyclist rides at 15 km/h for 90 minutes. How far does she go?',
      steps: ['Change the time to hours: 90 minutes is 1.5 hours', 'Distance = speed × time', '15 × 1.5 = 22.5', 'So 22.5 km.'],
      answer: '22.5 km',
    },
  ],
  faded: [
    {
      problem: 'A car travels 180 km in 3 hours. What is its speed?',
      steps: [
        { given: 'Speed = distance ÷ time' },
        { prompt: '180 ÷ 3 = ? (km/h)', answer: { kind: 'number', value: 60 }, answerText: '60 km/h' },
      ],
    },
    {
      problem: 'A train goes at 80 km/h. How long does it take to travel 200 km?',
      steps: [
        { given: 'Time = distance ÷ speed' },
        { prompt: '200 ÷ 80 = ? (hours)', answer: { kind: 'number', value: 2.5 }, answerText: '2.5 hours' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const kind = level === 1 ? 0 : level === 2 ? rng.int(0, 2) : rng.int(0, 2); // 0 speed, 1 distance, 2 time
    const who = rng.pick(TRIPS);
    let s = 60, t = 2;
    for (let tries = 0; tries < 60; tries++) {
      s = level === 1 ? rng.pick([20, 30, 40, 50, 60, 80, 90, 100]) : rng.pick([12, 15, 18, 24, 25, 36, 45, 50, 60, 72, 80, 90, 100, 120]);
      t = level === 1 ? rng.int(1, 5) : level === 2 ? rng.pick([1, 1.5, 2, 2.5, 3, 4, 0.5]) : rng.pick([0.25, 0.5, 0.75, 1.25, 1.5, 2.5, 3.5, 0.2, 0.4]);
      if (decimals(clean(s * t)) <= 1) break;
    }
    const d = clean(s * t);
    const minutes = clean(t * 60);
    const useMinutes = level === 3 && !Number.isInteger(t);
    const timeText = useMinutes ? `${minutes} minutes` : hours(t);
    const timeSteps = useMinutes ? [`Change the time to hours: ${minutes} minutes is ${minutes} ÷ 60 = ${fmt(t)} hours`] : [];
    if (kind === 0) {
      const traps: Trap[] = [
        { value: clean(d * t), misconception: 'multiplied' },
        { value: clean(t / d), misconception: 'inverted' },
        ...(useMinutes ? [{ value: clean(d / minutes), misconception: 'minutes', message: 'Change minutes into hours first: speed is in km per HOUR.' }] : []),
      ].filter((t2) => Math.abs(t2.value - s) > 1e-9);
      return {
        ...base, params: { s, t, kind },
        text: `${who} covers ${fmt(d)} km in ${timeText}. What is the speed in km/h?`,
        answer: { kind: 'number', value: s }, answerText: `${fmt(s)} km/h`,
        hint: 'PER means divide: speed is distance per hour, so distance ÷ time.',
        steps: [...timeSteps, 'Speed = distance ÷ time', `${fmt(d)} ÷ ${fmt(t)} = ${fmt(s)}`, `So the speed is ${fmt(s)} km/h.`],
        traps,
      };
    }
    if (kind === 1) {
      const traps: Trap[] = [
        { value: clean(s / t), misconception: 'divided' },
        ...(useMinutes ? [{ value: clean(s * minutes), misconception: 'minutes', message: 'Change minutes into hours first: the speed is per HOUR.' }] : []),
      ].filter((t2) => Math.abs(t2.value - d) > 1e-9);
      return {
        ...base, params: { s, t, kind },
        text: `${who} travels at ${fmt(s)} km/h for ${timeText}. How far does it go?`,
        answer: { kind: 'number', value: d }, answerText: `${fmt(d)} km`,
        hint: 'Distance = speed × time.',
        steps: [...timeSteps, 'Distance = speed × time', `${fmt(s)} × ${fmt(t)} = ${fmt(d)}`, `So ${fmt(d)} km.`],
        traps,
      };
    }
    const traps: Trap[] = [
      { value: clean(s / d), misconception: 'inverted' },
      { value: clean(d * s), misconception: 'multiplied' },
      { value: minutes, misconception: 'minutes', message: `${minutes} minutes is right, but the question asks for hours: ${fmt(t)}.` },
    ].filter((t2) => Math.abs(t2.value - t) > 1e-9);
    return {
      ...base, params: { s, t, kind },
      text: `${who} travels ${fmt(d)} km at ${fmt(s)} km/h. How long does it take, in hours?`,
      answer: { kind: 'number', value: t }, answerText: `${fmt(t)} hours`,
      hint: 'Time = distance ÷ speed.',
      steps: ['Time = distance ÷ speed', `${fmt(d)} ÷ ${fmt(s)} = ${fmt(t)}`, `So ${hours(t)}.`],
      traps,
    };
  },
  compute: ({ s, t, kind }) => (kind === 0 ? s : kind === 1 ? clean(s * t) : t),
  mistakes: [
    {
      problem: 'A bus travels 150 km in 3 hours. What is its speed?',
      steps: ['Speed = distance × time', '150 × 3 = 450 km/h'],
      wrongStep: 0,
      reason: 'Speed is distance DIVIDED by time: 150 ÷ 3 = 50 km/h.',
      fixOptions: ['Speed = distance ÷ time: 150 ÷ 3 = 50 km/h', 'Speed = distance × time: 450 km/h', 'Speed = time ÷ distance: 0.02 km/h'],
      correctFix: 0,
    },
    {
      problem: 'A car goes at 60 km/h for 30 minutes. How far does it travel?',
      steps: ['Distance = speed × time', '60 × 30 = 1800 km'],
      wrongStep: 1,
      reason: '30 minutes is 0.5 hours. 60 × 0.5 = 30 km. Minutes must be changed to hours first.',
      fixOptions: ['30 minutes is 0.5 h: 60 × 0.5 = 30 km', '60 × 30 = 1800 km', '60 ÷ 30 = 2 km'],
      correctFix: 0,
    },
    {
      problem: 'A train travels 200 km at 80 km/h. How long does it take?',
      steps: ['Time = speed ÷ distance', '80 ÷ 200 = 0.4 hours'],
      wrongStep: 0,
      reason: 'Time is distance DIVIDED by speed: 200 ÷ 80 = 2.5 hours.',
      fixOptions: ['Time = distance ÷ speed: 200 ÷ 80 = 2.5 hours', 'Time = speed ÷ distance: 0.4 hours', 'Time = speed × distance'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    multiplied: 'Speed and time come from DIVIDING. Only distance comes from multiplying.',
    inverted: 'Divide the distance by the time (or by the speed), not the other way round.',
    divided: 'Distance = speed × time: multiply.',
    minutes: 'Match the units: a speed in km/h needs the time in hours.',
  },
};
