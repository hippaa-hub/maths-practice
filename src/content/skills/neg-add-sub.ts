import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { NAMES, at, fmt } from '../util';

const ID = 'neg-add-sub';

const neg = (n: number) => fmt(n).replace('-', '−');

function picture(from: number, to: number): Picture {
  const lo = Math.min(from, to, 0) - 2, hi = Math.max(from, to, 0) + 2;
  return { type: 'numberLine', min: lo, max: hi, marks: [from, to], arrow: { from, to } };
}

export const negAddSub: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Negative numbers: add and subtract',
  short: 'Negatives + −',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'Negative numbers sit to the left of zero on the number line. −3 is 3 steps left of 0.',
      'Adding moves you to the right. Subtracting moves you to the left.',
      'Two signs next to each other can be swapped for one: 5 − (−3) is the same as 5 + 3, and 5 + (−3) is the same as 5 − 3.',
    ],
    rule: 'Two signs together: the same signs make a plus, different signs make a minus.',
    picture: { type: 'numberLine', min: -6, max: 6, marks: [-3, 5], arrow: { from: -3, to: 5 } },
  },
  examples: [
    {
      problem: 'It is −3°C in the morning. By lunchtime it is 8 degrees warmer. What is the temperature?',
      steps: ['Start at −3 on the number line', 'Warmer means add: move 8 to the right', '−3 + 8 = 5', 'The temperature is 5°C.'],
      answer: '5°C',
    },
    {
      problem: 'Work out 4 − (−6).',
      steps: ['Two minus signs together make a plus: 4 − (−6) = 4 + 6', '4 + 6 = 10'],
      answer: '10',
    },
  ],
  faded: [
    {
      problem: 'Work out −7 + 4.',
      steps: [
        { given: 'Start at −7. Adding 4 moves 4 to the right.' },
        { prompt: '−7 + 4 = ?', answer: { kind: 'number', value: -3 }, answerText: '−3', hint: 'Count up from −7: −6, −5, −4, −3.' },
      ],
    },
    {
      problem: 'Work out 2 − (−5).',
      steps: [
        { given: 'Two minus signs together make a plus: 2 − (−5) = 2 + 5' },
        { prompt: '2 + 5 = ?', answer: { kind: 'number', value: 7 }, answerText: '7' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 1) {
      const kind = rng.int(0, 1); // 0: a + b, 1: a − b
      const a = rng.int(-10, 10), b = rng.int(1, 10);
      const r = kind === 0 ? a + b : a - b;
      const ctxs = [
        kind === 0
          ? `It is ${neg(a)}°C in the morning. By noon it is ${b} degrees warmer. What is the temperature at noon?`
          : `It is ${neg(a)}°C in the evening. Overnight it gets ${b} degrees colder. What is the temperature in the morning?`,
        `Work out ${neg(a)} ${kind === 0 ? '+' : '−'} ${b}.`,
        kind === 0
          ? `${at(NAMES, a + 10)} is on floor ${neg(a)} of a car park in Tbilisi and goes up ${b} floors. Which floor now?`
          : `${at(NAMES, a + 10)} is on floor ${neg(a)} of a car park and goes down ${b} floors. Which floor now?`,
      ];
      const text = rng.pick(ctxs);
      const traps: Trap[] = [
        { value: -r, misconception: 'sign-slip' },
        { value: kind === 0 ? a - b : a + b, misconception: 'wrong-direction' },
        { value: Math.abs(a) + b, misconception: 'ignored-sign' },
      ].filter((t) => t.value !== r);
      return {
        ...base,
        params: { a, b, c: 0, kind },
        text,
        answer: { kind: 'number', value: r },
        answerText: neg(r),
        hint: kind === 0 ? `Start at ${neg(a)} and count ${b} to the right.` : `Start at ${neg(a)} and count ${b} to the left.`,
        steps: [`Start at ${neg(a)} on the number line`, kind === 0 ? `Adding moves right: ${neg(a)} + ${b} = ${neg(r)}` : `Subtracting moves left: ${neg(a)} − ${b} = ${neg(r)}`],
        picture: picture(a, r),
        traps,
      };
    }
    if (level === 2) {
      const kind = rng.int(2, 3); // 2: a − (−b), 3: a + (−b)
      const a = rng.int(-12, 12), b = rng.int(1, 12);
      const r = kind === 2 ? a + b : a - b;
      const text = kind === 2 ? `Work out ${neg(a)} − (${neg(-b)}).` : `Work out ${neg(a)} + (${neg(-b)}).`;
      const traps: Trap[] = [
        { value: kind === 2 ? a - b : a + b, misconception: 'double-sign', message: kind === 2 ? 'Minus a negative is a plus: − (−) becomes +.' : 'Plus a negative is a minus: + (−) becomes −.' },
        { value: -r, misconception: 'sign-slip' },
      ].filter((t) => t.value !== r);
      return {
        ...base,
        params: { a, b, c: 0, kind },
        text,
        answer: { kind: 'number', value: r },
        answerText: neg(r),
        hint: kind === 2 ? 'Two minus signs together make a plus.' : 'A plus and a minus together make a minus.',
        steps: kind === 2
          ? [`Two minus signs together make a plus: ${neg(a)} − (${neg(-b)}) = ${neg(a)} + ${b}`, `${neg(a)} + ${b} = ${neg(r)}`]
          : [`Plus a negative is a minus: ${neg(a)} + (${neg(-b)}) = ${neg(a)} − ${b}`, `${neg(a)} − ${b} = ${neg(r)}`],
        picture: picture(a, r),
        traps,
      };
    }
    // level 3: three terms, or the difference between two temperatures
    const kind = rng.int(4, 5);
    if (kind === 4) {
      const a = rng.int(-20, 20), b = rng.int(1, 20), c = rng.int(1, 20);
      const mid = a - b, r = mid + c;
      return {
        ...base,
        params: { a, b, c, kind },
        text: `Work out ${neg(a)} − ${b} + ${c}.`,
        answer: { kind: 'number', value: r },
        answerText: neg(r),
        hint: 'Work from left to right, one step at a time.',
        steps: [`First: ${neg(a)} − ${b} = ${neg(mid)}`, `Then: ${neg(mid)} + ${c} = ${neg(r)}`],
        picture: picture(a, r),
        traps: [
          { value: a - b - c, misconception: 'wrong-direction' },
          { value: -r, misconception: 'sign-slip' },
        ].filter((t) => t.value !== r),
      };
    }
    const lo = rng.int(-25, -1), hi = rng.int(0, 25);
    const r = hi - lo;
    return {
      ...base,
      params: { a: lo, b: hi, c: 0, kind },
      text: `The coldest night in Gudauri was ${neg(lo)}°C and the warmest day was ${hi}°C. What is the difference between the two temperatures?`,
      answer: { kind: 'number', value: r },
      answerText: `${r} degrees`,
      hint: `Count from ${neg(lo)} up to 0, then from 0 up to ${hi}.`,
      steps: [`From ${neg(lo)} up to 0 is ${-lo} degrees`, `From 0 up to ${hi} is ${hi} degrees`, `${-lo} + ${hi} = ${r}`],
      picture: picture(lo, hi),
      traps: [
        { value: hi + lo, misconception: 'ignored-sign', message: `The difference between ${neg(lo)} and ${hi} crosses zero, so add the two distances: ${-lo} + ${hi}.` },
        { value: -r, misconception: 'sign-slip' },
      ].filter((t) => t.value !== r),
    };
  },
  compute: ({ a, b, c, kind }) => {
    switch (kind) {
      case 0: return a + b;
      case 1: return a - b;
      case 2: return a + b;
      case 3: return a - b;
      case 4: return a - b + c;
      default: return b - a;
    }
  },
  mistakes: [
    {
      problem: 'Work out −5 + 8.',
      steps: ['Start at −5', 'Adding moves to the left: −5 + 8 = −13'],
      wrongStep: 1,
      reason: 'Adding moves to the RIGHT on the number line, so −5 + 8 = 3.',
      fixOptions: ['Adding moves to the right: −5 + 8 = 3', 'Adding moves to the left: −5 + 8 = −13', 'Ignore the sign: 5 + 8 = 13'],
      correctFix: 0,
    },
    {
      problem: 'Work out 6 − (−4).',
      steps: ['6 − (−4) = 6 − 4', '6 − 4 = 2'],
      wrongStep: 0,
      reason: 'Two minus signs together make a plus: 6 − (−4) = 6 + 4 = 10.',
      fixOptions: ['6 − (−4) = 6 + 4', '6 − (−4) = −6 − 4', '6 − (−4) = 6 − 4'],
      correctFix: 0,
    },
    {
      problem: 'It is −2°C. The temperature drops by 7 degrees. What is it now?',
      steps: ['Drops means subtract: −2 − 7', '−2 − 7 = 5'],
      wrongStep: 1,
      reason: 'Subtracting moves left from −2, so −2 − 7 = −9. The sign stays negative.',
      fixOptions: ['−2 − 7 = −9', '−2 − 7 = 5', '−2 − 7 = −5'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'sign-slip': 'The size is right but the sign is not. Check which side of zero you end up on.',
    'wrong-direction': 'Adding moves right on the number line; subtracting moves left.',
    'ignored-sign': 'The minus sign matters. Start at the negative number, not the positive one.',
    'double-sign': 'Two signs together: same signs make a plus, different signs make a minus.',
  },
};
