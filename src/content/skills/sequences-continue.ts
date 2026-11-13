import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { fmt } from '../util';

const ID = 'sequences-continue';
const neg = (n: number) => fmt(n).replace('-', '−');

export const sequencesContinue: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Continue a sequence',
  short: 'Sequences',
  prerequisites: [],
  explain: {
    sentences: [
      'A sequence is a list of numbers that follows a rule. Each number is called a term.',
      'Look at how you get from one term to the next. 4, 7, 10, 13 adds 3 each time, so the next term is 16.',
      'Some sequences multiply instead: 3, 6, 12, 24 doubles each time, so the next term is 48.',
      'Always check the rule works for every step before you use it.',
    ],
    rule: 'Find what happens between terms (add, subtract or multiply), check it, then do it again.',
    picture: { type: 'doubleLine', top: { label: 'term', values: [1, 2, 3, 4, 5] }, bottom: { label: 'value', values: [4, 7, 10, 13, 16] } },
  },
  examples: [
    { problem: 'Find the next term: 4, 7, 10, 13, …', steps: ['From 4 to 7 is + 3, from 7 to 10 is + 3, from 10 to 13 is + 3', 'The rule is add 3', 'Next term: 13 + 3 = 16'], answer: '16' },
    { problem: 'Find the next term: 3, 6, 12, 24, …', steps: ['From 3 to 6 is × 2, from 6 to 12 is × 2, from 12 to 24 is × 2', 'The rule is multiply by 2', 'Next term: 24 × 2 = 48'], answer: '48' },
  ],
  faded: [
    { problem: 'Find the next term: 20, 17, 14, 11, …', steps: [{ given: 'From 20 to 17 is − 3, and it is − 3 each time' }, { prompt: 'Next term: 11 − 3 = ?', answer: { kind: 'number', value: 8 }, answerText: '8' }] },
    { problem: 'Find the next term: 2, 6, 18, 54, …', steps: [{ prompt: 'From 2 to 6 is × ?', answer: { kind: 'number', value: 3 }, answerText: '3' }, { prompt: 'Next term: 54 × 3 = ?', answer: { kind: 'number', value: 162 }, answerText: '162' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const geometric = level >= 2 && rng.chance(level === 2 ? 0.3 : 0.4);
    const askIndex = level === 3 ? rng.pick([5, 6]) : 5;
    if (geometric) {
      const start = rng.pick([1, 2, 3, 4, 5]);
      const ratio = level === 2 ? 2 : rng.pick([2, 3]);
      const terms = Array.from({ length: askIndex - 1 }, (_, i) => start * Math.pow(ratio, i));
      const r = start * Math.pow(ratio, askIndex - 1);
      const last = terms[terms.length - 1];
      return {
        ...base, params: { start, step: ratio, geometric: 1, n: askIndex },
        text: `Find the ${askIndex === 5 ? 'next' : '6th'} term: ${terms.join(', ')}, …`,
        answer: { kind: 'number', value: r }, answerText: String(r),
        hint: 'Is each term being multiplied by the same number?',
        steps: [`${terms[0]} → ${terms[1]} is × ${ratio}; ${terms[1]} → ${terms[2]} is × ${ratio}`, `The rule is multiply by ${ratio}`, `${askIndex === 5 ? 'Next' : '6th'} term: ${last} × ${ratio} = ${r}`],
        traps: [
          { value: last + (terms[terms.length - 1] - terms[terms.length - 2]), misconception: 'added-last-difference', message: 'The differences keep changing, so this is not an add rule. Try multiplying.' },
          { value: last + ratio, misconception: 'added-ratio' },
        ].filter((t) => t.value !== r),
      };
    }
    const step = level === 1 ? rng.int(2, 9) : level === 2 ? rng.pick([-2, -3, -4, -5, 6, 7, 8, 11, 12]) : rng.pick([-6, -7, -8, -9, -11, 13, 15, -15]);
    const start = level === 1 ? rng.int(1, 20) : level === 2 ? rng.int(1, 40) : rng.int(-20, 30);
    const terms = Array.from({ length: askIndex - 1 }, (_, i) => start + step * i);
    const r = start + step * (askIndex - 1);
    const last = terms[terms.length - 1];
    const traps: Trap[] = [
      { value: last + step + (step > 0 ? 1 : -1), misconception: 'miscounted' },
      { value: last - step, misconception: 'wrong-direction' },
      { value: last * 2, misconception: 'doubled' },
    ].filter((t) => t.value !== r);
    return {
      ...base, params: { start, step, geometric: 0, n: askIndex },
      text: `Find the ${askIndex === 5 ? 'next' : '6th'} term: ${terms.map(neg).join(', ')}, …`,
      answer: { kind: 'number', value: r }, answerText: neg(r),
      hint: `What do you ${step > 0 ? 'add' : 'subtract'} to get from ${neg(terms[0])} to ${neg(terms[1])}?`,
      steps: [`${neg(terms[0])} → ${neg(terms[1])} is ${step > 0 ? '+' : '−'} ${Math.abs(step)}; it is the same each time`, `The rule is ${step > 0 ? 'add' : 'subtract'} ${Math.abs(step)}`, `${askIndex === 5 ? 'Next' : '6th'} term: ${neg(last)} ${step > 0 ? '+' : '−'} ${Math.abs(step)} = ${neg(r)}`],
      picture: { type: 'doubleLine', top: { label: 'term', values: Array.from({ length: askIndex }, (_, i) => i + 1) }, bottom: { label: 'value', values: [...terms, NaN].map((v) => (Number.isNaN(v) ? ('?' as unknown as number) : v)) } },
      traps,
    };
  },
  compute: ({ start, step, geometric, n }) => (geometric ? start * Math.pow(step, n - 1) : start + step * (n - 1)),
  mistakes: [
    { problem: 'Find the next term: 5, 9, 13, 17, …', steps: ['From 5 to 9 is + 4', 'Next term: 17 + 5 = 22'], wrongStep: 1, reason: 'The rule is add 4 every time, so 17 + 4 = 21.', fixOptions: ['Next term: 17 + 4 = 21', 'Next term: 17 + 5 = 22', 'Next term: 17 × 2 = 34'], correctFix: 0 },
    { problem: 'Find the next term: 2, 4, 8, 16, …', steps: ['From 2 to 4 is + 2', 'Next term: 16 + 2 = 18'], wrongStep: 0, reason: '+ 2 only works for the first step (4 to 8 is + 4). The rule is × 2, so the next term is 32.', fixOptions: ['Each term is × 2, so 16 × 2 = 32', 'From 2 to 4 is + 2, so 18', 'Add 8: 24'], correctFix: 0 },
    { problem: 'Find the next term: 30, 25, 20, 15, …', steps: ['The rule is subtract 5', 'Next term: 15 + 5 = 20'], wrongStep: 1, reason: 'Subtract 5, do not add: 15 − 5 = 10.', fixOptions: ['Next term: 15 − 5 = 10', 'Next term: 15 + 5 = 20', 'Next term: 15 ÷ 5 = 3'], correctFix: 0 },
  ],
  misconceptions: {
    miscounted: 'Check the difference between two terms again by subtracting.',
    'wrong-direction': 'The sequence is going the other way. Check whether it goes up or down.',
    doubled: 'This sequence adds the same number each time; it does not double.',
    'added-last-difference': 'When the differences change, look for a multiply rule.',
    'added-ratio': 'The rule is to multiply by that number, not add it.',
  },
};
