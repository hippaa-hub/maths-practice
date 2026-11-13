import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { shuffleChoices } from '../util';

const ID = 'divisibility';

const RULES: Record<number, string> = {
  2: 'A number is divisible by 2 if its last digit is even (0, 2, 4, 6, 8).',
  3: 'A number is divisible by 3 if its digit sum is in the 3 times table.',
  4: 'A number is divisible by 4 if its last two digits make a number divisible by 4.',
  5: 'A number is divisible by 5 if it ends in 0 or 5.',
  8: 'A number is divisible by 8 if its last three digits make a number divisible by 8.',
  6: 'A number is divisible by 6 if it is divisible by both 2 and 3.',
  9: 'A number is divisible by 9 if its digit sum is in the 9 times table.',
  10: 'A number is divisible by 10 if it ends in 0.',
};
const digitSum = (n: number) => String(n).split('').reduce((s, d) => s + Number(d), 0);
const digits = (n: number) => String(n).split('').join(' + ');

function whySteps(n: number, d: number): string[] {
  const yes = n % d === 0;
  if (d === 3 || d === 9) return [`Add the digits: ${digits(n)} = ${digitSum(n)}`, `${digitSum(n)} ${yes ? 'is' : 'is not'} in the ${d} times table, so ${n} ${yes ? 'is' : 'is not'} divisible by ${d}`];
  if (d === 4) return [`Look at the last two digits: ${String(n).slice(-2)}`, `${Number(String(n).slice(-2))} ${yes ? 'is' : 'is not'} divisible by 4, so ${n} ${yes ? 'is' : 'is not'}`];
  if (d === 6) return [`Divisible by 2? Last digit ${n % 10} → ${n % 2 === 0 ? 'yes' : 'no'}`, `Divisible by 3? Digit sum ${digitSum(n)} → ${n % 3 === 0 ? 'yes' : 'no'}`, `${yes ? 'Both yes, so it is divisible by 6' : 'Not both, so it is not divisible by 6'}`];
  return [`Look at the last digit: ${n % 10}`, `So ${n} ${yes ? 'is' : 'is not'} divisible by ${d}`];
}

