import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { clean, decimals, fmt, shuffleChoices } from '../util';

const ID = 'decimals-x10';
const PLACES = ['units', 'tenths', 'hundredths', 'thousandths'];

export const decimalsX10: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Decimals: place value, × and ÷ by 10, 100, 1000',
  short: 'Decimals × ÷ 10',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'Each place in a number is 10 times the place to its right: units, then tenths, hundredths, thousandths after the point.',
      'Multiplying by 10 moves every digit one place to the LEFT, so the number gets bigger: 3.47 × 10 = 34.7.',
      'Dividing by 10 moves every digit one place to the RIGHT: 3.47 ÷ 10 = 0.347.',
      '× 100 or ÷ 100 moves two places; × 1000 or ÷ 1000 moves three.',
    ],
    rule: 'The digits move, the decimal point stays. × 10 moves left one place; ÷ 10 moves right one place.',
    picture: { type: 'table', headers: ['tens', 'units', '.', 'tenths', 'hundredths'], rows: [['', '3', '.', '4', '7'], ['3', '4', '.', '7', '']] },
  },
  examples: [
    {
      problem: 'Work out 3.47 × 100.',
      steps: ['× 100 moves every digit two places to the left', '3.47 × 100 = 347'],
      answer: '347',
    },
    {
      problem: 'Work out 52 ÷ 1000.',
      steps: ['÷ 1000 moves every digit three places to the right', '52 ÷ 1000 = 0.052'],
      answer: '0.052',
    },
  ],
  faded: [
    {
      problem: 'Work out 0.6 × 10.',
      steps: [
        { given: '× 10 moves every digit one place to the left' },
        { prompt: '0.6 × 10 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' },
      ],
    },
    {
      problem: 'Work out 45 ÷ 100.',
      steps: [
        { given: '÷ 100 moves every digit two places to the right' },
        { prompt: '45 ÷ 100 = ?', answer: { kind: 'number', value: 0.45 }, answerText: '0.45' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.35)) {
      // Place value: which place is the digit in?
      const digits = [rng.int(1, 9), rng.int(0, 9), rng.int(1, 9), rng.int(1, 9)];
      const num = `${digits[0]}.${digits[1]}${digits[2]}${digits[3]}`;
      const pos = rng.int(1, 3);
      const digit = digits[pos];
      const correct = `${digit} ${PLACES[pos]}`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, PLACES.filter((_, i) => i !== pos).map((p) => `${digit} ${p}`));
      return {
        ...base,
        params: { kind: 2, value: digit / Math.pow(10, pos) },
        text: `In the number ${num}, what does the digit ${digit} stand for?`,
        answer: { kind: 'choice', value: 0, choice: correctIndex },
        answerText: correct,
        hint: 'After the point: tenths, then hundredths, then thousandths.',
        steps: [`The places after the point are tenths, hundredths, thousandths`, `The ${digit} is in place ${pos} after the point, so it is ${digit} ${PLACES[pos]}`],
        choices,
        traps: [],
      };
    }
    const op = level === 1 ? rng.int(0, 1) : rng.int(0, 1); // 0 multiply, 1 divide
    const power = level === 1 || (level === 2 && op === 1) ? rng.pick([10, 100]) : rng.pick([10, 100, 1000]);
    const places = Math.log10(power);
    const limit = level === 3 ? 3 : 2;
    let a = 0, r = 0;
    for (let tries = 0; tries < 60; tries++) {
      if (level === 1) a = op === 1 ? rng.int(1, 99) : clean(rng.int(1, 99) / 10);
      else if (level === 2) a = clean(rng.int(1, 999) / rng.pick([1, 10, 100]));
      else a = clean(rng.int(1, 9999) / rng.pick([1, 10, 100, 1000]));
      r = clean(op === 0 ? a * power : a / power);
      if (decimals(r) <= limit && decimals(a) <= limit) break;
    }
    if (decimals(r) > limit) { a = 50; r = clean(op === 0 ? a * power : a / power); }
    const traps: Trap[] = [
      { value: clean(op === 0 ? a / power : a * power), misconception: 'wrong-way', message: op === 0 ? '× makes the number bigger: digits move left.' : '÷ makes the number smaller: digits move right.' },
      { value: clean(op === 0 ? a * power / 10 : a / power * 10), misconception: 'wrong-places', message: `× or ÷ by ${power} moves ${places} place${places > 1 ? 's' : ''}.` },
      { value: clean(op === 0 ? a * power * 10 : a / power / 10), misconception: 'wrong-places', message: `× or ÷ by ${power} moves ${places} place${places > 1 ? 's' : ''}.` },
    ].filter((t) => Math.abs(t.value - r) > 1e-9);
    return {
      ...base,
      params: { kind: op, a, power },
      text: `Work out ${fmt(a)} ${op === 0 ? '×' : '÷'} ${power}.`,
      answer: { kind: 'number', value: r },
      answerText: fmt(r),
      hint: `${op === 0 ? '×' : '÷'} ${power} moves every digit ${['one', 'two', 'three'][places - 1]} place${places > 1 ? 's' : ''} to the ${op === 0 ? 'left' : 'right'}.`,
      steps: [`${op === 0 ? '×' : '÷'} ${power} moves every digit ${places} place${places > 1 ? 's' : ''} to the ${op === 0 ? 'left' : 'right'}`, `${fmt(a)} ${op === 0 ? '×' : '÷'} ${power} = ${fmt(r)}`],
      traps,
    };
  },
  compute: ({ kind, a, power, value }) => (kind === 2 ? value : kind === 0 ? clean(a * power) : clean(a / power)),
  mistakes: [
    {
      problem: 'Work out 4.5 × 100.',
      steps: ['× 100 means add two zeros: 4.5 × 100 = 4.500'],
      wrongStep: 0,
      reason: 'Adding zeros only works for whole numbers. × 100 moves the digits two places left: 4.5 → 450.',
      fixOptions: ['× 100 moves the digits two places left: 450', '× 100 means add two zeros: 4.500', '× 100 moves one place: 45'],
      correctFix: 0,
    },
    {
      problem: 'Work out 36 ÷ 1000.',
      steps: ['÷ 1000 moves the digits three places to the right', '36 ÷ 1000 = 0.36'],
      wrongStep: 1,
      reason: 'Three places: 36 → 3.6 → 0.36 → 0.036.',
      fixOptions: ['36 ÷ 1000 = 0.036', '36 ÷ 1000 = 0.36', '36 ÷ 1000 = 0.0036'],
      correctFix: 0,
    },
    {
      problem: 'Work out 0.08 × 10.',
      steps: ['× 10 moves the digits one place to the right: 0.08 × 10 = 0.008'],
      wrongStep: 0,
      reason: 'Multiplying makes the number bigger, so the digits move LEFT: 0.08 × 10 = 0.8.',
      fixOptions: ['× 10 moves the digits one place to the left: 0.8', '× 10 moves the digits one place to the right: 0.008', '× 10 adds a zero: 0.080'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'wrong-way': 'Multiplying makes a number bigger (digits move left); dividing makes it smaller (digits move right).',
    'wrong-places': 'Count the zeros: 10 is one place, 100 is two, 1000 is three.',
  },
};
