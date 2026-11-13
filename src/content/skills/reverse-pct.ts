import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { ITEMS, NAMES, at, capitalise, clean, decimals, fmt, gel, shuffleChoices } from "../util";

const ID = 'reverse-pct';

const L1 = { p: [10, 20, 25, 50], orig: [40, 50, 60, 80, 100, 120, 150, 200, 300], dirs: [-1] };
const L2 = { p: [10, 20, 25, 50, 5, 30, 40, 60], orig: [40, 50, 60, 80, 100, 120, 150, 200, 300, 400], dirs: [-1, 1] };
const L3 = { p: [15, 35, 12.5, 2.5, 5, 45, 65, 75], orig: [40, 80, 120, 160, 200, 240, 400, 800], dirs: [-1, 1] };

interface Ctx { text: (p: number, after: number) => string; kind: 'money' | 'number'; unit?: string; dir: 1 | -1 }
const CONTEXTS: Ctx[] = [
  { dir: -1, kind: 'money', text: (p, after) => `After a ${fmt(p)}% discount, ${at(ITEMS, after).name} costs ${gel(after)}. What was the price before the discount?` },
  { dir: -1, kind: 'money', text: (p, after) => `In a sale everything is ${fmt(p)}% off. ${at(NAMES, after)} pays ${gel(after)} for ${at(ITEMS, after + 3).name}. What was the full price?` },
  { dir: 1, kind: 'money', text: (p, after) => `After a ${fmt(p)}% rise, a monthly bus pass costs ${gel(after)}. What did it cost before the rise?` },
  { dir: 1, kind: 'number', unit: 'cm', text: (p, after) => `A plant grew ${fmt(p)}% taller and is now ${fmt(after)} cm. How tall was it before?` },
  { dir: 1, kind: 'number', text: (p, after) => `The number of students in a club went up by ${fmt(p)}% to ${fmt(after)}. How many were there before?` },
];

function picture(p: number, dir: number, after: number): Picture {
  const pct = 100 + dir * p;
  return { type: 'bar', parts: 10, shaded: pct / 10, totalLabel: '? (100%)', shadedLabel: `${fmt(pct)}% = ${fmt(after)}` };
}

