import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { fmt } from '../util';

const ID = 'formula-from-table';
const neg = (n: number) => fmt(n).replace('-', '−');

export function ruleText(a: number, b: number): string {
  const ax = a === 1 ? 'n' : a === -1 ? '−n' : `${neg(a)}n`;
  return b === 0 ? ax : b > 0 ? `${ax} + ${b}` : `${ax} − ${-b}`;
}

export const formulaFromTable: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Find the formula from a table',
  short: 'Find the rule',
  prerequisites: ['table-from-formula'],
  explain: {
    sentences: [
      'A table shows the position n and the value. To find the rule, look at how much the value goes up each time.',
      'If it goes up by 3 each time, the rule starts with 3n.',
      'Then check n = 1: 3 × 1 = 3. If the table says 5, the rule needs + 2. So the rule is 3n + 2.',
      'Always test the rule on another row of the table.',
    ],
    rule: 'The step between values goes in front of n. Then fix it with + or − so that n = 1 matches.',
    picture: { type: 'table', headers: ['n', '1', '2', '3', '4'], rows: [['value', '5', '8', '11', '14'], ['3n', '3', '6', '9', '12'], ['3n + 2', '5', '8', '11', '14']] },
  },
  examples: [
    { problem: 'n = 1, 2, 3, 4 gives 5, 8, 11, 14. Find the rule.', steps: ['The values go up by 3 each time, so the rule starts 3n', 'Check n = 1: 3 × 1 = 3, but the value is 5, so add 2', 'Rule: 3n + 2', 'Test n = 4: 3 × 4 + 2 = 14 ✓'], answer: '3n + 2' },
    { problem: 'n = 1, 2, 3, 4 gives 3, 7, 11, 15. Find the rule.', steps: ['The values go up by 4 each time, so the rule starts 4n', 'Check n = 1: 4 × 1 = 4, but the value is 3, so subtract 1', 'Rule: 4n − 1'], answer: '4n − 1' },
  ],
  faded: [
    { problem: 'n = 1, 2, 3, 4 gives 7, 9, 11, 13. Find the rule.', steps: [{ prompt: 'The values go up by ? each time', answer: { kind: 'number', value: 2 }, answerText: '2' }, { given: 'So the rule starts 2n. Check n = 1: 2 × 1 = 2, but the value is 7, so add 5' }, { prompt: 'Rule: ? (type it with n)', answer: { kind: 'expression', value: 25, expression: '2n + 5' }, answerText: '2n + 5' }] },
    { problem: 'n = 1, 2, 3, 4 gives 4, 9, 14, 19. Find the rule.', steps: [{ given: 'The values go up by 5 each time, so the rule starts 5n' }, { prompt: 'Check n = 1: 5 × 1 = 5, the value is 4, so the rule is 5n − ?', answer: { kind: 'number', value: 1 }, answerText: '1' }, { prompt: 'Rule: ? (type it with n)', answer: { kind: 'expression', value: 49, expression: '5n − 1' }, answerText: '5n − 1' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const a = level === 1 ? rng.int(2, 5) : level === 2 ? rng.int(2, 9) : rng.pick([-2, -3, -4, -5, 6, 7, 8, 10]);
    const b = level === 1 ? rng.int(0, 6) : level === 2 ? rng.int(-9, 9) : rng.int(-12, 30);
    const values = [1, 2, 3, 4].map((n) => a * n + b);
    const r = ruleText(a, b);
    return {
      ...base, params: { a, b },
      text: `A table gives these values for n = 1, 2, 3, 4: ${values.map(neg).join(', ')}. Write the rule for the value of the nth term.`,
      answer: { kind: 'expression', value: a * 10 + b, expression: `${a}n + ${b}` }, answerText: r,
      hint: `How much do the values change each time? That number goes in front of n.`,
      steps: [
        `The values ${a > 0 ? 'go up' : 'go down'} by ${Math.abs(a)} each time, so the rule starts ${neg(a)}n`,
        `Check n = 1: ${neg(a)} × 1 = ${neg(a)}, but the value is ${neg(values[0])}, so ${b === 0 ? 'nothing to add' : b > 0 ? `add ${b}` : `subtract ${-b}`}`,
        `Rule: ${r}`,
        `Test n = 4: ${neg(a)} × 4 ${b === 0 ? '' : b > 0 ? `+ ${b} ` : `− ${-b} `}= ${neg(values[3])} ✓`,
      ],
      picture: { type: 'table', headers: ['n', '1', '2', '3', '4'], rows: [['value', ...values.map(neg)]] },
      traps: [],
    };
  },
  compute: ({ a, b }) => a * 10 + b,
  mistakes: [
    { problem: 'n = 1, 2, 3, 4 gives 4, 7, 10, 13. Find the rule.', steps: ['The values go up by 3', 'The first value is 4, so the rule is n + 3'], wrongStep: 1, reason: 'Going up by 3 each time means 3n. Then 3 × 1 = 3 and the value is 4, so the rule is 3n + 1.', fixOptions: ['Rule: 3n + 1', 'Rule: n + 3', 'Rule: 4n'], correctFix: 0 },
    { problem: 'n = 1, 2, 3, 4 gives 6, 8, 10, 12. Find the rule.', steps: ['Goes up by 2, so 2n', 'Rule: 2n'], wrongStep: 1, reason: 'Check n = 1: 2 × 1 = 2, but the value is 6, so add 4: 2n + 4.', fixOptions: ['Check n = 1: 2 × 1 = 2, value is 6, so 2n + 4', 'Rule: 2n', 'Rule: 2n + 6'], correctFix: 0 },
    { problem: 'n = 1, 2, 3, 4 gives 20, 17, 14, 11. Find the rule.', steps: ['Goes down by 3, so 3n', '3 × 1 = 3, value is 20, so 3n + 17'], wrongStep: 0, reason: 'Going DOWN by 3 means −3n. Then −3 × 1 = −3, value 20, so −3n + 23 (or 23 − 3n).', fixOptions: ['Goes down by 3, so −3n: rule 23 − 3n', 'Goes down by 3, so 3n', 'Goes down, so n − 3'], correctFix: 0 },
  ],
  misconceptions: {
    'step-as-constant': 'The step between values goes IN FRONT of n, not added to it.',
    'forgot-adjust': 'After the n-part, check n = 1 and add or subtract to match the table.',
    'down-means-minus': 'Values going down mean a negative number in front of n.',
  },
};
