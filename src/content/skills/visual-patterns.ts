import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';

const ID = 'visual-patterns';

interface Shape { shape: 'squares' | 'triangles' | 'tiles' | 'dots'; thing: string; a: number; b: number; describe: string }
const SHAPES: Shape[] = [
  { shape: 'squares', thing: 'matchsticks', a: 3, b: 1, describe: 'Each new square needs 3 more matchsticks; the first square needs 1 extra to close it' },
  { shape: 'triangles', thing: 'matchsticks', a: 2, b: 1, describe: 'Each new triangle needs 2 more matchsticks; the first needs 1 extra' },
  { shape: 'tiles', thing: 'tiles', a: 2, b: 1, describe: 'Each shape adds 2 tiles (one on each arm); there is 1 corner tile' },
  { shape: 'dots', thing: 'dots', a: 4, b: 1, describe: 'Each shape adds 4 dots (one on each arm); there is 1 centre dot' },
];

export const visualPatterns: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Rules from visual patterns',
  short: 'Matchstick patterns',
  prerequisites: ['sequences-continue'],
  variety: 4,
  explain: {
    sentences: [
      'A growing pattern of matchsticks, tiles or dots makes a number sequence: count the pieces in each shape.',
      'Squares in a row use 4, 7, 10, … matchsticks: each new square adds 3, and there is 1 extra to close the first square.',
      'So shape n has 3n + 1 matchsticks. The number you add each time goes in front of n.',
      'Check the rule on shape 1: 3 × 1 + 1 = 4. Then you can predict any shape, even shape 100.',
    ],
    rule: 'The amount added each time goes in front of n; adjust with + or − so that shape 1 is right.',
    picture: { type: 'pattern', shape: 'squares', terms: [1, 2, 3], labels: ['4 sticks', '7 sticks', '10 sticks'] },
  },
  examples: [
    { problem: 'Squares in a row use 4, 7, 10 matchsticks. How many matchsticks are in shape 5?', steps: ['Each new square adds 3 matchsticks', 'Shape 4: 10 + 3 = 13', 'Shape 5: 13 + 3 = 16'], answer: '16' },
    { problem: 'The same pattern: write the rule for shape n.', steps: ['Add 3 each time, so the rule starts 3n', 'Shape 1 has 4: 3 × 1 = 3, so add 1', 'Rule: 3n + 1', 'Check shape 3: 3 × 3 + 1 = 10 ✓'], answer: '3n + 1' },
  ],
  faded: [
    { problem: 'Triangles in a row use 3, 5, 7 matchsticks. How many in shape 6?', steps: [{ given: 'Each new triangle adds 2, so the rule is 2n + 1' }, { prompt: 'Shape 6: 2 × 6 + 1 = ?', answer: { kind: 'number', value: 13 }, answerText: '13' }] },
    { problem: 'L-shapes use 3, 5, 7, 9 tiles. Write the rule for shape n.', steps: [{ prompt: 'The number added each time is ?', answer: { kind: 'number', value: 2 }, answerText: '2' }, { given: 'Shape 1 has 3: 2 × 1 = 2, so add 1' }, { prompt: 'Rule: ? (type it with n)', answer: { kind: 'expression', value: 21, expression: '2n + 1' }, answerText: '2n + 1' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const s = rng.pick(SHAPES);
    const count = (n: number) => s.a * n + s.b;
    const picture: Picture = { type: 'pattern', shape: s.shape, terms: [1, 2, 3], labels: [1, 2, 3].map((n) => `${count(n)} ${s.thing}`) };
    const intro = `A pattern of ${s.shape === 'squares' ? 'squares' : s.shape === 'triangles' ? 'triangles' : s.shape === 'tiles' ? 'L-shaped tiles' : 'dots in a cross'} grows: shapes 1, 2 and 3 use ${count(1)}, ${count(2)} and ${count(3)} ${s.thing}.`;
    if (level === 1) {
      const n = rng.pick([4, 5, 6]);
      const r = count(n);
      const traps: Trap[] = [
        { value: count(n - 1), misconception: 'off-by-one', message: `That is shape ${n - 1}. Keep adding ${s.a} up to shape ${n}.` },
        { value: count(3) + s.a * (n - 3) + 1, misconception: 'off-by-one' },
        { value: count(3) * 2, misconception: 'doubled' },
      ].filter((t) => t.value !== r);
      const chain = Array.from({ length: n - 3 }, (_, i) => `Shape ${4 + i}: ${count(3 + i)} + ${s.a} = ${count(4 + i)}`);
      return { ...base, params: { a: s.a, b: s.b, n, kind: 0 }, text: `${intro} How many ${s.thing} are in shape ${n}?`, answer: { kind: 'number', value: r }, answerText: String(r), hint: `How many ${s.thing} are added each time?`, steps: [`Each new shape adds ${s.a} ${s.thing}`, ...chain], picture, traps };
    }
    if (level === 2) {
      const n = rng.pick([10, 12, 15, 20, 25, 50, 100]);
      const r = count(n);
      return {
        ...base, params: { a: s.a, b: s.b, n, kind: 1 }, text: `${intro} How many ${s.thing} are in shape ${n}?`,
        answer: { kind: 'number', value: r }, answerText: String(r),
        hint: `Find the rule first: ${s.a} is added each time, so it starts ${s.a}n.`,
        steps: [`Each shape adds ${s.a}, so the rule starts ${s.a}n`, `Shape 1 has ${count(1)}: ${s.a} × 1 = ${s.a}, so add ${s.b}`, `Rule: ${s.a}n + ${s.b}`, `Shape ${n}: ${s.a} × ${n} + ${s.b} = ${r}`], picture,
        traps: [
          { value: s.a * n, misconception: 'forgot-constant', message: `${s.a}n alone gives ${s.a * n}. Shape 1 has ${count(1)}, so add ${s.b}.` },
          { value: count(3) * (n / 3), misconception: 'scaled', message: `Shape ${n} is not ${n / 3} times shape 3; use the rule ${s.a}n + ${s.b}.` },
          { value: (s.a + s.b) * n, misconception: 'wrong-rule' },
        ].filter((t) => Number.isFinite(t.value) && t.value !== r),
      };
    }
    return {
      ...base, params: { a: s.a, b: s.b, n: 10, kind: 2 }, text: `${intro} Write the rule for the number of ${s.thing} in shape n.`,
      answer: { kind: 'expression', value: count(10), expression: `${s.a}n + ${s.b}` }, answerText: `${s.a}n + ${s.b}`,
      hint: `The number added each time goes in front of n. Then check shape 1.`,
      steps: [`Each shape adds ${s.a}, so the rule starts ${s.a}n`, `Shape 1 has ${count(1)}: ${s.a} × 1 = ${s.a}, so add ${s.b}`, `Rule: ${s.a}n + ${s.b}`, `Check shape 2: ${s.a} × 2 + ${s.b} = ${count(2)} ✓`, s.describe], picture, traps: [],
    };
  },
  compute: ({ a, b, n }) => a * n + b,
  mistakes: [
    { problem: 'Squares in a row use 4, 7, 10 matchsticks. How many in shape 10?', steps: ['Shape 1 has 4, so shape 10 has 10 × 4 = 40'], wrongStep: 0, reason: 'The pattern adds 3 each time, not 4: the rule is 3n + 1, so shape 10 has 31.', fixOptions: ['Rule 3n + 1: shape 10 has 3 × 10 + 1 = 31', 'Shape 10 has 10 × 4 = 40', 'Shape 10 has 10 + 3 = 13'], correctFix: 0 },
    { problem: 'A tile pattern uses 3, 5, 7 tiles. Write the rule for shape n.', steps: ['It adds 2 each time', 'So the rule is n + 2'], wrongStep: 1, reason: 'Adding 2 each time means 2n, not n + 2. Shape 1 has 3, so the rule is 2n + 1.', fixOptions: ['The rule is 2n + 1', 'The rule is n + 2', 'The rule is 2n'], correctFix: 0 },
    { problem: 'A dot pattern uses 5, 9, 13 dots. How many in shape 6?', steps: ['Adds 4 each time: rule 4n + 1', 'Shape 6: 4 × 6 + 1 = 24'], wrongStep: 1, reason: '4 × 6 = 24, then + 1 = 25.', fixOptions: ['Shape 6: 4 × 6 + 1 = 25', 'Shape 6: 4 × 6 + 1 = 24', 'Shape 6: 13 + 4 = 17'], correctFix: 0 },
  ],
  misconceptions: {
    'off-by-one': 'Count the shapes carefully: each step adds the same number once.',
    doubled: 'Shapes do not double; the same number is added each time.',
    'forgot-constant': 'After the n-part, check shape 1 and add or subtract to match it.',
    scaled: 'A rule like 3n + 1 does not scale up by multiplying a shape; use the rule.',
    'wrong-rule': 'The number added each time goes in front of n; the rest is a + or − adjustment.',
  },
};
