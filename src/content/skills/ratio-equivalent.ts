import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { gcd } from '../util';

const ID = 'ratio-equivalent';

export const ratioEquivalent: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Equivalent ratios and missing values',
  short: 'Equivalent ratios',
  taught: true,
  prerequisites: ['ratio-write-simplify'],
  explain: {
    sentences: [
      'Equivalent ratios show the same comparison with different numbers: 2:5, 4:10 and 6:15 are all the same ratio.',
      'To find a missing value, see what one part was multiplied by, and multiply the other part by the same number.',
      'For 2:5 = 6:?, the 2 became 6 (× 3), so the 5 becomes 15.',
      'A ratio table keeps it tidy: write the ratio in one column and the scaled version in the next.',
    ],
    rule: 'Multiply (or divide) every part of the ratio by the same number.',
    picture: { type: 'table', headers: ['first', 'second'], rows: [['2', '5'], ['× 3', '× 3'], ['6', '15']] },
  },
  examples: [
    {
      problem: 'Fill in the missing value: 2:5 = 6:?',
      steps: ['The first part went from 2 to 6: 2 × 3 = 6', 'Multiply the second part by 3 too: 5 × 3 = 15', 'So 2:5 = 6:15'],
      answer: '15',
    },
    {
      problem: 'Flour and sugar are mixed in the ratio 3:2. If there are 12 cups of flour, how much sugar is needed?',
      steps: ['Flour went from 3 to 12: 3 × 4 = 12', 'Sugar: 2 × 4 = 8', 'So 8 cups of sugar.'],
      answer: '8 cups',
    },
  ],
  faded: [
    {
      problem: 'Fill in the missing value: 3:4 = 9:?',
      steps: [
        { prompt: 'The first part went from 3 to 9: 3 × ? = 9', answer: { kind: 'number', value: 3 }, answerText: '3' },
        { prompt: 'Multiply the second part by 3: 4 × 3 = ?', answer: { kind: 'number', value: 12 }, answerText: '12' },
      ],
    },
    {
      problem: 'Red and white paint are mixed 1:4. How much white paint goes with 5 litres of red?',
      steps: [
        { given: 'Red went from 1 to 5: × 5' },
        { prompt: 'White: 4 × 5 = ?', answer: { kind: 'number', value: 20 }, answerText: '20 litres' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    let a = 2, b = 5;
    do { a = rng.int(1, level === 1 ? 5 : 9); b = rng.int(1, level === 1 ? 6 : 9); } while (a === b || gcd(a, b) !== 1);
    const k = level === 1 ? rng.int(2, 5) : level === 2 ? rng.int(3, 8) : rng.int(4, 12);
    const askSecond = level === 1 ? true : rng.chance(0.5);
    const given = askSecond ? a * k : b * k;
    const answer = askSecond ? b * k : a * k;
    const traps: Trap[] = [
      { value: askSecond ? b + (given - a) : a + (given - b), misconception: 'additive', message: `The part went ×${k}, not +${askSecond ? given - a : given - b}. Multiply the other part by ${k} too.` },
      { value: k, misconception: 'gave-multiplier' },
      { value: askSecond ? a * k : b * k, misconception: 'wrong-part' },
    ].filter((t) => t.value !== answer);
    const ctx = rng.int(0, 2);
    let text: string;
    let unit = '';
    if (ctx === 0) text = askSecond ? `Fill in the missing value: ${a}:${b} = ${given}:?` : `Fill in the missing value: ${a}:${b} = ?:${given}`;
    else if (ctx === 1) { unit = ' cups'; text = askSecond ? `Flour and sugar are mixed in the ratio ${a}:${b}. With ${given} cups of flour, how many cups of sugar are needed?` : `Flour and sugar are mixed in the ratio ${a}:${b}. With ${given} cups of sugar, how many cups of flour are needed?`; }
    else { unit = ' GEL'; text = askSecond ? `Nino and Luka share money in the ratio ${a}:${b}. Nino gets ${given} GEL. How much does Luka get?` : `Nino and Luka share money in the ratio ${a}:${b}. Luka gets ${given} GEL. How much does Nino get?`; }
    return {
      ...base,
      params: { a, b, k, askSecond: askSecond ? 1 : 0 },
      text,
      answer: { kind: unit === ' GEL' ? 'money' : 'number', value: answer },
      answerText: `${answer}${unit}`,
      hint: `What was ${askSecond ? a : b} multiplied by to get ${given}?`,
      steps: [
        `The ${askSecond ? 'first' : 'second'} part went from ${askSecond ? a : b} to ${given}: ${askSecond ? a : b} × ${k} = ${given}`,
        `Multiply the ${askSecond ? 'second' : 'first'} part by ${k} too: ${askSecond ? b : a} × ${k} = ${answer}`,
        `So ${a}:${b} = ${a * k}:${b * k}`,
      ],
      picture: { type: 'table', headers: ['first', 'second'], rows: [[a, b], ['× ?', '× ?'], [askSecond ? given : '?', askSecond ? '?' : given]] },
      traps,
    };
  },
  compute: ({ a, b, k, askSecond }) => (askSecond ? b * k : a * k),
  mistakes: [
    {
      problem: 'Fill in the missing value: 2:3 = 8:?',
      steps: ['2 went to 8, so add 6', '3 + 6 = 9', 'So 2:3 = 8:9'],
      wrongStep: 0,
      reason: 'Ratios scale by multiplying: 2 × 4 = 8, so 3 × 4 = 12.',
      fixOptions: ['2 × 4 = 8, so multiply by 4: 3 × 4 = 12', '2 went to 8, so add 6', '2 went to 8, so 3 goes to 8 too'],
      correctFix: 0,
    },
    {
      problem: 'Paint is mixed red:white = 2:5. With 10 litres of red, how much white?',
      steps: ['Red went from 2 to 10: × 5', 'White: 2 × 5 = 10 litres'],
      wrongStep: 1,
      reason: 'White is the 5 in the ratio, not the 2: 5 × 5 = 25 litres.',
      fixOptions: ['White: 5 × 5 = 25 litres', 'White: 2 × 5 = 10 litres', 'White: 10 − 2 = 8 litres'],
      correctFix: 0,
    },
    {
      problem: 'Fill in the missing value: 3:7 = ?:21',
      steps: ['7 went to 21: 7 × 3 = 21', 'So the answer is 3'],
      wrongStep: 1,
      reason: '3 is the multiplier. The missing part is 3 × 3 = 9.',
      fixOptions: ['The missing part is 3 × 3 = 9', 'So the answer is 3', 'The missing part is 21 − 7 = 14'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    additive: 'Ratios are scaled by multiplying, not by adding the same number.',
    'gave-multiplier': 'That is what you multiplied by. Now use it on the other part.',
    'wrong-part': 'Scale the OTHER part of the ratio, the one that is missing.',
  },
};
