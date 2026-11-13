import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { NAMES, at, clean, decimals, fmt, shuffleChoices } from '../util';

const ID = 'pct-one-of-another';

const L1 = { whole: [10, 20, 25, 50, 100], p: [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95] };
const L2 = { whole: [40, 80, 60, 30, 200, 250, 400, 500, 1000], p: [2, 4, 5, 6, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 45, 55, 60, 65, 70, 75, 85, 90] };
const L3 = { whole: [8, 16, 40, 80, 160, 200, 250, 400, 500], p: [12.5, 37.5, 62.5, 87.5, 2.5, 7.5, 1, 3, 7, 9, 11, 13, 17, 110, 120, 150, 175] };

interface Ctx { text: (part: number, whole: number) => string; over100?: boolean }
const CONTEXTS: Ctx[] = [
  { text: (part, whole) => `${NAMES[whole % NAMES.length]} scored ${part} out of ${whole} in a maths quiz. What percent is that?` },
  { text: (part, whole) => `${part} of the ${whole} students in Grade 7 have a pet. What percent have a pet?` },
  { text: (part, whole) => `A football team played ${whole} matches and won ${part}. What percent did they win?` },
  { text: (part, whole) => `${NAMES[part % NAMES.length]} has read ${part} pages of a ${whole}-page book. What percent of the book is that?` },
  { text: (part, whole) => `What is ${part} as a percent of ${whole}?`, over100: true },
  { text: (part, whole) => `A sunflower was ${whole} cm tall last month and is ${part} cm tall now. What percent of last month's height is it now?`, over100: true },
];

function picture(part: number, whole: number): Picture {
  const parts = whole <= 20 ? whole : 10;
  return { type: 'bar', parts, shaded: (part / whole) * parts, totalLabel: `${whole} (100%)`, shadedLabel: `${part}` };
}

function steps(part: number, whole: number, p: number): string[] {
  if (100 % whole === 0 && whole <= 50) {
    const k = 100 / whole;
    return [
      `Make the whole into 100: ${whole} × ${k} = 100`,
      `Do the same to the part: ${part} × ${k} = ${fmt(p)}`,
      `So ${part} out of ${whole} = ${fmt(p)}/100 = ${fmt(p)}%`,
    ];
  }
  const dec = clean(part / whole);
  return [
    'Divide the part by the whole',
    `${part} ÷ ${whole} = ${fmt(dec)}`,
    `${fmt(dec)} × 100 = ${fmt(p)}`,
    `So ${part} out of ${whole} is ${fmt(p)}%.`,
  ];
}

