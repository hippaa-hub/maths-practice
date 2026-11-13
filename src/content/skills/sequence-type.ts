import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { fmt } from '../util';

const ID = 'sequence-type';
const CHOICES = ['Arithmetic', 'Geometric', 'Neither'];
const neg = (n: number) => fmt(n).replace('-', '−');

export const sequenceType: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Arithmetic, geometric or neither',
  short: 'Sequence type',
  prerequisites: ['sequences-continue'],
  explain: {
    sentences: [
      'An arithmetic sequence adds (or subtracts) the same number each time: 4, 7, 10, 13 adds 3.',
      'A geometric sequence multiplies by the same number each time: 3, 6, 12, 24 multiplies by 2.',
      'If neither the differences nor the ratios stay the same, it is neither. 1, 4, 9, 16 (the square numbers) is neither.',
      'Test both: subtract neighbours to check the differences, divide neighbours to check the ratios.',
    ],
    rule: 'Same difference → arithmetic. Same ratio → geometric. Otherwise → neither.',
    picture: { type: 'table', headers: ['sequence', 'differences', 'type'], rows: [['4, 7, 10, 13', '3, 3, 3', 'arithmetic'], ['3, 6, 12, 24', '3, 6, 12', 'geometric'], ['1, 4, 9, 16', '3, 5, 7', 'neither']] },
  },
  examples: [
    { problem: 'Is 3, 6, 12, 24 arithmetic, geometric or neither?', steps: ['Differences: 3, 6, 12 — not the same, so not arithmetic', 'Ratios: 6 ÷ 3 = 2; 12 ÷ 6 = 2; 24 ÷ 12 = 2 — the same', 'So it is geometric.'], answer: 'Geometric' },
    { problem: 'Is 1, 4, 9, 16 arithmetic, geometric or neither?', steps: ['Differences: 3, 5, 7 — not the same', 'Ratios: 4 ÷ 1 = 4; 9 ÷ 4 = 2.25 — not the same', 'So it is neither (these are the square numbers).'], answer: 'Neither' },
  ],
  faded: [
    { problem: 'Is 20, 17, 14, 11 arithmetic, geometric or neither?', steps: [{ prompt: 'Difference: 17 − 20 = ?', answer: { kind: 'number', value: -3 }, answerText: '−3' }, { given: 'It is −3 every time, so the sequence is arithmetic.' }] },
    { problem: 'Is 2, 6, 18, 54 arithmetic, geometric or neither?', steps: [{ given: 'Differences: 4, 12, 36 — not the same' }, { prompt: 'Ratio: 6 ÷ 2 = ?', answer: { kind: 'number', value: 3 }, answerText: '3' }, { given: '18 ÷ 6 = 3 and 54 ÷ 18 = 3 too, so it is geometric.' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const kind = level === 1 ? rng.int(0, 1) : rng.int(0, 2);
    let terms: number[];
    if (kind === 0) {
      const start = level === 3 ? rng.int(-10, 20) : rng.int(1, 20);
      const step = level === 1 ? rng.int(2, 9) : rng.pick([-5, -4, -3, -2, 2, 3, 6, 7]);
      terms = [0, 1, 2, 3].map((i) => start + step * i);
    } else if (kind === 1) {
      const start = rng.pick([1, 2, 3, 5]);
      const ratio = level === 1 ? 2 : rng.pick([2, 3, 4]);
      terms = [0, 1, 2, 3].map((i) => start * Math.pow(ratio, i));
    } else {
      terms = rng.pick([[1, 4, 9, 16], [1, 1, 2, 3], [2, 3, 5, 8], [1, 8, 27, 64], [1, 3, 6, 10], [2, 5, 10, 17], [1, 2, 4, 7], [5, 6, 8, 11]]);
    }
    const diffs = terms.slice(1).map((t, i) => t - terms[i]);
    const sameDiff = diffs.every((d) => d === diffs[0]);
    const ratios = terms.slice(1).map((t, i) => t / terms[i]);
    const sameRatio = ratios.every((r) => Math.abs(r - ratios[0]) < 1e-9);
    const correct = sameDiff ? 0 : sameRatio ? 1 : 2;
    const steps = [
      `Differences: ${diffs.map(neg).join(', ')} — ${sameDiff ? 'the same, so it is arithmetic' : 'not the same, so not arithmetic'}`,
      ...(sameDiff ? [] : [`Ratios: ${terms.slice(1).map((t, i) => (Number.isInteger(ratios[i] * 100) ? `${neg(t)} ÷ ${neg(terms[i])} = ${fmt(ratios[i])}` : `${neg(t)} ÷ ${neg(terms[i])} is about ${fmt(ratios[i])}`)).join('; ')} — ${sameRatio ? 'the same, so it is geometric' : 'not the same, so not geometric'}`]),
      `So it is ${CHOICES[correct].toLowerCase()}.`,
    ];
    return {
      ...base, params: { kind },
      text: `Is the sequence ${terms.map(neg).join(', ')}, … arithmetic, geometric or neither?`,
      answer: { kind: 'choice', value: 0, choice: correct }, answerText: CHOICES[correct],
      hint: 'Subtract neighbours to check the differences; divide neighbours to check the ratios.',
      steps, choices: CHOICES, traps: [],
    };
  },
  compute: () => 0,
  mistakes: [
    { problem: 'Is 2, 4, 8, 16 arithmetic, geometric or neither?', steps: ['From 2 to 4 is + 2', 'So it is arithmetic'], wrongStep: 1, reason: 'Check every step: 4 to 8 is + 4, so the differences change. The ratios are all 2, so it is geometric.', fixOptions: ['The differences change (2, 4, 8) but the ratios are all 2: geometric', 'So it is arithmetic', 'So it is neither'], correctFix: 0 },
    { problem: 'Is 10, 8, 6, 4 arithmetic, geometric or neither?', steps: ['The numbers go down, so it cannot be arithmetic', 'So it is neither'], wrongStep: 0, reason: 'Arithmetic sequences can go down: the difference is −2 every time, so it is arithmetic.', fixOptions: ['The difference is −2 every time: arithmetic', 'It goes down, so neither', 'It goes down, so geometric'], correctFix: 0 },
    { problem: 'Is 1, 4, 9, 16 arithmetic, geometric or neither?', steps: ['Differences: 3, 5, 7', 'The differences go up by 2 each time, so it is arithmetic'], wrongStep: 1, reason: 'Arithmetic needs the SAME difference every time. 3, 5, 7 are different, so it is neither.', fixOptions: ['The differences are not the same, so it is neither', 'The differences go up evenly, so arithmetic', 'The differences go up, so geometric'], correctFix: 0 },
  ],
  misconceptions: { 'one-step': 'Check every step, not just the first one.', 'down-is-fine': 'A sequence that goes down can still be arithmetic.' },
};
