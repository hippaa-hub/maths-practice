import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { shuffleChoices } from '../util';

const ID = 'percentage-points';
const TOPICS = ['pizza', 'khachapuri', 'football', 'swimming', 'maths', 'art', 'cycling', 'chess'];

export const percentagePoints: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Survey percentages and percentage points',
  short: 'Survey %',
  taught: true,
  prerequisites: ['pct-of-amount', 'pct-one-of-another'],
  explain: {
    sentences: [
      'In a survey, 60% chose pizza and 40% chose pasta. The gap is 60 − 40 = 20 percentage points.',
      'That is not "20% more": going from 40 to 60 is a 50% increase. Percentage points compare two percents; percent change compares with the start.',
      'To turn a survey percent into a number of people, use percent of an amount: 40% of 200 students is 80 students.',
      'If students could choose MORE THAN ONE answer, the percents can add up to more than 100%.',
    ],
    rule: 'Difference of two percents = percentage points. Percents over 100% in total mean people chose more than one answer.',
    picture: { type: 'compare', rows: [{ label: 'pizza 60%', value: 60, tone: 'green' }, { label: 'pasta 40%', value: 40, tone: 'blue' }] },
  },
  examples: [
    { problem: '60% of a class chose pizza and 40% chose pasta. How many percentage points more chose pizza?', steps: ['Subtract the percents: 60 − 40 = 20', 'So pizza is ahead by 20 percentage points'], answer: '20 percentage points' },
    { problem: 'In a survey of 200 students, 40% chose football. How many students is that?', steps: ['OF means multiply: 40% of 200', '10% of 200 = 20, so 40% of 200 = 4 × 20 = 80', 'So 80 students'], answer: '80 students' },
  ],
  faded: [
    { problem: '75% like art and 55% like music. What is the gap in percentage points?', steps: [{ prompt: '75 − 55 = ?', answer: { kind: 'number', value: 20 }, answerText: '20 percentage points' }] },
    { problem: 'Of 150 students, 30% walk to school. How many walk?', steps: [{ given: '10% of 150 = 15' }, { prompt: '30% of 150 = 3 × 15 = ?', answer: { kind: 'number', value: 45 }, answerText: '45 students' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const [t1, t2] = rng.shuffle(TOPICS).slice(0, 2);
    if (level === 1 || (level === 2 && rng.chance(0.5))) {
      const a = rng.pick([30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]), b = rng.pick([10, 15, 20, 25, 30, 35, 40, 45]);
      if (a <= b) return this.generate(level, rng);
      return { ...base, params: { a, b, kind: 0 }, text: `In a class survey, ${a}% chose ${t1} and ${b}% chose ${t2}. By how many percentage points is ${t1} ahead?`, answer: { kind: 'number', value: a - b }, answerText: `${a - b} percentage points`, hint: 'Percentage points: just subtract one percent from the other.', steps: [`Subtract the percents: ${a} − ${b} = ${a - b}`, `So ${t1} is ahead by ${a - b} percentage points`], picture: { type: 'compare', rows: [{ label: `${t1} ${a}%`, value: a, tone: 'green' }, { label: `${t2} ${b}%`, value: b, tone: 'blue' }] }, traps: [{ value: Math.round(((a - b) / b) * 100), misconception: 'percent-change', message: `That is the percent change from ${b} to ${a}. Percentage points are simply ${a} − ${b}.` }, { value: a + b, misconception: 'added' }].filter((t) => t.value !== a - b) };
    }
    if (level === 2) {
      const n = rng.pick([100, 120, 150, 200, 250, 300, 400]), p = rng.pick([10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75]);
      const r = (n * p) / 100;
      if (!Number.isInteger(r)) return this.generate(level, rng);
      return { ...base, params: { a: p, b: n, kind: 1 }, text: `${n} students answered a survey. ${p}% chose ${t1}. How many students chose ${t1}?`, answer: { kind: 'number', value: r }, answerText: `${r} students`, hint: 'OF means multiply: find 10% first, then build up.', steps: [`10% of ${n} = ${n / 10}`, `${p}% of ${n} = ${p / 10} × ${n / 10} = ${r}`, `So ${r} students`], traps: [{ value: p, misconception: 'percent-as-count', message: `${p}% is a share of ${n}, not ${p} students.` }, { value: n - r, misconception: 'rest' }].filter((t) => t.value !== r) };
    }
    const kind = rng.int(2, 3);
    if (kind === 2) {
      const a = rng.pick([55, 60, 65, 70]), b = rng.pick([45, 50, 55]), c = rng.pick([20, 25, 30, 35]);
      const total = a + b + c;
      const correct = 'Each student could choose more than one answer, so one student can be counted in two or three groups.';
      const { choices, correctIndex } = shuffleChoices(rng, correct, ['The teacher added the percents up wrongly; they must add to 100%.', 'Some students answered twice by mistake.']);
      return { ...base, params: { a, b, kind }, text: `In a survey, ${a}% chose ${t1}, ${b}% chose ${t2} and ${c}% chose ${TOPICS[7]}. The percents add up to ${total}%. Why can that be right?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'What if a student likes both pizza AND football?', steps: [`${a} + ${b} + ${c} = ${total}, which is more than 100`, 'A percent only has to add to 100% when each person is counted once', correct], choices, traps: [] };
    }
    const b = rng.pick([20, 25, 40, 50]), a = b + rng.pick([10, 20, 25]);
    const change = Math.round(((a - b) / b) * 100);
    const correct = `${a - b} percentage points, which is a ${change}% increase`;
    const { choices, correctIndex } = shuffleChoices(rng, correct, [`${a - b}%, because ${a} − ${b} = ${a - b}`, `${change} percentage points`]);
    return { ...base, params: { a, b, kind }, text: `Last year ${b}% of students cycled to school; this year ${a}% do. How should the change be described?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'The gap between two percents is in percentage points. The percent change compares the gap with the starting percent.', steps: [`Gap: ${a} − ${b} = ${a - b} percentage points`, `Percent change: ${a - b} ÷ ${b} × 100 = ${change}`, `So ${correct}`], choices, traps: [] };
  },
  compute: ({ a, b, kind }) => (kind === 0 ? a - b : kind === 1 ? (a * b) / 100 : 0),
  mistakes: [
    { problem: '50% chose tea and 25% chose coffee. By how many percentage points is tea ahead?', steps: ['50 ÷ 25 = 2', 'Tea is ahead by 100 percentage points'], wrongStep: 0, reason: 'Percentage points are the simple difference: 50 − 25 = 25 percentage points.', fixOptions: ['50 − 25 = 25 percentage points', '50 ÷ 25 = 2, so 100 percentage points', '50 + 25 = 75 percentage points'], correctFix: 0 },
    { problem: 'Of 300 students, 20% chose chess. How many is that?', steps: ['20% chose chess, so 20 students'], wrongStep: 0, reason: '20% is a share of 300: 20% of 300 = 60 students.', fixOptions: ['20% of 300 = 60 students', '20 students', '300 − 20 = 280 students'], correctFix: 0 },
    { problem: 'A survey\'s percents add up to 140%. What happened?', steps: ['Someone made a mistake, because percents always add up to 100%'], wrongStep: 0, reason: 'If students could pick more than one option, one student is counted several times, so the total can pass 100%.', fixOptions: ['Students could choose more than one answer', 'Someone made a mistake', 'The survey had 140 students'], correctFix: 0 },
  ],
  misconceptions: {
    'percent-change': 'The gap between two percents is in percentage points; percent change compares with the start.',
    added: 'The gap is a difference: subtract.',
    'percent-as-count': 'A percent is a share of the group, not a number of people.',
    rest: 'That is the number who did NOT choose it.',
  },
};