export const divisibility: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Divisibility tests',
  short: 'Divisibility',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'A divisibility test tells you whether a number divides exactly, without doing the division.',
      'By 2: the last digit is even. By 5: it ends in 0 or 5. By 10: it ends in 0.',
      'By 3: add the digits; if the total is in the 3 times table, so is the number. By 9: the same with the 9 times table.',
      'By 4: look at the last two digits. By 6: it must pass the tests for 2 and for 3.',
    ],
    rule: 'By 3 or 9: add the digits. By 2, 5, 10: look at the last digit. By 4: the last two digits.',
    picture: { type: 'table', headers: ['÷', 'test'], rows: [['2', 'last digit even'], ['3', 'digit sum ÷ 3'], ['4', 'last 2 digits'], ['5', 'ends 0 or 5'], ['9', 'digit sum ÷ 9']] },
  },
  examples: [
    {
      problem: 'Is 4,536 divisible by 9?',
      steps: ['Add the digits: 4 + 5 + 3 + 6 = 18', '18 is in the 9 times table, so 4536 is divisible by 9'],
      answer: 'Yes',
    },
    {
      problem: 'What digit goes in the box so that 52□ is divisible by 3?',
      steps: ['Add the known digits: 5 + 2 = 7', 'The total must be in the 3 times table: 9, 12 or 15', '7 + 2 = 9, so the digit can be 2 (or 5, or 8)', 'The smallest digit that works is 2'],
      answer: '2',
    },
  ],
  faded: [
    {
      problem: 'Is 2,814 divisible by 3?',
      steps: [
        { prompt: 'Add the digits: 2 + 8 + 1 + 4 = ?', answer: { kind: 'number', value: 15 }, answerText: '15' },
        { given: '15 is in the 3 times table, so yes, 2814 is divisible by 3' },
      ],
    },
    {
      problem: 'What is the smallest digit that makes 7□ divisible by 4?',
      steps: [
        { given: 'For 4, look at the last two digits: 7□ itself' },
        { prompt: 'The smallest two-digit number starting with 7 that is in the 4 times table is ?', answer: { kind: 'number', value: 72 }, answerText: '72', hint: '4 × 18 = 72.' },
        { given: 'So the digit is 2' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 1) {
      const d = rng.pick([3, 4, 5, 9, 6]);
      const good = rng.int(100, 999) - (rng.int(100, 999) % d);
      const n = good < 100 ? good + d : good;
      const bads: number[] = [];
      while (bads.length < 2) { const x = rng.int(100, 999); if (x % d !== 0 && !bads.includes(x) && x !== n) bads.push(x); }
      const { choices, correctIndex } = shuffleChoices(rng, String(n), bads.map(String));
      return {
        ...base,
        params: { n, d, kind: 0 },
        text: `Which of these numbers is divisible by ${d}: ${choices.join(', ')}?`,
        answer: { kind: 'choice', value: 0, choice: correctIndex },
        answerText: String(n),
        hint: RULES[d],
        steps: [RULES[d], ...whySteps(n, d)],
        choices,
        traps: [],
      };
    }
    if (level === 3 && rng.chance(0.5)) {
      // The divisibility table: which of 2-10 divide the number?
      const n = rng.pick([1260, 2520, 1080, 3600, 1890, 4320, 2160, 1440, 990, 2970, 6300, 1350]);
      const tests = [2, 3, 4, 5, 6, 8, 9, 10];
      const yes = tests.filter((t) => n % t === 0);
      const no = tests.filter((t) => n % t !== 0);
      const correct = yes.join(', ');
      const wrong1 = yes.filter((_, i) => i !== yes.length - 1).join(', ');
      const wrong2 = [...yes, no[0] ?? 7].sort((x, y) => x - y).join(', ');
      const { choices, correctIndex } = shuffleChoices(rng, correct, [wrong1, wrong2].filter((w) => w !== correct));
      return {
        ...base,
        params: { n, d: 0, kind: 0 },
        text: `Which list shows ALL the numbers from 2, 3, 4, 5, 6, 8, 9 and 10 that divide ${n} exactly?`,
        answer: { kind: 'choice', value: 0, choice: correctIndex },
        answerText: correct,
        hint: 'Test each one: last digit for 2, 5, 10; digit sum for 3 and 9; last two digits for 4; both 2 and 3 for 6; last three digits for 8.',
        steps: [`Last digit ${n % 10}: ${n % 2 === 0 ? 'even, so 2 yes' : 'odd, so 2 no'}; ${n % 10 === 0 || n % 10 === 5 ? '5 yes' : '5 no'}; ${n % 10 === 0 ? '10 yes' : '10 no'}`, `Digit sum ${digitSum(n)}: ${n % 3 === 0 ? '3 yes' : '3 no'}, ${n % 9 === 0 ? '9 yes' : '9 no'}`, `Last two digits ${String(n).slice(-2)}: ${n % 4 === 0 ? '4 yes' : '4 no'}; last three digits ${String(n).slice(-3)}: ${n % 8 === 0 ? '8 yes' : '8 no'}`, `6 needs both 2 and 3: ${n % 6 === 0 ? 'yes' : 'no'}`, `So the divisors are ${correct}`],
        choices,
        traps: [],
      };
    }
    // levels 2-3: smallest missing digit
    const d = level === 2 ? rng.pick([3, 9]) : rng.pick([4, 6, 9]);
    const place = 0;
    const front = level === 2 ? rng.int(10, 99) : rng.int(100, 999);
    const baseN = front * 10;
    let answer = -1;
    for (let x = 0; x <= 9; x++) if ((baseN + x) % d === 0) { answer = x; break; }
    if (answer === -1) return this.generate(level, rng);
    const steps = d === 3 || d === 9
      ? [`Add the known digits: ${digits(front)} = ${digitSum(front)}`, `The digit sum must be in the ${d} times table`, `${digitSum(front)} + ${answer} = ${digitSum(front) + answer}, which is in the ${d} times table`, `The smallest digit that works is ${answer}`]
      : d === 4
        ? [`For 4, look at the last two digits: ${String(front).slice(-1)}□`, `${String(front).slice(-1)}${answer} is in the 4 times table`, `The smallest digit that works is ${answer}`]
        : [`For 6 the number must be even AND have a digit sum in the 3 times table`, `Known digit sum: ${digits(front)} = ${digitSum(front)}`, `Try even digits from 0: ${answer} makes the sum ${digitSum(front) + answer}, which is in the 3 times table`, `The smallest digit that works is ${answer}`];
    return {
      ...base,
      params: { n: baseN, d, kind: 1, place },
      text: `What is the smallest digit you can put in the box so that ${front}□ is divisible by ${d}?`,
      answer: { kind: 'number', value: answer },
      answerText: String(answer),
      hint: RULES[d],
      steps,
      traps: [
        ...Array.from({ length: 10 }, (_, x) => x).filter((x) => x !== answer && (baseN + x) % d === 0).map((x) => ({ value: x, misconception: 'not-smallest', message: `${x} works too, but the question asks for the smallest digit.` })),
      ],
    };
  },
  compute: ({ n, d, kind }) => {
    if (kind === 0) return 0;
    for (let x = 0; x <= 9; x++) if ((n + x) % d === 0) return x;
    return -1;
  },
  mistakes: [
    {
      problem: 'Is 1,234 divisible by 4?',
      steps: ['The last digit is 4, which is in the 4 times table', 'So 1234 is divisible by 4'],
      wrongStep: 0,
      reason: 'For 4 you look at the last TWO digits: 34 is not in the 4 times table, so 1234 is not divisible by 4.',
      fixOptions: ['Look at the last two digits: 34 is not divisible by 4, so no', 'The last digit is 4, so yes', 'Add the digits: 10, so no'],
      correctFix: 0,
    },
    {
      problem: 'Is 5,271 divisible by 3?',
      steps: ['Add the digits: 5 + 2 + 7 + 1 = 15', '15 ends in 5, so it is not divisible by 3'],
      wrongStep: 1,
      reason: 'The test for 3 uses the digit sum: 15 IS in the 3 times table, so 5271 is divisible by 3.',
      fixOptions: ['15 is in the 3 times table, so yes', '15 ends in 5, so no', '5271 ends in 1, so no'],
      correctFix: 0,
    },
    {
      problem: 'Is 732 divisible by 6?',
      steps: ['Digit sum: 7 + 3 + 2 = 12, which is in the 3 times table', 'So 732 is divisible by 6'],
      wrongStep: 1,
      reason: 'For 6 you must also check 2. 732 is even, so this time the answer is yes, but the check for 2 must be done.',
      fixOptions: ['It is also even, so it is divisible by 6', 'So 732 is divisible by 6 (no need to check 2)', 'It is even, so it is not divisible by 6'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'not-smallest': 'More than one digit can work; the question asks for the smallest.',
    'last-digit': 'For 3 and 9 use the digit sum; for 4 use the last two digits.',
  },
};
