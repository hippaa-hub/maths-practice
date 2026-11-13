import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { clean, decimals, fmt } from '../util';

const ID = 'pct-shaded';

export const pctShaded: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'What percentage is shaded?',
  short: 'Shaded %',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'Percent means "per hundred". On a 10 × 10 grid of 100 squares, each square is 1%, so 37 shaded squares is 37%.',
      'If a shape is split into equal parts, find the fraction shaded first, then change it to a percent.',
      '3 parts out of 8 shaded: 3 ÷ 8 = 0.375, and 0.375 × 100 = 37.5%.',
      'A percentage can be more than 100% if more than one whole is shaded.',
    ],
    rule: 'Shaded parts ÷ total parts × 100. On a 100-square grid, count the squares.',
    picture: { type: 'hundred', shaded: 37, label: '37 of 100 squares = 37%' },
  },
  examples: [
    { problem: 'A 10 × 10 grid has 37 shaded squares. What percentage is shaded?', steps: ['The grid has 100 squares, so each square is 1%', '37 squares shaded', 'So 37% is shaded'], answer: '37%' },
    { problem: 'A bar is split into 8 equal parts and 3 are shaded. What percentage is shaded?', steps: ['3 out of 8 parts: 3 ÷ 8 = 0.375', '0.375 × 100 = 37.5', 'So 37.5% is shaded'], answer: '37.5%' },
  ],
  faded: [
    { problem: 'A bar is split into 5 equal parts and 2 are shaded. What percentage is shaded?', steps: [{ given: '2 out of 5 parts' }, { prompt: '2 ÷ 5 = ?', answer: { kind: 'number', value: 0.4 }, answerText: '0.4' }, { prompt: '0.4 × 100 = ? (as a percent)', answer: { kind: 'percent', value: 40 }, answerText: '40%' }] },
    { problem: 'A 10 × 10 grid has 62 shaded squares. What percentage is NOT shaded?', steps: [{ prompt: 'Unshaded squares: 100 − 62 = ?', answer: { kind: 'number', value: 38 }, answerText: '38' }, { given: 'Each square is 1%, so 38% is not shaded' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 1) {
      const n = rng.int(3, 97);
      const unshaded = rng.chance(0.3);
      const r = unshaded ? 100 - n : n;
      return { ...base, params: { part: r, whole: 100 }, text: `A 10 × 10 grid has ${n} shaded squares. What percentage of the grid is ${unshaded ? 'NOT ' : ''}shaded?`, answer: { kind: 'percent', value: r }, answerText: `${r}%`, hint: 'The grid has 100 squares, so each square is 1%.', steps: ['The grid has 100 squares, so each square is 1%', ...(unshaded ? [`Unshaded squares: 100 − ${n} = ${r}`] : [`${n} squares shaded`]), `So ${r}% is ${unshaded ? 'not ' : ''}shaded`], picture: { type: 'hundred', shaded: n, label: `${n} shaded` }, traps: [{ value: unshaded ? n : 100 - n, misconception: 'wrong-part', message: unshaded ? 'The question asks for the part NOT shaded.' : 'The question asks for the shaded part.' }].filter((t) => t.value !== r) };
    }
    const parts = level === 2 ? rng.pick([2, 4, 5, 10, 20, 25, 50]) : rng.pick([8, 16, 40, 3, 6, 12]);
    let shaded = rng.int(1, parts - 1);
    let p = clean((shaded / parts) * 100);
    for (let tries = 0; tries < 30 && decimals(p) > 1; tries++) { shaded = rng.int(1, parts - 1); p = clean((shaded / parts) * 100); }
    if (decimals(p) > 1) { shaded = parts / 2; p = 50; }
    const dec = clean(shaded / parts);
    return { ...base, params: { part: shaded, whole: parts }, text: `A bar is split into ${parts} equal parts and ${shaded} of them are shaded. What percentage of the bar is shaded?`, answer: { kind: 'percent', value: p }, answerText: `${fmt(p)}%`, hint: `${shaded} out of ${parts}: divide, then × 100.`, steps: [`${shaded} out of ${parts} parts: ${shaded} ÷ ${parts} = ${fmt(dec)}`, `${fmt(dec)} × 100 = ${fmt(p)}`, `So ${fmt(p)}% is shaded`], picture: { type: 'bar', parts: Math.min(parts, 20), shaded: parts > 20 ? (shaded / parts) * 20 : shaded, totalLabel: `${parts} parts`, shadedLabel: `${shaded} shaded` }, traps: [{ value: shaded, misconception: 'count-as-percent', message: `${shaded} parts out of ${parts} is not ${shaded}%. Only on a 100-part grid is each part 1%.` }, { value: clean((parts / shaded) * 100), misconception: 'inverted' }, { value: parts - shaded, misconception: 'wrong-part' }].filter((t) => Number.isFinite(t.value) && Math.abs(t.value - p) > 1e-9) };
  },
  compute: ({ part, whole }) => clean((part / whole) * 100),
  mistakes: [
    { problem: 'A bar has 4 equal parts and 1 is shaded. What percentage is shaded?', steps: ['1 part is shaded', 'So 1% is shaded'], wrongStep: 1, reason: 'Each part is a quarter, 25%, not 1%. Only on a 100-part grid is each part 1%.', fixOptions: ['1 ÷ 4 × 100 = 25, so 25%', 'So 1% is shaded', 'So 4% is shaded'], correctFix: 0 },
    { problem: 'A 10 × 10 grid has 45 shaded squares. What percentage is NOT shaded?', steps: ['45 squares shaded', 'So 45% is not shaded'], wrongStep: 1, reason: 'Not shaded is the rest: 100 − 45 = 55%.', fixOptions: ['100 − 45 = 55% not shaded', 'So 45% is not shaded', 'So 10% is not shaded'], correctFix: 0 },
    { problem: 'A bar has 8 equal parts and 6 are shaded. What percentage is shaded?', steps: ['8 ÷ 6 = 1.33', '133% is shaded'], wrongStep: 0, reason: 'Shaded ÷ total: 6 ÷ 8 = 0.75, so 75%. A part of a whole cannot be more than 100%.', fixOptions: ['6 ÷ 8 = 0.75, so 75%', '8 ÷ 6 = 1.33, so 133%', '6 − 8'], correctFix: 0 },
  ],
  misconceptions: {
    'count-as-percent': 'The number of parts is only the percent when there are 100 parts.',
    inverted: 'Divide the shaded parts by the total parts, not the other way round.',
    'wrong-part': 'Check whether the question asks for the shaded or the unshaded part.',
  },
};
