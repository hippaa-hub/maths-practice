import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { gcd, simplify } from '../util';

const ID = 'fractions-simplify';

export const fractionsSimplify: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Fractions: simplify and equivalent',
  short: 'Simplify fractions',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'Equivalent fractions are the same amount written with different numbers: 1/2, 2/4 and 4/8 are all a half.',
      'You make an equivalent fraction by multiplying or dividing the top and bottom by the SAME number.',
      'To simplify, divide top and bottom by a number that goes into both. Keep going until nothing goes into both.',
      'For example, 8/12: divide both by 4 to get 2/3.',
    ],
    rule: 'Whatever you do to the top, do to the bottom.',
    picture: { type: 'bar', parts: 12, shaded: 8, totalLabel: '8/12 = 2/3', shadedLabel: '8 of 12' },
  },
  examples: [
    {
      problem: 'Simplify 8/12.',
      steps: ['4 goes into both 8 and 12', 'Divide top and bottom by 4: 8/12 = 2/3', 'Nothing goes into both 2 and 3, so 2/3 is in its simplest form'],
      answer: '2/3',
    },
    {
      problem: 'Fill in the missing number: 3/4 = ?/20.',
      steps: ['The bottom went from 4 to 20: 4 × 5 = 20', 'Do the same to the top: 3 × 5 = 15', 'So 3/4 = 15/20'],
      answer: '15',
    },
  ],
  faded: [
    {
      problem: 'Simplify 6/9.',
      steps: [
        { given: '3 goes into both 6 and 9' },
        { prompt: 'Divide the top by 3: 6 ÷ 3 = ?', answer: { kind: 'number', value: 2 }, answerText: '2' },
        { prompt: 'Divide the bottom by 3: 9 ÷ 3 = ?', answer: { kind: 'number', value: 3 }, answerText: '3' },
        { given: 'So 6/9 = 2/3' },
      ],
    },
    {
      problem: 'Fill in the missing number: 2/5 = ?/15.',
      steps: [
        { prompt: 'The bottom went from 5 to 15: 5 × ? = 15', answer: { kind: 'number', value: 3 }, answerText: '3' },
        { prompt: 'Do the same to the top: 2 × 3 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const kind = rng.int(0, 1); // 0 simplify, 1 missing number
    if (kind === 0) {
      const dens = level === 1 ? [2, 3, 4, 5] : level === 2 ? [3, 4, 5, 6, 7, 8] : [5, 6, 7, 8, 9, 10, 12];
      const ks = level === 1 ? [2, 3, 4, 5] : level === 2 ? [2, 3, 4, 5, 6] : [3, 4, 6, 7, 8, 9, 12];
      const d = rng.pick(dens);
      const n = rng.int(1, d - 1);
      const [sn, sd] = simplify(n, d);
      const k = rng.pick(ks);
      const num = sn * k, den = sd * k;
      const g = gcd(num, den);
      const traps: Trap[] = [
        { value: (num - 1) / (den - 1), misconception: 'subtract', message: 'Subtracting the same number from top and bottom changes the fraction. Divide instead.' },
        { value: num / sd, misconception: 'one-side', message: 'Divide the top AND the bottom by the same number.' },
      ].filter((t) => Math.abs(t.value - sn / sd) > 1e-9 && Number.isFinite(t.value));
      return {
        ...base,
        params: { num, den, kind },
        text: `Write ${num}/${den} in its simplest form.`,
        answer: { kind: 'fraction', value: sn / sd, ratio: [sn, sd], simplest: true },
        answerText: `${sn}/${sd}`,
        hint: `Find the biggest number that goes into both ${num} and ${den}, then divide the top and the bottom by it.`,
        steps: [`${g} goes into both ${num} and ${den}`, `Divide top and bottom by ${g}: ${num}/${den} = ${sn}/${sd}`, `Nothing else goes into both ${sn} and ${sd}, so ${sn}/${sd} is the simplest form`],
        picture: { type: 'bar', parts: den <= 16 ? den : sd, shaded: den <= 16 ? num : sn, totalLabel: `${num}/${den}` },
        traps,
      };
    }
    const smallDens = level === 1 ? [2, 3, 4, 5] : level === 2 ? [3, 4, 5, 6, 8] : [4, 6, 7, 8, 9, 12];
    const d = rng.pick(smallDens);
    const n = rng.int(1, d - 1);
    const [sn, sd] = simplify(n, d);
    const k = level === 1 ? rng.int(2, 5) : level === 2 ? rng.int(3, 8) : rng.int(5, 12);
    const askTop = level === 3 ? rng.chance(0.5) : true;
    const big = sd * k;
    const r = askTop ? sn * k : big;
    if (askTop) {
      return {
        ...base,
        params: { num: sn, den: sd, kind, k, askTop: 1 },
        text: `Fill in the missing number: ${sn}/${sd} = ?/${big}.`,
        answer: { kind: 'number', value: r },
        answerText: String(r),
        hint: `What do you multiply ${sd} by to get ${big}?`,
        steps: [`The bottom went from ${sd} to ${big}: ${sd} × ${k} = ${big}`, `Do the same to the top: ${sn} × ${k} = ${r}`, `So ${sn}/${sd} = ${r}/${big}`],
        picture: { type: 'bar', parts: sd, shaded: sn, totalLabel: `${sn}/${sd}` },
        traps: [
          { value: sn + (big - sd), misconception: 'subtract', message: `The bottom was multiplied by ${k}, not increased by ${big - sd}. Multiply the top by ${k} too.` },
          { value: sn * sd, misconception: 'one-side' },
        ].filter((t) => t.value !== r),
      };
    }
    const top = sn * k;
    return {
      ...base,
      params: { num: sn, den: sd, kind, k, askTop: 0 },
      text: `Fill in the missing number: ${sn}/${sd} = ${top}/?.`,
      answer: { kind: 'number', value: big },
      answerText: String(big),
      hint: `What do you multiply ${sn} by to get ${top}?`,
      steps: [`The top went from ${sn} to ${top}: ${sn} × ${k} = ${top}`, `Do the same to the bottom: ${sd} × ${k} = ${big}`, `So ${sn}/${sd} = ${top}/${big}`],
      picture: { type: 'bar', parts: sd, shaded: sn, totalLabel: `${sn}/${sd}` },
      traps: [
        { value: sd + (top - sn), misconception: 'subtract' },
        { value: sd * sn, misconception: 'one-side' },
      ].filter((t) => t.value !== big),
    };
  },
  compute: ({ num, den, kind, k, askTop }) => {
    if (kind === 0) { const [a, b] = simplify(num, den); return a / b; }
    return askTop ? num * k : den * k;
  },
  mistakes: [
    {
      problem: 'Simplify 10/15.',
      steps: ['5 goes into both 10 and 15', 'Divide the top by 5: 10 ÷ 5 = 2', 'So 10/15 = 2/15'],
      wrongStep: 2,
      reason: 'The bottom must be divided by 5 as well: 15 ÷ 5 = 3, so 10/15 = 2/3.',
      fixOptions: ['Divide the bottom by 5 too: 10/15 = 2/3', 'So 10/15 = 2/15', 'So 10/15 = 2/10'],
      correctFix: 0,
    },
    {
      problem: 'Fill in the missing number: 2/3 = ?/12.',
      steps: ['The bottom went from 3 to 12, so add 9', 'Add 9 to the top too: 2 + 9 = 11', 'So 2/3 = 11/12'],
      wrongStep: 0,
      reason: 'The bottom was MULTIPLIED by 4 (3 × 4 = 12), so multiply the top by 4: 2 × 4 = 8.',
      fixOptions: ['The bottom was multiplied by 4, so the top is 2 × 4 = 8', 'Add 9 to the top: 11', 'Keep the top the same: 2/12'],
      correctFix: 0,
    },
    {
      problem: 'Simplify 12/18.',
      steps: ['2 goes into both: 12/18 = 6/9', 'So the simplest form is 6/9'],
      wrongStep: 1,
      reason: '6/9 can still be simplified, because 3 goes into both 6 and 9: 6/9 = 2/3.',
      fixOptions: ['3 goes into both 6 and 9: 6/9 = 2/3', 'So the simplest form is 6/9', '6/9 = 3/4.5'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    subtract: 'To make an equivalent fraction, multiply or divide; adding or subtracting changes the amount.',
    'one-side': 'Whatever you do to the top, do to the bottom as well.',
  },
};
