import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { clean, fmt, shuffleChoices } from '../util';

const ID = 'compare-ratios';
/** concentrate : water pairs whose concentrate share is a clean percent */
const MIXES: [number, number][] = [[1, 4], [1, 3], [1, 1], [2, 3], [3, 5], [1, 9], [3, 7], [1, 7], [2, 8], [3, 9], [4, 6], [1, 19], [3, 1], [2, 2]];
const share = ([c, w]: [number, number]) => clean((c / (c + w)) * 100);

export const compareRatios: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Comparing ratios and mixtures',
  short: 'Compare mixes',
  taught: true,
  prerequisites: ['ratio-share', 'pct-one-of-another'],
  explain: {
    sentences: [
      'Two juice mixes can be compared by asking what FRACTION of each is concentrate.',
      'Mix A is 1 part concentrate to 4 parts water: 1 out of 5 parts, 20%. Mix B is 1 to 3: 1 out of 4, 25%. So B is stronger.',
      'You cannot just compare the water numbers: the ratio matters, not the size of one part.',
      'Ratios can also describe angles: a triangle with angles in the ratio 1:2:3 has 6 parts, 180 ÷ 6 = 30, so 30°, 60° and 90°.',
    ],
    rule: 'To compare mixes, turn each ratio into a fraction or percent of the whole.',
    picture: { type: 'compare', rows: [{ label: 'A: 1 of 5 = 20%', value: 20, tone: 'orange' }, { label: 'B: 1 of 4 = 25%', value: 25, tone: 'green' }] },
  },
  examples: [
    { problem: 'Mix A is 1 part concentrate to 4 parts water. Mix B is 1 to 3. Which is stronger?', steps: ['A: 1 out of 1 + 4 = 5 parts, so 1 ÷ 5 = 0.2, which is 20%', 'B: 1 out of 1 + 3 = 4 parts, so 1 ÷ 4 = 0.25, which is 25%', '25% is more than 20%, so B is stronger'], answer: 'Mix B' },
    { problem: 'The angles of a triangle are in the ratio 1:2:3. What are they?', steps: ['Total parts: 1 + 2 + 3 = 6', 'One part: 180 ÷ 6 = 30', 'Angles: 30°, 60° and 90°'], answer: '30°, 60°, 90°' },
  ],
  faded: [
    { problem: 'Paint A is 2 parts red to 3 parts white. Paint B is 3 to 7. Which is redder?', steps: [{ prompt: 'A: 2 out of 5 parts = ? (as a percent)', answer: { kind: 'percent', value: 40 }, answerText: '40%' }, { prompt: 'B: 3 out of 10 parts = ? (as a percent)', answer: { kind: 'percent', value: 30 }, answerText: '30%' }, { given: '40% is more, so A is redder' }] },
    { problem: 'A triangle has angles in the ratio 2:3:4. Find the largest angle.', steps: [{ prompt: 'Total parts: 2 + 3 + 4 = ?', answer: { kind: 'number', value: 9 }, answerText: '9' }, { prompt: 'One part: 180 ÷ 9 = ?', answer: { kind: 'number', value: 20 }, answerText: '20' }, { prompt: 'Largest: 4 × 20 = ?', answer: { kind: 'number', value: 80 }, answerText: '80°' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.4)) {
      const ratio = rng.pick([[1, 2, 3], [2, 3, 4], [1, 1, 2], [1, 2, 2], [3, 4, 5], [1, 3, 5], [2, 2, 5], [1, 1, 4], [2, 3, 7]]);
      const parts = ratio[0] + ratio[1] + ratio[2];
      const one = 180 / parts;
      const big = ratio[2] * one;
      return { ...base, params: { a: ratio[2], b: parts, kind: 2 }, text: `The angles of a triangle are in the ratio ${ratio.join(':')}. What is the largest angle?`, answer: { kind: 'number', value: big }, answerText: `${fmt(big)}°`, hint: 'Angles in a triangle add up to 180°. First find ONE PART.', steps: [`Total parts: ${ratio.join(' + ')} = ${parts}`, `One part: 180 ÷ ${parts} = ${fmt(one)}`, `Largest angle: ${ratio[2]} × ${fmt(one)} = ${fmt(big)}`, `Check: ${ratio.map((r) => fmt(r * one)).join(' + ')} = 180 ✓`], traps: [{ value: ratio[2] * (360 / parts), misconception: 'wrong-total', message: 'A triangle\'s angles add up to 180°, not 360°.' }, { value: one, misconception: 'one-part' }].filter((t) => Math.abs(t.value - big) > 1e-9) };
    }
    let a: [number, number] = [1, 4], b: [number, number] = [1, 3];
    for (let tries = 0; tries < 100; tries++) {
      a = rng.pick(MIXES); b = rng.pick(MIXES);
      const diff = Math.abs(share(a) - share(b));
      if (level === 1 && diff >= 10) break;
      if (level === 2 && diff > 0 && diff < 15) break;
      if (level === 3 && (diff === 0 ? rng.chance(0.5) : diff < 10)) break;
    }
    const sa = share(a), sb = share(b);
    const stuff = rng.pick([{ thing: 'juice', part: 'concentrate', other: 'water', q: 'stronger' }, { thing: 'paint', part: 'red', other: 'white', q: 'redder' }, { thing: 'cordial', part: 'syrup', other: 'water', q: 'sweeter' }]);
    const correct = sa > sb ? `Mix A (${fmt(sa)}% ${stuff.part})` : sb > sa ? `Mix B (${fmt(sb)}% ${stuff.part})` : `They are the same strength (${fmt(sa)}% ${stuff.part})`;
    const wrong = [sa > sb ? `Mix B (${fmt(sb)}% ${stuff.part})` : `Mix A (${fmt(sa)}% ${stuff.part})`, sa === sb ? `Mix ${a[1] > b[1] ? 'A' : 'B'}, because it has more ${stuff.other}` : 'They are the same strength'];
    const { choices, correctIndex } = shuffleChoices(rng, correct, wrong);
    return {
      ...base, params: { a: a[0], b: a[1], kind: 0 },
      text: `Mix A is ${a[0]} part${a[0] > 1 ? 's' : ''} ${stuff.part} to ${a[1]} part${a[1] > 1 ? 's' : ''} ${stuff.other}. Mix B is ${b[0]} to ${b[1]}. Which ${stuff.thing} is ${stuff.q}?`,
      answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct,
      hint: `What fraction of each mix is ${stuff.part}? Compare the fractions (or percents), not the water.`,
      steps: [`A: ${a[0]} out of ${a[0]} + ${a[1]} = ${a[0] + a[1]} parts, so ${a[0]} ÷ ${a[0] + a[1]} = ${fmt(sa / 100)}, which is ${fmt(sa)}%`, `B: ${b[0]} out of ${b[0]} + ${b[1]} = ${b[0] + b[1]} parts, so ${b[0]} ÷ ${b[0] + b[1]} = ${fmt(sb / 100)}, which is ${fmt(sb)}%`, sa === sb ? 'The percents are equal, so the mixes are the same strength' : `${fmt(Math.max(sa, sb))}% is more, so Mix ${sa > sb ? 'A' : 'B'} is ${stuff.q}`],
      picture: { type: 'compare', rows: [{ label: `A: ${fmt(sa)}%`, value: sa, tone: sa >= sb ? 'green' : 'orange' }, { label: `B: ${fmt(sb)}%`, value: sb, tone: sb >= sa ? 'green' : 'orange' }] },
      choices, traps: [],
    };
  },
  compute: ({ a, b, kind }) => (kind === 2 ? (a * 180) / b : 0),
  mistakes: [
    { problem: 'Mix A is 1 concentrate to 4 water. Mix B is 2 to 6. Which is stronger?', steps: ['B has more concentrate (2 parts), so B is stronger'], wrongStep: 0, reason: 'Compare the fraction of the whole: A is 1/5 = 20%, B is 2/8 = 25%. B is stronger, but because of the fraction, not because 2 > 1.', fixOptions: ['A: 1/5 = 20%; B: 2/8 = 25%, so B is stronger', 'B has more concentrate, so B is stronger', 'A has less water, so A is stronger'], correctFix: 0 },
    { problem: 'Mix A is 1 to 3. Mix B is 2 to 6. Which is stronger?', steps: ['B uses more water, so B is weaker'], wrongStep: 0, reason: '2:6 simplifies to 1:3, the same ratio. Both are 25% concentrate: the same strength.', fixOptions: ['2:6 = 1:3, so they are the same strength', 'B uses more water, so B is weaker', 'B uses more concentrate, so B is stronger'], correctFix: 0 },
    { problem: 'Angles of a triangle are in the ratio 1:2:3. Find the largest.', steps: ['Total parts 6', 'One part: 360 ÷ 6 = 60', 'Largest: 3 × 60 = 180°'], wrongStep: 1, reason: 'A triangle\'s angles add up to 180°: one part is 30°, so the largest is 90°.', fixOptions: ['One part: 180 ÷ 6 = 30, largest 90°', 'One part: 360 ÷ 6 = 60', 'One part: 180 ÷ 3 = 60'], correctFix: 0 },
  ],
  misconceptions: {
    'bigger-number': 'Compare the fraction of the whole mix, not the size of one number.',
    'wrong-total': 'Angles in a triangle add up to 180°.',
    'one-part': 'That is one part. Multiply by the number of parts for the largest angle.',
  },
};
