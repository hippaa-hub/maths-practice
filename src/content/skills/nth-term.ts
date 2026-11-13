import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { shuffleChoices } from '../util';
import { ruleText } from './formula-from-table';

const ID = 'nth-term';

export const nthTerm: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Nth term and working backwards',
  short: 'Nth term',
  prerequisites: ['formula-from-table'],
  explain: {
    sentences: [
      'The nth term rule gives any term straight away: for 4n − 1, the 10th term is 4 × 10 − 1 = 39.',
      'Working backwards finds the position: which term is 39? Undo the rule in reverse order.',
      'Undo the − 1 by adding 1: 39 + 1 = 40. Undo the × 4 by dividing: 40 ÷ 4 = 10. So it is the 10th term.',
      'If dividing does not give a whole number, that number is not in the sequence.',
    ],
    rule: 'Forwards: put n in. Backwards: undo the steps in reverse order; a whole number means it is a term.',
    picture: { type: 'table', headers: ['n', '→ × 4', '→ − 1', 'term'], rows: [['10', '40', '39', '39'], ['?', '40', '39', '← undo']] },
  },
  examples: [
    { problem: 'The nth term is 4n − 1. What is the 10th term?', steps: ['Put n = 10 in: 4 × 10 − 1', '4 × 10 = 40', '40 − 1 = 39'], answer: '39' },
    { problem: 'The nth term is 4n − 1. Which term is 39?', steps: ['Undo the − 1: 39 + 1 = 40', 'Undo the × 4: 40 ÷ 4 = 10', 'So 39 is the 10th term.'], answer: '10th' },
  ],
  faded: [
    { problem: 'The nth term is 3n + 2. What is the 20th term?', steps: [{ prompt: '3 × 20 = ?', answer: { kind: 'number', value: 60 }, answerText: '60' }, { prompt: '60 + 2 = ?', answer: { kind: 'number', value: 62 }, answerText: '62' }] },
    { problem: 'The nth term is 5n + 3. Which term is 48?', steps: [{ prompt: 'Undo the + 3: 48 − 3 = ?', answer: { kind: 'number', value: 45 }, answerText: '45' }, { prompt: 'Undo the × 5: 45 ÷ 5 = ?', answer: { kind: 'number', value: 9 }, answerText: '9 (the 9th term)' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const a = rng.int(2, level === 1 ? 6 : 9);
    const b = level === 1 ? rng.int(1, 9) : rng.int(-9, 12);
    const f = ruleText(a, b);
    if (level === 3 && rng.chance(0.3)) {
      const target = a * rng.int(5, 20) + b + rng.int(1, a - 1);
      const correct = `No: ${target} − ${b < 0 ? `(${b})` : b} = ${target - b}, and ${target - b} ÷ ${a} is not a whole number`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, [`Yes: ${target} is bigger than the first term`, `Yes: ${target} ÷ ${a} leaves a remainder, so it is a term`]);
      return { ...base, params: { a, b, n: 0, kind: 2 }, text: `The nth term is ${f}. Is ${target} a term of the sequence?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'Work backwards: undo the constant, then divide. A whole number means yes.', steps: [`Undo the constant: ${target} − ${b < 0 ? `(${b})` : b} = ${target - b}`, `Undo the × ${a}: ${target - b} ÷ ${a} is not a whole number`, `So ${target} is not a term.`], choices, traps: [] };
    }
    const n = level === 1 ? rng.pick([5, 6, 8, 10, 12]) : rng.pick([10, 15, 20, 25, 50, 100, 7, 9, 11]);
    const term = a * n + b;
    if (level === 1 || rng.chance(0.4)) {
      const traps: Trap[] = [{ value: Number(`${a}${n}`) + b, misconception: 'digits' }, { value: a + n + b, misconception: 'added' }].filter((t) => t.value !== term);
      return { ...base, params: { a, b, n, kind: 0 }, text: `The nth term is ${f}. What is the ${n}th term?`, answer: { kind: 'number', value: term }, answerText: String(term), hint: `Put n = ${n} into the rule.`, steps: [`Put n = ${n} in: ${a} × ${n} ${b === 0 ? '' : b > 0 ? `+ ${b}` : `− ${-b}`}`, `${a} × ${n} = ${a * n}`, `${a * n} ${b === 0 ? '' : b > 0 ? `+ ${b} ` : `− ${-b} `}= ${term}`], traps };
    }
    const traps: Trap[] = [
      { value: term, misconception: 'gave-term' },
      { value: (term + b) / a, misconception: 'wrong-undo', message: `Undo the ${b > 0 ? '+' : '−'} ${Math.abs(b)} by doing the opposite: ${term} ${b > 0 ? '−' : '+'} ${Math.abs(b)}.` },
      { value: term / a - b, misconception: 'wrong-order', message: 'Undo in reverse order: the constant first, then the multiply.' },
    ].filter((t) => Number.isFinite(t.value) && t.value !== n);
    return { ...base, params: { a, b, n, kind: 1 }, text: `The nth term is ${f}. Which term is ${term}?`, answer: { kind: 'number', value: n }, answerText: `${n} (the ${n}th term)`, hint: `Undo the rule backwards: first undo the ${b === 0 ? 'constant (none here)' : b > 0 ? `+ ${b}` : `− ${-b}`}, then divide by ${a}.`, steps: [b === 0 ? `There is no constant to undo` : `Undo the ${b > 0 ? '+' : '−'} ${Math.abs(b)}: ${term} ${b > 0 ? '−' : '+'} ${Math.abs(b)} = ${term - b}`, `Undo the × ${a}: ${term - b} ÷ ${a} = ${n}`, `So ${term} is the ${n}th term.`], traps };
  },
  compute: ({ a, b, n, kind }) => (kind === 0 ? a * n + b : kind === 1 ? n : 0),
  mistakes: [
    { problem: 'The nth term is 6n + 1. What is the 5th term?', steps: ['6n with n = 5 is 65', '65 + 1 = 66'], wrongStep: 0, reason: '6n means 6 × n = 6 × 5 = 30, so the 5th term is 31.', fixOptions: ['6 × 5 = 30, so 30 + 1 = 31', '6n with n = 5 is 65', '6 + 5 + 1 = 12'], correctFix: 0 },
    { problem: 'The nth term is 3n + 4. Which term is 25?', steps: ['Undo the × 3 first: 25 ÷ 3 = 8.33', 'Then undo the + 4: 8.33 − 4 = 4.33'], wrongStep: 0, reason: 'Undo in REVERSE order: first the + 4 (25 − 4 = 21), then the × 3 (21 ÷ 3 = 7). It is the 7th term.', fixOptions: ['Undo + 4 first: 25 − 4 = 21, then 21 ÷ 3 = 7', 'Undo × 3 first: 25 ÷ 3', 'Add 4 then multiply: 29 × 3'], correctFix: 0 },
    { problem: 'The nth term is 5n − 2. Which term is 33?', steps: ['Undo the − 2: 33 − 2 = 31', '31 ÷ 5 = 6.2'], wrongStep: 0, reason: 'To undo − 2 you ADD 2: 33 + 2 = 35, then 35 ÷ 5 = 7. It is the 7th term.', fixOptions: ['Undo − 2 by adding: 33 + 2 = 35, then 35 ÷ 5 = 7', 'Undo − 2: 33 − 2 = 31', '33 ÷ 5 − 2'], correctFix: 0 },
  ],
  misconceptions: {
    digits: 'A number next to n means multiply.',
    added: '5n means 5 × n, not 5 + n.',
    'gave-term': 'The question asks for the position n, not the term value.',
    'wrong-undo': 'To undo adding, subtract; to undo subtracting, add.',
    'wrong-order': 'Undo the steps in reverse order: the constant first, then the multiplication.',
  },
};
