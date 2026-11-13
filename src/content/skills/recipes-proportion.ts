import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { clean, decimals, fmt } from '../util';

const ID = 'recipes-proportion';

const INGREDIENTS = ['flour', 'sugar', 'butter', 'rice', 'cheese', 'milk'];
const UNITS: Record<string, string> = { flour: 'g', sugar: 'g', butter: 'g', rice: 'g', cheese: 'g', milk: 'mL' };

export const recipesProportion: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Recipes and proportion',
  short: 'Recipes',
  taught: true,
  prerequisites: ['ratio-equivalent'],
  explain: {
    sentences: [
      'A recipe for 4 people needs 300 g of flour. For more or fewer people, the flour changes in proportion.',
      'The safest way is the unitary method: find the amount for ONE person first, then multiply.',
      '300 g ÷ 4 = 75 g per person, so 6 people need 6 × 75 = 450 g.',
      'If the number of people doubles, every ingredient doubles. Adding the same number does not work.',
    ],
    rule: 'Find the amount for one, then multiply by how many you need.',
    picture: { type: 'doubleLine', top: { label: 'people', values: [1, 4, 6] }, bottom: { label: 'flour (g)', values: [75, 300, 450] } },
  },
  examples: [
    {
      problem: 'A recipe for 4 people needs 300 g of flour. How much flour for 6 people?',
      steps: ['For one person: 300 ÷ 4 = 75', 'For 6 people: 6 × 75 = 450', 'So 450 g of flour.'],
      answer: '450 g',
    },
    {
      problem: 'A recipe for 10 khachapuri uses 750 g of cheese. How many khachapuri can you make with 450 g?',
      steps: ['For one khachapuri: 750 ÷ 10 = 75', 'How many 75s in 450? 450 ÷ 75 = 6', 'So 6 khachapuri.'],
      answer: '6',
    },
  ],
  faded: [
    {
      problem: 'A recipe for 2 people needs 150 mL of milk. How much milk for 5 people?',
      steps: [
        { prompt: 'For one person: 150 ÷ 2 = ?', answer: { kind: 'number', value: 75 }, answerText: '75' },
        { prompt: 'For 5 people: 5 × 75 = ?', answer: { kind: 'number', value: 375 }, answerText: '375 mL' },
      ],
    },
    {
      problem: 'A recipe for 6 pancakes uses 180 g of flour. How much flour for 10 pancakes?',
      steps: [
        { given: 'For one pancake: 180 ÷ 6 = 30' },
        { prompt: 'For 10 pancakes: 10 × 30 = ?', answer: { kind: 'number', value: 300 }, answerText: '300 g' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const ing = rng.pick(INGREDIENTS);
    const unit = UNITS[ing];
    const from = level === 1 ? rng.pick([2, 3, 4, 5]) : rng.pick([3, 4, 5, 6, 8, 10, 12]);
    const per = level === 1 ? rng.pick([25, 50, 75, 100, 150]) : rng.pick([15, 20, 25, 30, 40, 45, 60, 75, 125]);
    const amount = from * per;
    let to: number;
    if (level === 1) to = from * rng.int(2, 4);
    else to = rng.pick([2, 3, 5, 6, 7, 8, 9, 10, 12, 15, 20].filter((x) => x !== from));
    const reverse = level === 3 && rng.chance(0.4);
    if (reverse) {
      const have = to * per;
      const traps: Trap[] = [
        { value: clean(have / from), misconception: 'wrong-divide' },
        { value: clean(have - amount), misconception: 'additive' },
      ].filter((t) => Math.abs(t.value - to) > 1e-9 && decimals(t.value) <= 2);
      return {
        ...base,
        params: { from, per, to, reverse: 1 },
        text: `A recipe for ${from} people uses ${amount} ${unit} of ${ing}. How many people can you cook for with ${have} ${unit} of ${ing}?`,
        answer: { kind: 'number', value: to },
        answerText: `${to} people`,
        hint: `How much ${ing} does ONE person need? Then see how many times that goes into ${have}.`,
        steps: [`For one person: ${amount} ÷ ${from} = ${per}`, `How many ${per}s in ${have}? ${have} ÷ ${per} = ${to}`, `So ${to} people.`],
        picture: { type: 'doubleLine', top: { label: 'people', values: [1, from, '?' as unknown as number] }, bottom: { label: ing, values: ['?' as unknown as number, amount, have] } },
        traps,
      };
    }
    const r = to * per;
    const traps: Trap[] = [
      { value: amount + (to - from), misconception: 'additive', message: `Going from ${from} to ${to} people is not "add ${to - from}". Find the amount for one person first.` },
      { value: clean(amount * to), misconception: 'multiplied-total' },
      { value: per, misconception: 'one-only', message: `${per} ${unit} is for one person. Multiply by ${to}.` },
    ].filter((t) => Math.abs(t.value - r) > 1e-9);
    return {
      ...base,
      params: { from, per, to, reverse: 0 },
      text: rng.pick([
        `A recipe for ${from} people needs ${amount} ${unit} of ${ing}. How much ${ing} is needed for ${to} people?`,
        `${amount} ${unit} of ${ing} makes ${from} portions. How much ${ing} for ${to} portions?`,
      ]),
      answer: { kind: 'number', value: r },
      answerText: `${fmt(r)} ${unit}`,
      hint: `First find the ${ing} for ONE person: ${amount} ÷ ${from}.`,
      steps: [`For one person: ${amount} ÷ ${from} = ${per}`, `For ${to} people: ${to} × ${per} = ${r}`, `So ${r} ${unit} of ${ing}.`],
      picture: { type: 'doubleLine', top: { label: 'people', values: [1, from, to] }, bottom: { label: ing, values: ['?' as unknown as number, amount, '?' as unknown as number] } },
      traps,
    };
  },
  compute: ({ per, to, reverse }) => (reverse ? to : to * per),
  mistakes: [
    {
      problem: 'A recipe for 4 people uses 200 g of rice. How much for 6 people?',
      steps: ['6 people is 2 more than 4', 'So add 2 g: 200 + 2 = 202 g'],
      wrongStep: 1,
      reason: 'Find the rice for one person: 200 ÷ 4 = 50 g. Then 6 × 50 = 300 g.',
      fixOptions: ['One person: 200 ÷ 4 = 50; six people: 6 × 50 = 300 g', 'Add 2 g: 202 g', 'Multiply by 6: 1200 g'],
      correctFix: 0,
    },
    {
      problem: 'A recipe for 3 people needs 90 g of butter. How much for 5 people?',
      steps: ['One person: 90 ÷ 3 = 30', 'Five people: 90 × 5 = 450 g'],
      wrongStep: 1,
      reason: 'Multiply the amount for ONE person by 5: 5 × 30 = 150 g.',
      fixOptions: ['Five people: 5 × 30 = 150 g', 'Five people: 90 × 5 = 450 g', 'Five people: 90 + 30 = 120 g'],
      correctFix: 0,
    },
    {
      problem: 'A recipe for 8 cookies uses 240 g of flour. How many cookies can you make with 600 g?',
      steps: ['One cookie: 240 ÷ 8 = 30', '600 × 30 = 18000 cookies'],
      wrongStep: 1,
      reason: 'Ask how many 30s go into 600: 600 ÷ 30 = 20 cookies.',
      fixOptions: ['600 ÷ 30 = 20 cookies', '600 × 30 = 18000 cookies', '600 − 240 = 360 cookies'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    additive: 'Recipes scale by multiplying. Find the amount for one person, then multiply.',
    'multiplied-total': 'Multiply the amount for ONE person, not the whole recipe amount.',
    'one-only': 'That is the amount for one person. Multiply by the number of people.',
    'wrong-divide': 'Divide the amount you have by the amount ONE person needs.',
  },
};
