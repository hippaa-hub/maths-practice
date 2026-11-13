import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { NAMES, at, gcd } from '../util';

const ID = 'ratio-write-simplify';

const UNIT_PAIRS: Array<{ small: string; big: string; factor: number }> = [
  { small: 'cm', big: 'm', factor: 100 },
  { small: 'm', big: 'km', factor: 1000 },
  { small: 'mL', big: 'L', factor: 1000 },
  { small: 'minutes', big: 'hours', factor: 60 },
  { small: 'g', big: 'kg', factor: 1000 },
];

export const ratioWriteSimplify: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Write and simplify ratios',
  short: 'Ratios',
  taught: true,
  prerequisites: ['fractions-simplify'],
  explain: {
    sentences: [
      'A ratio compares amounts: 12 girls and 18 boys is the ratio 12:18 (girls to boys). The order matters.',
      'Simplify a ratio like a fraction: divide every part by the same number. 12:18 → divide by 6 → 2:3.',
      'If the parts have different units, change them to the SAME unit first: 50 cm : 2 m is 50:200, which is 1:4.',
    ],
    rule: 'Same units first, then divide every part by the same number until you cannot any more.',
    picture: { type: 'compare', rows: [{ label: 'girls 12 → 2', value: 12, tone: 'purple' }, { label: 'boys 18 → 3', value: 18, tone: 'blue' }] },
  },
  examples: [
    {
      problem: 'A class has 12 girls and 18 boys. Write the ratio of girls to boys in its simplest form.',
      steps: ['Girls to boys: 12:18', '6 goes into both 12 and 18', '12 ÷ 6 = 2; 18 ÷ 6 = 3', 'So the ratio is 2:3'],
      answer: '2:3',
    },
    {
      problem: 'Write 50 cm : 2 m as a ratio in its simplest form.',
      steps: ['Same units first: 2 m is 200 cm', 'So the ratio is 50:200', '50 ÷ 50 = 1; 200 ÷ 50 = 4', 'So 50 cm : 2 m = 1:4'],
      answer: '1:4',
    },
  ],
  faded: [
    {
      problem: 'Simplify the ratio 15:20.',
      steps: [
        { given: '5 goes into both 15 and 20' },
        { prompt: '15 ÷ 5 = ?', answer: { kind: 'number', value: 3 }, answerText: '3' },
        { prompt: '20 ÷ 5 = ?', answer: { kind: 'number', value: 4 }, answerText: '4' },
        { prompt: 'So 15:20 = ? (as a ratio)', answer: { kind: 'ratio', value: 0.75, ratio: [3, 4] }, answerText: '3:4' },
      ],
    },
    {
      problem: 'Write 300 g : 1 kg as a ratio in its simplest form.',
      steps: [
        { prompt: 'Same units first: 1 kg is ? g', answer: { kind: 'number', value: 1000 }, answerText: '1000' },
        { given: 'So the ratio is 300:1000' },
        { prompt: 'Divide both by 100: ? (as a ratio)', answer: { kind: 'ratio', value: 0.3, ratio: [3, 10] }, answerText: '3:10' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.6)) {
      const u = rng.pick(UNIT_PAIRS);
      const bigN = rng.pick([1, 2, 3, 4, 5]);
      const smallN = rng.pick([50, 100, 150, 200, 250, 300, 400, 500, 600, 750, 800].filter((x) => x < bigN * u.factor));
      const a = smallN, b = bigN * u.factor;
      const g = gcd(a, b);
      const [sa, sb] = [a / g, b / g];
      return {
        ...base,
        params: { a, b },
        text: `Write ${smallN} ${u.small} : ${bigN} ${u.big} as a ratio in its simplest form.`,
        answer: { kind: 'ratio', value: sa / sb, ratio: [sa, sb] },
        answerText: `${sa}:${sb}`,
        hint: `Same units first: change ${bigN} ${u.big} into ${u.small}.`,
        steps: [`Same units first: ${bigN} ${u.big} is ${bigN} × ${u.factor} = ${b} ${u.small}`, `So the ratio is ${a}:${b}`, `${g} goes into both: ${a} ÷ ${g} = ${sa}; ${b} ÷ ${g} = ${sb}`, `So the ratio is ${sa}:${sb}`],
        traps: [
          { value: 0, ratio: [smallN, bigN].map((x, _, arr) => x / gcd(arr[0], arr[1])), misconception: 'units', message: `${u.small} and ${u.big} are different units. Change to ${u.small} first.` },
          { value: 0, ratio: [sb, sa], misconception: 'reversed' },
          { value: 0, ratio: [sa, sb], misconception: 'not-simplified' },
        ].filter((t) => JSON.stringify(t.ratio) !== JSON.stringify([sa, sb]) || t.misconception === 'not-simplified') as Trap[],
      };
    }
    const ks = level === 1 ? [2, 3, 4, 5] : level === 2 ? [3, 4, 5, 6, 7, 8] : [6, 7, 8, 9, 12];
    const k = rng.pick(ks);
    let sa = rng.int(1, 6), sb = rng.int(1, 6);
    while (gcd(sa, sb) !== 1 || sa === sb) { sa = rng.int(1, 6); sb = rng.int(1, 6); }
    const a = sa * k, b = sb * k;
    const three = level === 2 && rng.chance(0.3);
    if (three) {
      let sc = rng.int(1, 6);
      while (gcd(gcd(sa, sb), sc) !== 1) sc = rng.int(1, 6);
      const c = sc * k;
      return {
        ...base,
        params: { a, b, c },
        text: `Simplify the ratio ${a}:${b}:${c}.`,
        answer: { kind: 'ratio', value: sa / sb, ratio: [sa, sb, sc] },
        answerText: `${sa}:${sb}:${sc}`,
        hint: `What is the biggest number that goes into ${a}, ${b} and ${c}?`,
        steps: [`${k} goes into all three`, `${a} ÷ ${k} = ${sa}; ${b} ÷ ${k} = ${sb}; ${c} ÷ ${k} = ${sc}`, `So the ratio is ${sa}:${sb}:${sc}`],
        traps: [{ value: 0, ratio: [sa, sb, sc], misconception: 'not-simplified' }],
      };
    }
    const who = at(NAMES, a);
    const text = rng.pick([
      `A class has ${a} girls and ${b} boys. Write the ratio of girls to boys in its simplest form.`,
      `${who} has ${a} red pencils and ${b} blue pencils. Write the ratio red:blue in its simplest form.`,
      `Simplify the ratio ${a}:${b}.`,
      `A football team won ${a} matches and lost ${b}. Write the ratio of wins to losses in its simplest form.`,
    ]);
    return {
      ...base,
      params: { a, b },
      text,
      answer: { kind: 'ratio', value: sa / sb, ratio: [sa, sb] },
      answerText: `${sa}:${sb}`,
      hint: `What is the biggest number that goes into both ${a} and ${b}?`,
      steps: [`The ratio is ${a}:${b}`, `${k} goes into both ${a} and ${b}`, `${a} ÷ ${k} = ${sa}; ${b} ÷ ${k} = ${sb}`, `So the ratio is ${sa}:${sb}`],
      picture: { type: 'compare', rows: [{ label: `${a} → ${sa}`, value: a, tone: 'purple' }, { label: `${b} → ${sb}`, value: b, tone: 'blue' }] },
      traps: [
        { value: 0, ratio: [sb, sa], misconception: 'reversed', message: 'The order matters: the first amount in the question comes first in the ratio.' },
        { value: 0, ratio: [sa, sb], misconception: 'not-simplified' },
      ],
    };
  },
  compute: ({ a, b }) => (a / gcd(a, b)) / (b / gcd(a, b)),
  mistakes: [
    {
      problem: 'Simplify the ratio 8:12.',
      steps: ['2 goes into both: 8 ÷ 2 = 4; 12 ÷ 2 = 6', 'So the simplest form is 4:6'],
      wrongStep: 1,
      reason: '4:6 can still be simplified: 2 goes into both again, giving 2:3.',
      fixOptions: ['Keep going: 4:6 = 2:3', 'So the simplest form is 4:6', '4:6 = 1:2'],
      correctFix: 0,
    },
    {
      problem: 'Write 20 cm : 1 m as a ratio in its simplest form.',
      steps: ['The ratio is 20:1', 'It is already simplest: 20:1'],
      wrongStep: 0,
      reason: 'The units are different. 1 m is 100 cm, so the ratio is 20:100 = 1:5.',
      fixOptions: ['1 m is 100 cm, so 20:100 = 1:5', 'The ratio is 20:1', 'The ratio is 1:20'],
      correctFix: 0,
    },
    {
      problem: 'There are 10 cats and 15 dogs. Write the ratio of dogs to cats in its simplest form.',
      steps: ['10:15', '5 goes into both: 2:3'],
      wrongStep: 0,
      reason: 'The question asks dogs to cats, so dogs come first: 15:10 = 3:2.',
      fixOptions: ['Dogs first: 15:10', '10:15', '15:15'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    reversed: 'The order of a ratio matters. Put the amounts in the order the question says.',
    'not-simplified': 'That ratio is right but can be simplified further.',
    units: 'Change both amounts to the same unit before writing the ratio.',
  },
};
