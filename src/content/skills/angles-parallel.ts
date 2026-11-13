import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';

const ID = 'angles-parallel';
type Rel = 'corresponding' | 'alternate' | 'cointerior';

export const anglesParallel: Skill = {
  id: ID,
  unit: 4,
  order: 0,
  title: 'Angles on parallel lines',
  short: 'Parallel lines',
  taught: true,
  prerequisites: ['angles-line-point'],
  variety: 15,
  explain: {
    sentences: [
      'When a line crosses two parallel lines, it makes matching angles.',
      'Corresponding angles (the same position at each crossing, an F shape) are equal. Alternate angles (a Z shape) are equal.',
      'Co-interior angles (inside the parallel lines on the same side, a C shape) add up to 180°, so they are supplementary.',
      'Name the pair you used as your reason: "corresponding angles are equal" or "co-interior angles add up to 180°".',
    ],
    rule: 'F (corresponding) and Z (alternate): equal. C (co-interior): add up to 180°.',
    picture: { type: 'parallel', labels: [{ at: 'top', q: 'UR', text: '65°' }, { at: 'bottom', q: 'UR', text: 'x' }] },
  },
  examples: [
    { problem: 'Two parallel lines are crossed by a line. One angle is 65° and x is the corresponding angle. Find x.', steps: ['Corresponding angles on parallel lines are equal', 'So x = 65°'], answer: '65°' },
    { problem: 'One angle is 110° and y is the co-interior angle. Find y.', steps: ['Co-interior angles on parallel lines add up to 180°', '180 − 110 = 70', 'So y = 70°'], answer: '70°' },
  ],
  faded: [
    { problem: 'One angle is 48° and x is the alternate angle. Find x.', steps: [{ given: 'Alternate angles on parallel lines are equal' }, { prompt: 'x = ?', answer: { kind: 'number', value: 48 }, answerText: '48°' }] },
    { problem: 'One angle is 125° and z is the co-interior angle. Find z.', steps: [{ given: 'Co-interior angles add up to 180°' }, { prompt: '180 − 125 = ?', answer: { kind: 'number', value: 55 }, answerText: '55°' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const rel: Rel = level === 1 ? rng.pick(['corresponding', 'alternate']) : level === 2 ? 'cointerior' : rng.pick(['corresponding', 'alternate', 'cointerior']);
    const a = rng.pick([35, 40, 45, 48, 52, 55, 60, 65, 70, 72, 75, 80, 100, 105, 110, 115, 120, 125, 130, 135]);
    const x = rel === 'cointerior' ? 180 - a : a;
    const labels = rel === 'corresponding'
      ? [{ at: 'top' as const, q: 'UR' as const, text: `${a}°` }, { at: 'bottom' as const, q: 'UR' as const, text: 'x' }]
      : rel === 'alternate'
        ? [{ at: 'top' as const, q: 'LL' as const, text: `${a}°` }, { at: 'bottom' as const, q: 'UR' as const, text: 'x' }]
        : [{ at: 'top' as const, q: 'LR' as const, text: `${a}°` }, { at: 'bottom' as const, q: 'UR' as const, text: 'x' }];
    const reason = rel === 'cointerior' ? 'Co-interior angles on parallel lines add up to 180°' : `${rel === 'corresponding' ? 'Corresponding' : 'Alternate'} angles on parallel lines are equal`;
    const shape = rel === 'corresponding' ? 'F' : rel === 'alternate' ? 'Z' : 'C';
    const extra = level === 3 && rel !== 'cointerior' ? ' Then give the reason.' : '';
    return {
      ...base,
      params: { a, rel: rel === 'cointerior' ? 1 : 0 },
      text: `A line crosses two parallel lines. The marked angle is ${a}° and x is the ${rel === 'cointerior' ? 'co-interior' : rel} angle (${shape} shape). Find x.${extra}`,
      answer: { kind: 'number', value: x }, answerText: `${x}°`,
      hint: `${shape} shape: ${rel === 'cointerior' ? 'the two angles add up to 180°' : 'the two angles are equal'}.`,
      steps: [reason, ...(rel === 'cointerior' ? [`180 − ${a} = ${x}`] : []), `So x = ${x}°`],
      picture: { type: 'parallel', labels },
      traps: [
        { value: rel === 'cointerior' ? a : 180 - a, misconception: 'wrong-pair', message: rel === 'cointerior' ? 'Co-interior angles are NOT equal; they add up to 180°.' : `${rel === 'corresponding' ? 'Corresponding' : 'Alternate'} angles are equal, not supplementary.` },
        { value: 360 - a, misconception: 'wrong-total' },
      ].filter((t) => t.value !== x),
    };
  },
  compute: ({ a, rel }) => (rel === 1 ? 180 - a : a),
  mistakes: [
    { problem: 'One angle is 70° and x is the corresponding angle. Find x.', steps: ['Corresponding angles add up to 180°', 'x = 180 − 70 = 110°'], wrongStep: 0, reason: 'Corresponding angles are EQUAL: x = 70°. It is co-interior angles that add up to 180°.', fixOptions: ['Corresponding angles are equal: x = 70°', 'Corresponding angles add up to 180°', 'Corresponding angles add up to 360°'], correctFix: 0 },
    { problem: 'One angle is 115° and y is the co-interior angle. Find y.', steps: ['Co-interior angles are equal', 'So y = 115°'], wrongStep: 0, reason: 'Co-interior angles (C shape) add up to 180°: y = 65°.', fixOptions: ['Co-interior angles add up to 180°: y = 65°', 'Co-interior angles are equal', 'Co-interior angles add up to 90°'], correctFix: 0 },
    { problem: 'One angle is 50° and z is the alternate angle. Find z.', steps: ['Alternate angles make a Z shape and are equal', 'z = 180 − 50 = 130°'], wrongStep: 1, reason: 'Equal means the same: z = 50°.', fixOptions: ['z = 50°', 'z = 180 − 50 = 130°', 'z = 360 − 50'], correctFix: 0 },
  ],
  misconceptions: {
    'wrong-pair': 'F and Z angles are equal; C angles add up to 180°.',
    'wrong-total': 'Angles on parallel lines are either equal or add up to 180°, never 360°.',
  },
};
