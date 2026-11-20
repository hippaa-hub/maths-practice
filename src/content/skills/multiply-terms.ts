import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';

/**
 * Class topic "Operations with algebraic expressions" (ManageBac task for 27 Nov).
 * The teacher's own pages were not posted, so this practises the topic itself:
 * multiplying and dividing terms. Replace or adjust when her worksheet is known.
 */
const ID = 'multiply-terms';
const neg = (n: number) => String(n).replace('-', '−');
/** 1a is written a; −1a is written −a. */
const term = (k: number, letters: string) => `${k === 1 ? '' : k === -1 ? '−' : neg(k)}${letters}`;

export const multiplyTerms: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Multiplying and dividing terms',
  short: 'Multiply terms',
  prerequisites: ['like-terms'],
  explain: {
    sentences: [
      '4a means 4 × a. In algebra we leave out the × sign.',
      'To multiply terms, multiply the numbers, then write the letters next to each other: 2a × 3b = 6ab.',
      'Write the number first and the letters in alphabetical order: 6ab, not ba6.',
      'To divide a term by a number, divide the number in front: 12a ÷ 3 = 4a.',
    ],
    rule: 'Multiply: numbers × numbers, letters next to each other. Divide: divide the number in front.',
    picture: { type: 'table', headers: ['', 'numbers', 'letters', 'answer'], rows: [['2a × 3b', '2 × 3 = 6', 'a × b = ab', '6ab'], ['12a ÷ 3', '12 ÷ 3 = 4', 'a stays', '4a']] },
  },
  examples: [
    { problem: 'Simplify 3 × 4a.', steps: ['Numbers: 3 × 4 = 12', 'The letter a stays', 'So 3 × 4a = 12a'], answer: '12a' },
    { problem: 'Simplify 2a × 5b.', steps: ['Numbers: 2 × 5 = 10', 'Letters: a × b = ab', 'So 2a × 5b = 10ab'], answer: '10ab' },
  ],
  faded: [
    { problem: 'Simplify 6 × 3x.', steps: [{ prompt: 'Numbers: 6 × 3 = ?', answer: { kind: 'number', value: 18 }, answerText: '18' }, { given: 'The letter x stays' }, { prompt: 'Answer: ? (type it with x)', answer: { kind: 'expression', value: 0, expression: '18x', letters: ['x'] }, answerText: '18x' }] },
    { problem: 'Simplify 4p × 2q.', steps: [{ prompt: 'Numbers: 4 × 2 = ?', answer: { kind: 'number', value: 8 }, answerText: '8' }, { given: 'Letters: p × q = pq' }, { prompt: 'Answer: ? (type it with p and q)', answer: { kind: 'expression', value: 0, expression: '8pq', letters: ['p', 'q'] }, answerText: '8pq' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const [u, v] = rng.pick([['a', 'b'], ['x', 'y'], ['p', 'q'], ['m', 'n']]);
    const U = 2, V = 3; // values used to compare expressions

    if (level === 1) {
      const k = rng.int(2, 9), m = rng.int(2, 9);
      const text = rng.chance(0.5) ? `${k} × ${m}${u}` : `${m}${u} × ${k}`;
      const answer = `${k * m}${u}`;
      return {
        ...base, params: { value: k * m * U },
        text: `Simplify ${text}.`,
        answer: { kind: 'expression', value: k * m * U, expression: answer, letters: [u] },
        answerText: answer,
        hint: `Multiply the two numbers. The letter ${u} stays.`,
        steps: [`Numbers: ${k} × ${m} = ${k * m}`, `The letter ${u} stays`, `So ${text} = ${answer}`],
        traps: [],
      };
    }

    const divide = level === 3 && rng.chance(0.5);
    if (divide) {
      const d = rng.int(2, 9), q = rng.int(2, 9);
      const two = rng.chance(0.4);
      const letters = two ? `${u}${v}` : u;
      const text = `${d * q}${letters} ÷ ${d}`;
      const answer = `${q}${letters}`;
      const value = q * U * (two ? V : 1);
      return {
        ...base, params: { value },
        text: `Simplify ${text}.`,
        answer: { kind: 'expression', value, expression: answer, letters: two ? [u, v] : [u] },
        answerText: answer,
        hint: 'Divide the number in front. The letters stay.',
        steps: [`Numbers: ${d * q} ÷ ${d} = ${q}`, `The letters stay: ${letters}`, `So ${text} = ${answer}`],
        traps: [],
      };
    }

    const k = level === 3 ? rng.pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]) : rng.int(1, 6);
    const m = rng.int(k === 1 ? 2 : 1, 7);
    const text = `${term(k, u)} × ${term(m, v)}`;
    const answer = term(k * m, `${u}${v}`);
    const value = k * m * U * V;
    return {
      ...base, params: { value },
      text: `Simplify ${text}.`,
      answer: { kind: 'expression', value, expression: `${k * m}${u}${v}`, letters: [u, v] },
      answerText: answer,
      hint: 'Multiply the numbers first. Then write the two letters next to each other.',
      steps: [
        k < 0 ? `Numbers: (${neg(k)}) × ${m} = ${neg(k * m)}` : `Numbers: ${k} × ${m} = ${k * m}`,
        `Letters: ${u} × ${v} = ${u}${v}`,
        `So ${text} = ${answer}`,
      ],
      traps: [],
    };
  },
  compute: ({ value }) => value,
  mistakes: [
    { problem: 'Simplify 2a × 3b.', steps: ['Numbers: 2 + 3 = 5', 'Letters: a × b = ab', 'So 5ab'], wrongStep: 0, reason: 'When you multiply terms you multiply the numbers: 2 × 3 = 6. The answer is 6ab.', fixOptions: ['Numbers: 2 × 3 = 6', 'Numbers: 2 + 3 = 5', 'Numbers: 3 − 2 = 1'], correctFix: 0 },
    { problem: 'Simplify 4 × 5x.', steps: ['Numbers: 4 × 5 = 20', 'So the answer is 20'], wrongStep: 1, reason: 'The letter does not disappear: 4 × 5x = 20x.', fixOptions: ['So the answer is 20x', 'So the answer is 20', 'So the answer is 9x'], correctFix: 0 },
    { problem: 'Simplify 12a ÷ 3.', steps: ['Numbers: 12 − 3 = 9', 'So 9a'], wrongStep: 0, reason: '÷ means divide, not subtract: 12 ÷ 3 = 4, so the answer is 4a.', fixOptions: ['Numbers: 12 ÷ 3 = 4', 'Numbers: 12 − 3 = 9', 'Numbers: 12 × 3 = 36'], correctFix: 0 },
  ],
  misconceptions: { 'added-numbers': 'In a multiplication, multiply the numbers in front; do not add them.', 'lost-letter': 'The letters stay in the answer: 4 × 5x is 20x, not 20.' },
};
