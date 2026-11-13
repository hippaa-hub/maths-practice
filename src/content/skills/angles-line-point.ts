import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';

const ID = 'angles-line-point';

export const anglesLinePoint: Skill = {
  id: ID,
  unit: 4,
  order: 0,
  title: 'Angles on a line and around a point',
  short: 'Line & point',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'Angles that sit together on a straight line add up to 180°.',
      'Angles that meet around a point add up to 360°.',
      'To find a missing angle, add up the ones you know and subtract from 180° or 360°.',
      'Always write the reason: "angles on a straight line" or "angles around a point". That is the Criterion C part.',
    ],
    rule: 'On a straight line: 180°. Around a point: 360°. Add what you know, subtract from the total.',
    picture: { type: 'angles', kind: 'line', values: [110, 'x'], degrees: [110, 70] },
  },
  examples: [
    { problem: 'Two angles on a straight line are 110° and x. Find x.', steps: ['Angles on a straight line add up to 180°', '180 − 110 = 70', 'So x = 70°'], answer: '70°' },
    { problem: 'Three angles around a point are 120°, 95° and y. Find y.', steps: ['Angles around a point add up to 360°', '120 + 95 = 215', '360 − 215 = 145', 'So y = 145°'], answer: '145°' },
  ],
  faded: [
    { problem: 'Angles on a straight line are 45°, 60° and x. Find x.', steps: [{ given: 'Angles on a straight line add up to 180°' }, { prompt: '45 + 60 = ?', answer: { kind: 'number', value: 105 }, answerText: '105' }, { prompt: '180 − 105 = ?', answer: { kind: 'number', value: 75 }, answerText: '75°' }] },
    { problem: 'Angles around a point are 150°, 80°, 70° and z. Find z.', steps: [{ given: 'Angles around a point add up to 360°' }, { prompt: '150 + 80 + 70 = ?', answer: { kind: 'number', value: 300 }, answerText: '300' }, { prompt: '360 − 300 = ?', answer: { kind: 'number', value: 60 }, answerText: '60°' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const onLine = level === 1 ? true : level === 2 ? false : rng.chance(0.5);
    const total = onLine ? 180 : 360;
    const count = level === 1 ? 2 : level === 2 ? 3 : onLine ? 3 : 4;
    const known: number[] = [];
    let left = total;
    for (let i = 0; i < count - 1; i++) {
      const maxv = left - (count - 1 - i) * 20 - 20;
      const v = rng.int(20, Math.max(20, Math.min(maxv, onLine ? 120 : 160)));
      known.push(v); left -= v;
    }
    const x = left;
    const pos = rng.int(0, count - 1);
    const values: (number | string)[] = [...known]; values.splice(pos, 0, 'x');
    const degrees = [...known]; degrees.splice(pos, 0, x);
    const sum = known.reduce((s, v) => s + v, 0);
    const reason = onLine ? 'Angles on a straight line add up to 180°' : 'Angles around a point add up to 360°';
    return {
      ...base,
      params: { total, sum },
      text: `${onLine ? 'The angles on a straight line are' : 'The angles around a point are'} ${known.map((v) => `${v}°`).join(', ')} and x. Find x.`,
      answer: { kind: 'number', value: x }, answerText: `${x}°`,
      hint: `${reason}. Add the ones you know, then subtract from ${total}.`,
      steps: [reason, ...(known.length > 1 ? [`${known.join(' + ')} = ${sum}`] : []), `${total} − ${sum} = ${x}`, `So x = ${x}°`],
      picture: { type: 'angles', kind: onLine ? 'line' : 'point', values, degrees },
      traps: [
        { value: (onLine ? 360 : 180) - sum, misconception: 'wrong-total', message: onLine ? 'A straight line is 180°, not 360°.' : 'All the way around a point is 360°, not 180°.' },
        { value: sum, misconception: 'forgot-subtract' },
        { value: total + sum, misconception: 'added' },
      ].filter((t) => t.value !== x && t.value > 0),
    };
  },
  compute: ({ total, sum }) => total - sum,
  mistakes: [
    { problem: 'Angles on a straight line are 130° and x. Find x.', steps: ['Angles on a straight line add up to 360°', '360 − 130 = 230, so x = 230°'], wrongStep: 0, reason: 'A straight line is 180°, so x = 180 − 130 = 50°.', fixOptions: ['Angles on a straight line add up to 180°: x = 50°', 'Angles on a straight line add up to 360°', 'x = 130°, the angles are equal'], correctFix: 0 },
    { problem: 'Angles around a point are 100°, 140° and y. Find y.', steps: ['100 + 140 = 240', 'y = 240°'], wrongStep: 1, reason: '240 is the total of the known angles. Subtract from 360: y = 120°.', fixOptions: ['y = 360 − 240 = 120°', 'y = 240°', 'y = 180 − 240'], correctFix: 0 },
    { problem: 'Angles on a straight line are 40°, 90° and z. Find z.', steps: ['40 + 90 = 130', '180 + 130 = 310, so z = 310°'], wrongStep: 1, reason: 'Subtract from 180, do not add: z = 180 − 130 = 50°.', fixOptions: ['180 − 130 = 50, so z = 50°', '180 + 130 = 310', 'z = 130°'], correctFix: 0 },
  ],
  misconceptions: {
    'wrong-total': 'A straight line is 180°; all the way around a point is 360°.',
    'forgot-subtract': 'That is the total of the known angles. Subtract it from 180° or 360°.',
    added: 'Subtract the known angles from the total; do not add.',
  },
};