export const reversePct: Skill = {
  id: ID,
  unit: 1,
  order: 7,
  title: 'Reverse percentages',
  short: 'Reverse %',
  taught: true,
  prerequisites: ['pct-decrease'],
  explain: {
    sentences: [
      'Sometimes you know the price AFTER a change and want the price BEFORE it.',
      'After 20% off, you pay 100% − 20% = 80% of the original. So the sale price is 80%.',
      'Find 1% by dividing the sale price by 80, then multiply by 100 to get the original.',
      'Careful: adding 20% back on to the sale price does NOT work, because 20% of a smaller number is smaller.',
    ],
    rule: 'The price after a change is (100 ± p)% of the original. Divide by that percent to find 1%, then × 100.',
    picture: { type: 'bar', parts: 10, shaded: 8, totalLabel: '? (100%)', shadedLabel: '80% = 40 GEL' },
  },
  examples: [
    {
      problem: 'After a 20% discount a jacket costs 40 GEL. What was the price before?',
      steps: ['100% − 20% = 80%', 'So 40 GEL is 80% of the original', '1% of the original = 40 ÷ 80 = 0.5', 'Original price = 0.5 × 100 = 50 GEL'],
      answer: '50 GEL',
    },
    {
      problem: 'After a 25% rise, a bus pass costs 60 GEL. What did it cost before?',
      steps: ['100% + 25% = 125%', 'So 60 GEL is 125% of the old price', '1% of the old price = 60 ÷ 125 = 0.48', 'Old price = 0.48 × 100 = 48 GEL'],
      answer: '48 GEL',
    },
  ],
  faded: [
    {
      problem: 'After 10% off, a book costs 18 GEL. What was the full price?',
      steps: [
        { given: '100% − 10% = 90%, so 18 GEL is 90% of the full price' },
        { prompt: '1% of the full price = 18 ÷ 90 = ?', answer: { kind: 'number', value: 0.2 }, answerText: '0.2' },
        { prompt: 'Full price = 0.2 × 100 = ?', answer: { kind: 'money', value: 20 }, answerText: '20 GEL' },
      ],
    },
    {
      problem: 'After a 50% rise, a ticket costs 30 GEL. What did it cost before?',
      steps: [
        { prompt: '100% + 50% = ?%', answer: { kind: 'percent', value: 150 }, answerText: '150%' },
        { given: 'So 30 GEL is 150% of the old price' },
        { prompt: '1% of the old price = 30 ÷ 150 = ?', answer: { kind: 'number', value: 0.2 }, answerText: '0.2' },
        { prompt: 'Old price = 0.2 × 100 = ?', answer: { kind: 'money', value: 20 }, answerText: '20 GEL' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    if (level === 3 && rng.chance(0.3)) return choiceQuestion(rng);
    const pool = level === 1 ? L1 : level === 2 ? L2 : L3;
    const triples: [number, number, number][] = [];
    for (const p of pool.p) for (const orig of pool.orig) for (const dir of pool.dirs) {
      const after = clean(orig * (1 + (dir * p) / 100));
      if (decimals(after) <= (level === 1 ? 0 : 1)) triples.push([p, orig, dir]);
    }
    const [p, orig, dir] = rng.pick(triples);
    const after = clean(orig * (1 + (dir * p) / 100));
    const pct = 100 + dir * p;
    const ctx = rng.pick(CONTEXTS.filter((c) => c.dir === dir));
    const unit = ctx.kind === 'money' ? ' GEL' : ctx.unit ? ` ${ctx.unit}` : '';
    const one = clean(orig / 100);
    const traps: Trap[] = [
      { value: clean(after * (1 + p / 100)), misconception: 'add-back-on', message: `Adding ${fmt(p)}% to ${fmt(after)} does not undo the change: ${fmt(p)}% of ${fmt(after)} is not ${fmt(p)}% of the original.` },
      { value: clean(after * (1 - p / 100)), misconception: 'took-off-again' },
      { value: clean(after + p), misconception: 'add-number' },
      { value: clean(after / (p / 100)), misconception: 'divide-by-percent' },
      { value: after, misconception: 'same' },
    ].filter((t) => Math.abs(t.value - orig) > 1e-9);
    return {
      skillId: ID,
      level,
      params: { p, after, dir },
      text: ctx.text(p, after),
      answer: { kind: ctx.kind, value: orig },
      answerText: `${fmt(orig)}${unit}`,
      hint: `To find the WHOLE from a part, divide. ${fmt(after)} is ${fmt(pct)}% of the original: divide by ${fmt(pct)} to find 1%, then × 100.`,
      steps: [
        dir === -1 ? `100% − ${fmt(p)}% = ${fmt(pct)}%` : `100% + ${fmt(p)}% = ${fmt(pct)}%`,
        `So ${fmt(after)}${unit} is ${fmt(pct)}% of the original`,
        `1% of the original = ${fmt(after)} ÷ ${fmt(pct)} = ${fmt(one)}`,
        `Original = ${fmt(one)} × 100 = ${fmt(orig)}${unit}`,
      ],
      picture: picture(p, dir, after),
      traps,
    };
  },
  compute: ({ p, after, dir }) => clean(after / (1 + (dir * p) / 100)),
  mistakes: [
    {
      problem: 'After 20% off, a hoodie costs 40 GEL. What was the full price?',
      steps: ['20% of 40 = 8', 'Full price = 40 + 8 = 48 GEL'],
      wrongStep: 0,
      reason: 'The 20% was taken off the FULL price, not off 40. 40 GEL is 80% of the full price, so 40 ÷ 80 × 100 = 50 GEL.',
      fixOptions: ['40 is 80%, so 1% of the price = 40 ÷ 80 = 0.5; full price = 0.5 × 100 = 50 GEL', '20% of 40 = 8 is right', '40 is 20%, so 100% = 40 × 5 = 200 GEL'],
      correctFix: 0,
    },
    {
      problem: 'After a 25% rise, a ticket costs 60 GEL. What did it cost before?',
      steps: ['100% − 25% = 75%', '1% of the old price = 60 ÷ 75 = 0.8', 'Old price = 0.8 × 100 = 80 GEL'],
      wrongStep: 0,
      reason: 'It was a rise, so the new price is 100% + 25% = 125% of the old one. 60 ÷ 125 × 100 = 48 GEL.',
      fixOptions: ['100% + 25% = 125%', '100% − 25% = 75% is right', '100% × 25% = 25%'],
      correctFix: 0,
    },
    {
      problem: 'After 10% off, a game costs 36 GEL. What was the full price?',
      steps: ['100% − 10% = 90%', '1% of the full price = 36 ÷ 90 = 0.4', 'Full price = 0.4 × 90 = 36 GEL'],
      wrongStep: 2,
      reason: 'The full price is 100%, so multiply 1% by 100, not by 90: 0.4 × 100 = 40 GEL.',
      fixOptions: ['Full price = 0.4 × 100 = 40 GEL', 'Full price = 0.4 × 90 = 36 GEL is right', 'Full price = 0.4 × 10 = 4 GEL'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'add-back-on': 'Adding the percent back on does not undo it. The percent was taken from the original, which was bigger.',
    'took-off-again': 'The change already happened. Do not take the percent off again.',
    'add-number': 'A percent is a share, not a number of GEL to add.',
    'divide-by-percent': 'Divide by the percent that the price IS (100 ± p), not by the change.',
    same: 'The question asks for the price BEFORE the change, which is different.',
  },
};

function choiceQuestion(rng: Rng): Question {
  const p = rng.pick([10, 20, 25, 50]);
  const orig = rng.pick([40, 80, 100, 200]);
  const after = clean(orig * (1 - p / 100));
  const name = rng.pick(NAMES.filter((n) => n !== 'Adele'));
  const correct = `No. ${fmt(p)}% of ${fmt(after)} is smaller than ${fmt(p)}% of the original price, so adding it back on gives too little.`;
  const { choices, correctIndex } = shuffleChoices(rng, correct, [
    `Yes. Adding ${fmt(p)}% undoes taking ${fmt(p)}% off.`,
    `No. ${name} should add ${fmt(p)} GEL instead.`,
  ]);
  return {
    skillId: ID,
    level: 3,
    params: { p, after, dir: -1, choice: 1 },
    text: `${capitalise(at(ITEMS, orig).name)} costs ${gel(after)} after ${fmt(p)}% off. ${name} says: "To find the original price, add ${fmt(p)}% back on to ${gel(after)}." Is ${name} right?`,
    answer: { kind: 'choice', value: 0, choice: correctIndex },
    answerText: correct,
    hint: `The ${fmt(p)}% was taken from the ORIGINAL price, which was bigger than ${gel(after)}.`,
    steps: [
      `The discount was ${fmt(p)}% of the original price, ${gel(orig)}: that is ${gel(clean(orig * p / 100))}.`,
      `${fmt(p)}% of ${gel(after)} is only ${gel(clean(after * p / 100))}, which is less.`,
      `So adding ${fmt(p)}% back on gives ${gel(clean(after * (1 + p / 100)))}, not ${gel(orig)}.`,
    ],
    choices,
    traps: [],
  };
}
