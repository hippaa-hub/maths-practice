import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';

const ID = 'angles-triangle';

export const anglesTriangle: Skill = {
  id: ID,
  unit: 4,
  order: 0,
  title: 'Angles in a triangle',
  short: 'Triangle angles',
  taught: true,
  prerequisites: ['angles-line-point'],
  variety: 15,
  explain: {
    sentences: [
      'The three angles inside any triangle add up to 180°.',
      'To find a missing angle, add the two you know and subtract from 180°.',
      'An isosceles triangle has two equal sides and two equal base angles. If the top angle is 40°, the two base angles share 140°, so each is 70°.',
      'Write the reason each time: "angles in a triangle add up to 180°" or "base angles of an isosceles triangle are equal".',
    ],
    rule: 'Angles in a triangle add up to 180°. Isosceles: the two base angles are equal.',
    picture: { type: 'angles', kind: 'triangle', values: [60, 50, 'x'] },
  },
  examples: [
    { problem: 'A triangle has angles 60° and 50°. Find the third angle.', steps: ['Angles in a triangle add up to 180°', '60 + 50 = 110', '180 − 110 = 70', 'So the third angle is 70°'], answer: '70°' },
    { problem: 'An isosceles triangle has a top angle of 40°. Find each base angle.', steps: ['Angles in a triangle add up to 180°', '180 − 40 = 140 for the two base angles together', 'Base angles of an isosceles triangle are equal: 140 ÷ 2 = 70', 'So each base angle is 70°'], answer: '70°' },
  ],
  faded: [
    { problem: 'A triangle has angles 35° and 85°. Find the third angle.', steps: [{ given: 'Angles in a triangle add up to 180°' }, { prompt: '35 + 85 = ?', answer: { kind: 'number', value: 120 }, answerText: '120' }, { prompt: '180 − 120 = ?', answer: { kind: 'number', value: 60 }, answerText: '60°' }] },
    { problem: 'An isosceles triangle has base angles of 65°. Find the top angle.', steps: [{ prompt: 'The two base angles together: 65 + 65 = ?', answer: { kind: 'number', value: 130 }, answerText: '130' }, { prompt: '180 − 130 = ?', answer: { kind: 'number', value: 50 }, answerText: '50°' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const kind = level === 1 ? 0 : level === 2 ? rng.int(0, 1) : rng.int(1, 2);
    if (kind === 0) {
      const a = rng.int(25, 100), b = rng.int(20, 150 - a);
      const x = 180 - a - b;
      return { ...base, params: { a, b, kind }, text: `A triangle has angles of ${a}° and ${b}°. Find the third angle, x.`, answer: { kind: 'number', value: x }, answerText: `${x}°`, hint: 'Angles in a triangle add up to 180°.', steps: ['Angles in a triangle add up to 180°', `${a} + ${b} = ${a + b}`, `180 − ${a + b} = ${x}`, `So x = ${x}°`], picture: { type: 'angles', kind: 'triangle', values: [a, b, 'x'] }, traps: [{ value: 360 - a - b, misconception: 'wrong-total' }, { value: a + b, misconception: 'forgot-subtract' }].filter((t) => t.value !== x) };
    }
    if (kind === 1) {
      const top = rng.pick([20, 30, 40, 50, 60, 70, 80, 100, 110, 120]);
      const x = (180 - top) / 2;
      return { ...base, params: { a: top, b: 0, kind }, text: `An isosceles triangle has a top angle of ${top}°. Find the size of each base angle, x.`, answer: { kind: 'number', value: x }, answerText: `${x}°`, hint: 'The two base angles are equal and together with the top make 180°.', steps: ['Angles in a triangle add up to 180°', `180 − ${top} = ${180 - top} for the two base angles together`, `Base angles of an isosceles triangle are equal: ${180 - top} ÷ 2 = ${x}`, `So x = ${x}°`], picture: { type: 'angles', kind: 'triangle', values: ['x', 'x', top] }, traps: [{ value: 180 - top, misconception: 'not-halved', message: `${180 - top}° is both base angles together. Halve it.` }, { value: top, misconception: 'copied' }].filter((t) => t.value !== x) };
    }
    const b = rng.pick([35, 40, 45, 50, 55, 60, 65, 70, 75, 80]);
    const x = 180 - 2 * b;
    return { ...base, params: { a: b, b: 0, kind }, text: `An isosceles triangle has two base angles of ${b}°. Find the top angle, x.`, answer: { kind: 'number', value: x }, answerText: `${x}°`, hint: 'Add the two equal base angles, then subtract from 180°.', steps: ['Base angles of an isosceles triangle are equal', `${b} + ${b} = ${2 * b}`, 'Angles in a triangle add up to 180°', `180 − ${2 * b} = ${x}`, `So x = ${x}°`], picture: { type: 'angles', kind: 'triangle', values: [b, b, 'x'] }, traps: [{ value: 180 - b, misconception: 'one-base', message: 'There are TWO base angles. Subtract both.' }, { value: b, misconception: 'copied' }].filter((t) => t.value !== x) };
  },
  compute: ({ a, b, kind }) => (kind === 0 ? 180 - a - b : kind === 1 ? (180 - a) / 2 : 180 - 2 * a),
  mistakes: [
    { problem: 'A triangle has angles 70° and 60°. Find the third.', steps: ['70 + 60 = 130', '360 − 130 = 230°'], wrongStep: 1, reason: 'A triangle\'s angles add up to 180°, not 360°: 180 − 130 = 50°.', fixOptions: ['180 − 130 = 50°', '360 − 130 = 230°', '130°'], correctFix: 0 },
    { problem: 'An isosceles triangle has a top angle of 50°. Find a base angle.', steps: ['180 − 50 = 130', 'So each base angle is 130°'], wrongStep: 1, reason: '130° is both base angles together. Each is 130 ÷ 2 = 65°.', fixOptions: ['130 ÷ 2 = 65°', 'Each base angle is 130°', 'Each base angle is 50°'], correctFix: 0 },
    { problem: 'An isosceles triangle has base angles of 70°. Find the top angle.', steps: ['180 − 70 = 110', 'So the top angle is 110°'], wrongStep: 0, reason: 'There are two base angles: 180 − 70 − 70 = 40°.', fixOptions: ['180 − 70 − 70 = 40°', '180 − 70 = 110°', '70°'], correctFix: 0 },
  ],
  misconceptions: {
    'wrong-total': 'The angles of a triangle add up to 180°, not 360°.',
    'forgot-subtract': 'That is the total of the two known angles. Subtract it from 180°.',
    'not-halved': 'That is the two base angles together; each one is half of it.',
    'one-base': 'An isosceles triangle has two equal base angles: subtract both.',
    copied: 'The missing angle is not simply the same as the one given.',
  },
};
