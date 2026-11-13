import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { shuffleChoices } from '../util';
import { ruleText } from './formula-from-table';

const ID = 'coefficient-constant';

export const coefficientConstant: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Meaning of the coefficient and constant',
  short: 'Coefficient',
  prerequisites: ['formula-from-table'],
  explain: {
    sentences: [
      'In a rule like 3n + 2, the number in front of n is the coefficient and the number on its own is the constant.',
      'The coefficient (3) tells you how much the value changes each time n goes up by 1: the step.',
      'The constant (2) is what you get when n = 0: the starting point before any steps.',
      'So a taxi that charges 2 GEL to start and 3 GEL per km has the rule 3n + 2 for n kilometres.',
    ],
    rule: 'Coefficient = the step each time. Constant = the value at n = 0 (the start).',
    picture: { type: 'table', headers: ['n', '0', '1', '2', '3'], rows: [['3n + 2', '2', '5', '8', '11'], ['', 'start', '+3', '+3', '+3']] },
  },
  examples: [
    { problem: 'In the rule y = 3x + 2, what does the 3 tell you?', steps: ['3 is the coefficient, the number in front of x', 'Each time x goes up by 1, y goes up by 3', 'So 3 is the step each time.'], answer: 'The step: y goes up by 3 each time' },
    { problem: 'A phone plan costs 5 GEL plus 2 GEL per GB: cost = 2g + 5. What does the 5 mean?', steps: ['5 is the constant: the part that does not change with g', 'It is the cost when g = 0, before any data', 'So 5 GEL is the starting charge.'], answer: 'The starting charge, 5 GEL' },
  ],
  faded: [
    { problem: 'y = 4x + 1. How much does y go up when x goes up by 1?', steps: [{ given: 'The coefficient, 4, is the step each time' }, { prompt: 'y goes up by ?', answer: { kind: 'number', value: 4 }, answerText: '4' }] },
    { problem: 'y = 6x + 9. What is y when x = 0?', steps: [{ given: 'The constant is the value at x = 0' }, { prompt: 'y = 6 × 0 + 9 = ?', answer: { kind: 'number', value: 9 }, answerText: '9' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const a = rng.int(2, 9), b = level === 1 ? rng.int(1, 9) : rng.int(-9, 20);
    const f = ruleText(a, b).replace(/n/g, 'x');
    const askCoef = rng.chance(0.5);
    const ctx = level >= 2 && b > 0 ? rng.pick([
      { text: `A taxi in Tbilisi charges ${b} GEL to start plus ${a} GEL per km: cost = ${a}k + ${b}.`, coef: `${a} GEL is charged for each extra kilometre`, con: `${b} GEL is the starting charge, before any kilometres` },
      { text: `A plant is ${b} cm tall and grows ${a} cm each week: height = ${a}w + ${b}.`, coef: `The plant grows ${a} cm every week`, con: `${b} cm was the height at the start, in week 0` },
      { text: `Nino has ${b} GEL saved and adds ${a} GEL each week: savings = ${a}w + ${b}.`, coef: `${a} GEL is added every week`, con: `${b} GEL was there at the start, in week 0` },
    ]) : null;
    if (ctx) {
      const num = askCoef ? a : b;
      const correct = askCoef ? ctx.coef : ctx.con;
      const wrong = askCoef ? [ctx.con.replace(String(b), String(a)), `${a} is the number of weeks or kilometres`] : [ctx.coef.replace(String(a), String(b)), `${b} is the total after one week or kilometre`];
      const { choices, correctIndex } = shuffleChoices(rng, correct, wrong);
      return { ...base, params: { a, b }, text: `${ctx.text} What does the ${num} tell you?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: askCoef ? 'The number in front of the letter is the step each time.' : 'The number on its own is the value at the start (when the letter is 0).', steps: [askCoef ? `${num} is the coefficient, in front of the letter` : `${num} is the constant, on its own`, askCoef ? 'The coefficient is the step: how much is added each time' : 'The constant is the starting value, when the letter is 0', correct], choices, traps: [] };
    }
    const correct = askCoef ? `Each time x goes up by 1, y goes up by ${a}` : `y is ${b} when x is 0: the starting value`;
    const wrong = askCoef ? [`y is ${a} when x is 0`, `x goes up by ${a} each time`] : [`Each time x goes up by 1, y goes up by ${b}`, `The rule has ${b} terms`];
    const { choices, correctIndex } = shuffleChoices(rng, correct, wrong);
    return { ...base, params: { a, b }, text: `In the rule y = ${f}, what does the ${askCoef ? a : b} tell you?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: askCoef ? 'The number in front of x is the coefficient.' : 'The number on its own is the constant.', steps: [askCoef ? `${a} is the coefficient: the number in front of x` : `${b} is the constant: the number on its own`, askCoef ? 'The coefficient is the step each time x goes up by 1' : 'The constant is the value when x = 0', correct], choices, traps: [] };
  },
  compute: () => 0,
  mistakes: [
    { problem: 'In y = 5x + 3, what does the 5 tell you?', steps: ['5 is the number on its own, so it is the starting value'], wrongStep: 0, reason: '5 is in front of x, so it is the coefficient: y goes up by 5 each time x goes up by 1. The starting value is 3.', fixOptions: ['5 is the coefficient: the step each time', '5 is the starting value', '5 is the number of steps'], correctFix: 0 },
    { problem: 'A bike hire costs 4 GEL plus 2 GEL per hour: cost = 2h + 4. What does the 4 mean?', steps: ['4 is the cost per hour'], wrongStep: 0, reason: '4 is the constant: the charge before any hours. The cost per hour is 2.', fixOptions: ['4 GEL is the starting charge, for 0 hours', '4 is the cost per hour', '4 is the number of hours'], correctFix: 0 },
    { problem: 'In y = 7x − 2, what is y when x = 0?', steps: ['y = 7 − 2 = 5'], wrongStep: 0, reason: 'When x = 0, 7x is 0, so y = 0 − 2 = −2. The constant is the value at x = 0.', fixOptions: ['y = 7 × 0 − 2 = −2', 'y = 7 − 2 = 5', 'y = 7'], correctFix: 0 },
  ],
  misconceptions: { swapped: 'The number in front of the letter is the step; the number on its own is the start.', 'constant-is-step': 'The constant does not change anything each time; it is the value at the start.' },
};
