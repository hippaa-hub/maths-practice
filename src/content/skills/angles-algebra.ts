import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';

const ID = 'angles-algebra';
const term = (k: number, c: number) => `${k === 1 ? '' : k}x${c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${-c}`}`;

export const anglesAlgebra: Skill = {
  id: ID,
  unit: 4,
  order: 0,
  title: 'Angle problems with algebra',
  short: 'Angles with x',
  taught: true,
  prerequisites: ['angles-line-point', 'substitution-positive'],
  explain: {
    sentences: [
      'Sometimes the angles are written with a letter, like 2x and x + 30.',
      'Use the angle fact to write an equation: on a straight line, 2x + x + 30 = 180.',
      'Collect the x terms: 3x + 30 = 180. Then undo: subtract 30 (3x = 150), divide by 3 (x = 50).',
      'Check by putting x back in: 2 × 50 = 100 and 50 + 30 = 80, and 100 + 80 = 180. ✓',
    ],
    rule: 'Angle fact → equation → collect the x terms → undo to find x → check.',
    picture: { type: 'angles', kind: 'line', values: ['2x', 'x + 30'], degrees: [100, 80] },
  },
  examples: [
    { problem: 'Angles on a straight line are 2x and x + 30. Find x.', steps: ['Angles on a straight line add up to 180°, so 2x + x + 30 = 180', 'Collect: 3x + 30 = 180', 'Subtract 30: 3x = 150', 'Divide by 3: x = 50', 'Check: 100 + 80 = 180 ✓'], answer: 'x = 50' },
    { problem: 'Angles around a point are x, 2x and 3x. Find x.', steps: ['Angles around a point add up to 360°, so x + 2x + 3x = 360', 'Collect: 6x = 360', 'Divide by 6: x = 60'], answer: 'x = 60' },
  ],
  faded: [
    { problem: 'Angles on a straight line are 3x and x + 20. Find x.', steps: [{ given: '3x + x + 20 = 180, so 4x + 20 = 180' }, { prompt: 'Subtract 20: 4x = ?', answer: { kind: 'number', value: 160 }, answerText: '160' }, { prompt: 'Divide by 4: x = ?', answer: { kind: 'number', value: 40 }, answerText: '40' }] },
    { problem: 'The angles of a triangle are x, 2x and 3x. Find x.', steps: [{ prompt: 'x + 2x + 3x = ?x', answer: { kind: 'number', value: 6 }, answerText: '6' }, { given: 'Angles in a triangle add up to 180°, so 6x = 180' }, { prompt: 'x = ?', answer: { kind: 'number', value: 30 }, answerText: '30' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const shape = level === 1 ? 'line' : level === 2 ? 'point' : rng.pick(['line', 'point', 'triangle'] as const);
    const total = shape === 'line' ? 180 : shape === 'point' ? 360 : 180;
    // angles as k*x + c; pick x first so everything is clean
    const x = rng.pick(level === 1 ? [20, 25, 30, 35, 40, 45, 50] : [15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
    const n = shape === 'line' ? (level === 3 ? 3 : 2) : 3;
    const ks: number[] = [], cs: number[] = [];
    let kSum = 0, cSum = 0;
    for (let i = 0; i < n - 1; i++) { const k = rng.int(1, 3), c = level >= 2 ? rng.pick([0, 10, 20, 30, -10, -20]) : rng.pick([0, 10, 20, 30]); ks.push(k); cs.push(c); kSum += k; cSum += c; }
    // last term fixes the total: k*x + c = total - (kSum*x + cSum); choose k in 1..3 and compute c
    const kl = rng.int(1, 3);
    const cl = total - (kSum * x + cSum) - kl * x;
    if (cl < -40 || cl > 120 || cl % 5 !== 0) return this.generate(level, rng);
    ks.push(kl); cs.push(cl); kSum += kl; cSum += cl;
    const terms = ks.map((k, i) => term(k, cs[i]));
    const fact = shape === 'line' ? 'Angles on a straight line add up to 180°' : shape === 'point' ? 'Angles around a point add up to 360°' : 'Angles in a triangle add up to 180°';
    const where = shape === 'line' ? 'Angles on a straight line are' : shape === 'point' ? 'Angles around a point are' : 'The angles of a triangle are';
    const values = ks.map((k, i) => term(k, cs[i]));
    const degrees = ks.map((k, i) => k * x + cs[i]);
    const traps = [
      { value: (total - cSum), misconception: 'forgot-divide', message: `${total - cSum} is ${kSum}x. Divide by ${kSum}.` },
      { value: degrees[0], misconception: 'gave-angle', message: `${degrees[0]}° is the first angle. The question asks for x.` },
      { value: (total + cSum) / kSum, misconception: 'sign' },
    ].filter((t) => Number.isFinite(t.value) && Math.abs(t.value - x) > 1e-9);
    return {
      ...base,
      params: { total, kSum, cSum },
      text: `${where} ${terms.join(', ')} (in degrees). Find x.`,
      answer: { kind: 'number', value: x }, answerText: String(x),
      hint: `${fact}. Add the angles to make an equation, collect the x terms, then undo.`,
      steps: [`${fact}, so ${terms.join(' + ')} = ${total}`, `Collect the x terms: ${kSum}x${cSum === 0 ? '' : cSum > 0 ? ` + ${cSum}` : ` − ${-cSum}`} = ${total}`, ...(cSum !== 0 ? [`${cSum > 0 ? 'Subtract' : 'Add'} ${Math.abs(cSum)}: ${kSum}x = ${total - cSum}`] : []), `Divide by ${kSum}: x = ${x}`, `Check: ${degrees.join(' + ')} = ${total} ✓`],
      picture: shape === 'triangle' ? { type: 'angles', kind: 'triangle', values } : { type: 'angles', kind: shape, values, degrees },
      traps,
    };
  },
  compute: ({ total, kSum, cSum }) => (total - cSum) / kSum,
  mistakes: [
    { problem: 'Angles on a straight line are 2x and x + 60. Find x.', steps: ['2x + x + 60 = 180', '3x + 60 = 180', '3x = 240', 'x = 80'], wrongStep: 2, reason: 'To undo + 60, SUBTRACT 60: 3x = 120, so x = 40.', fixOptions: ['3x = 180 − 60 = 120, so x = 40', '3x = 240', '3x = 180'], correctFix: 0 },
    { problem: 'Angles around a point are x, 3x and 2x. Find x.', steps: ['x + 3x + 2x = 180', '6x = 180, so x = 30'], wrongStep: 0, reason: 'Around a point the total is 360°: 6x = 360, so x = 60.', fixOptions: ['x + 3x + 2x = 360, so x = 60', 'x + 3x + 2x = 180', 'x + 3x + 2x = 90'], correctFix: 0 },
    { problem: 'The angles of a triangle are x, x + 20 and x + 40. Find x.', steps: ['x + x + 20 + x + 40 = 180', '3x + 60 = 180', '3x = 120', 'x = 40, so the angles are 40°, 60° and 80°', 'Answer: 60'], wrongStep: 4, reason: 'The question asks for x, which is 40. (The check 40 + 60 + 80 = 180 is right.)', fixOptions: ['Answer: x = 40', 'Answer: 60', 'Answer: 80'], correctFix: 0 },
  ],
  misconceptions: {
    'forgot-divide': 'After collecting, divide by the number in front of x.',
    'gave-angle': 'The question asks for x, not for one of the angles.',
    sign: 'To undo a + you subtract; to undo a − you add.',
  },
};