export const pctOneOfAnother: Skill = {
  id: ID,
  unit: 1,
  order: 3,
  title: 'One amount as a percent of another',
  short: 'A as % of B',
  taught: true,
  prerequisites: ['pct-of-amount'],
  explain: {
    sentences: [
      'Sometimes you know the part and the whole, and you want the percent.',
      'Write the part over the whole as a fraction, then turn it into a percent.',
      'If the whole goes into 100 easily, scale it up: 18 out of 20 is 90 out of 100, so 90%.',
      'Otherwise divide: part ÷ whole, then multiply by 100.',
    ],
    rule: 'Percent = part ÷ whole × 100.',
    picture: { type: 'bar', parts: 20, shaded: 18, totalLabel: '20 (100%)', shadedLabel: '18 = 90%' },
  },
  examples: [
    {
      problem: 'Adele scored 18 out of 20. What percent is that?',
      steps: ['Make the whole into 100: 20 × 5 = 100', 'Do the same to the part: 18 × 5 = 90', 'So 18 out of 20 = 90/100 = 90%'],
      answer: '90%',
    },
    {
      problem: '12 of the 40 students in a club are in Grade 7. What percent is that?',
      steps: ['Divide the part by the whole', '12 ÷ 40 = 0.3', '0.3 × 100 = 30', 'So 12 out of 40 is 30%.'],
      answer: '30%',
    },
  ],
  faded: [
    {
      problem: 'Nino got 7 out of 10 in a spelling test. What percent is that?',
      steps: [
        { given: 'Make the whole into 100: 10 × 10 = 100' },
        { prompt: 'Do the same to the part: 7 × 10 = ?', answer: { kind: 'number', value: 70 }, answerText: '70' },
        { prompt: 'So 7 out of 10 = ?%', answer: { kind: 'percent', value: 70 }, answerText: '70%' },
      ],
    },
    {
      problem: 'A team won 6 of its 8 matches. What percent did it win?',
      steps: [
        { prompt: '6 ÷ 8 = ?', answer: { kind: 'number', value: 0.75 }, answerText: '0.75', hint: '6 ÷ 8 is the same as 3 ÷ 4.' },
        { prompt: '0.75 × 100 = ?', answer: { kind: 'percent', value: 75 }, answerText: '75%' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    if (level === 3 && rng.chance(0.4)) return mixedUnits(rng);
    if (level >= 2 && rng.chance(0.25)) return compareScores(rng, level);
    const pool = level === 1 ? L1 : level === 2 ? L2 : L3;
    const pairs: [number, number, number][] = [];
    for (const whole of pool.whole) for (const p of pool.p) {
      const part = (whole * p) / 100;
      if (Number.isInteger(part) && part > 0 && decimals(p) <= 1) pairs.push([part, whole, p]);
    }
    const [part, whole, p] = rng.pick(pairs);
    const ctx = rng.pick(CONTEXTS.filter((c) => (p > 100 ? c.over100 : !c.over100 || c.text === CONTEXTS[4].text)));
    const traps: Trap[] = [
      { value: clean((whole / part) * 100), misconception: 'inverted', message: `Divide the part by the whole: ${part} ÷ ${whole}, not the other way round.` },
      { value: clean(part / whole), misconception: 'no-100' },
      { value: whole - part, misconception: 'subtract' },
      { value: part, misconception: 'part-as-percent', message: `${part} is the part, not the percent. Out of ${whole} is not out of 100.` },
    ].filter((t) => Math.abs(t.value - p) > 1e-9 && Number.isFinite(t.value));
    return {
      skillId: ID,
      level,
      params: { part, whole },
      text: ctx.text(part, whole),
      answer: { kind: 'percent', value: p },
      answerText: `${fmt(p)}%`,
      hint: 100 % whole === 0 && whole <= 50 ? `Make the whole into 100: ${whole} × ${100 / whole} = 100. Then multiply the part by ${100 / whole} as well; that gives the percent.` : `Divide ${part} by ${whole}, then × 100.`,
      steps: steps(part, whole, p),
      picture: picture(Math.min(part, whole), whole),
      traps,
    };
  },
  compute: ({ part, whole, choice }) => (choice ? 0 : clean((part / whole) * 100)),
  variety: 15,
  mistakes: [
    {
      problem: 'Giorgi scored 15 out of 25. What percent is that?',
      steps: ['Divide: 25 ÷ 15 = 1.67', '1.67 × 100 = 167', 'So 167%'],
      wrongStep: 0,
      reason: 'The part goes on top: 15 ÷ 25, not 25 ÷ 15. A score out of 25 can never be more than 100%.',
      fixOptions: ['Divide: 15 ÷ 25 = 0.6', 'Divide: 25 ÷ 15 = 0.6', 'Subtract: 25 − 15 = 10'],
      correctFix: 0,
    },
    {
      problem: '9 of the 20 students in a class walk to school. What percent walk?',
      steps: ['9 ÷ 20 = 0.45', 'So 0.45% walk to school'],
      wrongStep: 1,
      reason: '0.45 is the decimal. Multiply by 100 to get the percent: 45%.',
      fixOptions: ['0.45 × 100 = 45, so 45%', 'So 0.45% is right', '0.45 × 10 = 4.5, so 4.5%'],
      correctFix: 0,
    },
    {
      problem: 'Mariam got 40 out of 50 in a test. What percent is that?',
      steps: ['Make the whole into 100: 50 × 2 = 100', 'Do the same to the part: 40 + 2 = 42', 'So 42%'],
      wrongStep: 1,
      reason: 'The whole was multiplied by 2, so the part must be multiplied by 2 as well: 40 × 2 = 80.',
      fixOptions: ['Do the same to the part: 40 × 2 = 80', 'Do the same to the part: 40 ÷ 2 = 20', 'Do the same to the part: 40 + 50 = 90'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    inverted: 'Divide the part by the whole, not the whole by the part.',
    'no-100': 'That is the decimal. Multiply by 100 to get the percent.',
    subtract: 'Subtracting gives how many are left, not the percent.',
    'part-as-percent': 'The part is only a percent when the whole is 100.',
    units: 'Same units first: change both amounts to the same unit before dividing.',
  },
};

const UNIT_PAIRS = [
  { small: 'minutes', big: 'hours', factor: 60, bigs: [1, 2, 3, 4, 5] },
  { small: 'cm', big: 'm', factor: 100, bigs: [1, 2, 3, 4, 5] },
  { small: 'g', big: 'kg', factor: 1000, bigs: [1, 2, 4, 5] },
  { small: 'mL', big: 'L', factor: 1000, bigs: [1, 2, 4, 5] },
];

/** Level 3: one amount as a percent of another with different units. Same units first! */
function mixedUnits(rng: Rng): Question {
  const u = rng.pick(UNIT_PAIRS);
  for (let tries = 0; tries < 60; tries++) {
    const big = rng.pick(u.bigs);
    const whole = big * u.factor;
    const p = rng.pick([5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, 80]);
    const part = (whole * p) / 100;
    if (!Number.isInteger(part)) continue;
    return {
      skillId: ID, level: 3, params: { part, whole },
      text: `What is ${part} ${u.small} as a percentage of ${big} ${u.big}?`,
      answer: { kind: 'percent', value: p }, answerText: `${fmt(p)}%`,
      hint: `Same units first: change ${big} ${u.big} into ${u.small}.`,
      steps: [`Same units first: ${big} ${u.big} is ${big} × ${u.factor} = ${whole} ${u.small}`, `${part} ÷ ${whole} = ${fmt(part / whole)}`, `${fmt(part / whole)} × 100 = ${fmt(p)}`, `So ${part} ${u.small} is ${fmt(p)}% of ${big} ${u.big}.`],
      traps: [{ value: clean((part / big) * 100), misconception: 'units', message: `${big} ${u.big} and ${part} ${u.small} are different units. Change to ${u.small} first.` }, { value: clean(part / whole), misconception: 'no-100' }].filter((t) => Math.abs(t.value - p) > 1e-9),
    };
  }
  return mixedUnits(rng);
}

/** Levels 2-3: which score is better? Change both to percents. */
function compareScores(rng: Rng, level: Level): Question {
  const pairs: [number, number, number, number][] = [[30, 40, 35, 50], [18, 24, 21, 30], [16, 20, 36, 50], [27, 30, 42, 50], [12, 16, 15, 25], [45, 60, 38, 50], [14, 20, 51, 75], [22, 25, 43, 50]];
  const [a, b, c, d] = rng.pick(pairs);
  const pa = clean((a / b) * 100), pc = clean((c / d) * 100);
  const first = `${a}/${b} (${fmt(pa)}%)`, second = `${c}/${d} (${fmt(pc)}%)`;
  const correct = pa > pc ? first : second;
  const { choices, correctIndex } = shuffleChoices(rng, correct, [pa > pc ? second : first, 'They are the same']);
  const who = at(NAMES, a), other = at(NAMES, a + 2);
  return {
    skillId: ID, level, params: { part: a, whole: b, choice: 1 },
    text: `${who} scored ${a} out of ${b} in one test and ${other} scored ${c} out of ${d} in another. Whose score is better?`,
    answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct,
    hint: 'Change both scores into percents, then compare.',
    steps: [`${a} ÷ ${b} × 100 = ${fmt(pa)}`, `${c} ÷ ${d} × 100 = ${fmt(pc)}`, `${fmt(Math.max(pa, pc))}% is higher, so ${correct} is the better score`],
    choices, traps: [],
  };
}
