import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { clean, decimals, fmt, gel, shuffleChoices } from '../util';

const ID = 'successive-changes';

export const successiveChanges: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Successive percentage changes',
  short: 'Two changes',
  taught: true,
  prerequisites: ['pct-increase', 'pct-decrease'],
  explain: {
    sentences: [
      'When two percentage changes happen one after the other, do them one at a time. The second change is worked out on the NEW amount, not the original.',
      '80 GEL goes up 20% (to 96) and then down 20%: 20% of 96 is 19.2, so the price becomes 76.8 GEL, not 80.',
      'With multipliers: × 1.2 then × 0.8 is × 0.96 overall, a 4% drop.',
      'A car losing 10% a year is × 0.9 each year: after 2 years it is worth 0.9 × 0.9 = 0.81 of the start.',
    ],
    rule: 'Do the changes one at a time; each one works on the amount you have just reached. +p% then −p% does NOT get you back.',
    picture: { type: 'compare', rows: [{ label: 'Start: 80', value: 80, tone: 'blue' }, { label: '+20%: 96', value: 96, tone: 'green' }, { label: '−20%: 76.8', value: 76.8, tone: 'orange' }] },
  },
  examples: [
    { problem: 'A price of 80 GEL rises by 20%, then falls by 20%. What is the final price?', steps: ['First change: 20% of 80 = 16', '80 + 16 = 96', 'Second change works on 96: 20% of 96 = 19.2', '96 − 19.2 = 76.8', 'Final price 76.8 GEL, not 80: the 20% taken off was bigger than the 20% added'], answer: '76.80 GEL' },
    { problem: 'A car is worth 20000 GEL and loses 10% of its value each year. What is it worth after 2 years?', steps: ['Each year the value is × 0.9', 'After 1 year: 20000 × 0.9 = 18000', 'After 2 years: 18000 × 0.9 = 16200', 'So 16200 GEL'], answer: '16200 GEL' },
  ],
  faded: [
    { problem: '50 GEL goes up 10%, then down 10%. Final price?', steps: [{ prompt: 'Up 10%: 50 + 5 = ?', answer: { kind: 'number', value: 55 }, answerText: '55' }, { prompt: '10% of 55 = ?', answer: { kind: 'number', value: 5.5 }, answerText: '5.5' }, { prompt: '55 − 5.5 = ?', answer: { kind: 'money', value: 49.5 }, answerText: '49.50 GEL' }] },
    { problem: 'A salary of 1000 GEL rises 20% one year and 10% the next. Final salary?', steps: [{ prompt: 'After the first rise: 1000 × 1.2 = ?', answer: { kind: 'number', value: 1200 }, answerText: '1200' }, { prompt: 'After the second rise: 1200 × 1.1 = ?', answer: { kind: 'money', value: 1320 }, answerText: '1320 GEL' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.4)) {
      const a = rng.pick([80, 100, 200, 50]), p = rng.pick([10, 20, 25, 50]);
      const up = clean(a * (1 + p / 100)), down = clean(up * (1 - p / 100));
      const correct = `No. The ${p}% off is taken from ${fmt(up)}, which is more than ${a}, so more is taken off than was added. It ends at ${fmt(down)}.`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, [`Yes. +${p}% and −${p}% cancel out, so it is back to ${a}.`, `No. It ends higher than ${a}, because the increase came first.`]);
      return { ...base, params: { a, p1: p, p2: -p, kind: 1 }, text: `A price of ${gel(a)} goes up by ${p}% and then down by ${p}%. Nino says it is back to ${gel(a)}. Is she right?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'Work out both steps. The second change is a percentage of the NEW price.', steps: [`Up ${p}%: ${a} × ${1 + p / 100} = ${fmt(up)}`, `Down ${p}% of ${fmt(up)}: ${fmt(up)} × ${1 - p / 100} = ${fmt(down)}`, `${fmt(down)} is less than ${a}, so she is not right`], choices, traps: [] };
    }
    const a = rng.pick(level === 1 ? [50, 80, 100, 200, 400] : [60, 120, 150, 250, 300, 500, 800, 1000, 2000, 20000]);
    let p1 = 20, p2 = -20;
    for (let tries = 0; tries < 50; tries++) {
      p1 = rng.pick([10, 20, 25, 50, -10, -20, -25, -50, 5, 15, 30, 40]);
      p2 = level === 1 ? -p1 : rng.pick([10, 20, 25, 50, -10, -20, -25, -50, 5, 15, 30, 40]);
      const r = clean(a * (1 + p1 / 100) * (1 + p2 / 100));
      if (decimals(r) <= (level === 1 ? 1 : 2) && Math.abs(p1) !== 5) break;
    }
    const mid = clean(a * (1 + p1 / 100)), r = clean(mid * (1 + p2 / 100));
    const d1 = clean(Math.abs(a * p1 / 100)), d2 = clean(Math.abs(mid * p2 / 100));
    const word = (p: number) => (p > 0 ? `up by ${p}%` : `down by ${-p}%`);
    const ctx = rng.pick([
      `A jacket costs ${gel(a)}. The price goes ${word(p1)}, then ${word(p2)}. What is the final price?`,
      `${a >= 1000 ? 'A car' : 'A bike'} is worth ${gel(a)}. Its value goes ${word(p1)} in the first year and ${word(p2)} in the second. What is it worth after two years?`,
      `A shop's sales were ${a} items a week. They went ${word(p1)}, then ${word(p2)}. How many items a week now?`,
    ]);
    const money = ctx.includes('GEL');
    return {
      ...base, params: { a, p1, p2, kind: 0 },
      text: ctx,
      answer: { kind: money ? 'money' : 'number', value: r }, answerText: money ? gel(r) : fmt(r),
      hint: 'Do the first change, then do the second change on the NEW amount (not on the original).',
      steps: [`First change: ${Math.abs(p1)}% of ${fmt(a)} = ${fmt(d1)}`, `${fmt(a)} ${p1 > 0 ? '+' : '−'} ${fmt(d1)} = ${fmt(mid)}`, `Second change works on ${fmt(mid)}: ${Math.abs(p2)}% of ${fmt(mid)} = ${fmt(d2)}`, `${fmt(mid)} ${p2 > 0 ? '+' : '−'} ${fmt(d2)} = ${fmt(r)}`, `Multiplier check: ${1 + p1 / 100} × ${1 + p2 / 100} = ${fmt(clean((1 + p1 / 100) * (1 + p2 / 100)))}`],
      picture: { type: 'compare', rows: [{ label: `Start: ${fmt(a)}`, value: a, tone: 'blue' }, { label: `Then: ${fmt(mid)}`, value: mid, tone: p1 > 0 ? 'green' : 'orange' }, { label: `Final: ${fmt(r)}`, value: r, tone: p2 > 0 ? 'green' : 'orange' }] },
      traps: [
        { value: clean(a * (1 + (p1 + p2) / 100)), misconception: 'added-percents', message: `You added the percentages (${p1 + p2}%). The second change is a percentage of ${fmt(mid)}, not of ${fmt(a)}.` },
        { value: mid, misconception: 'one-change', message: `${fmt(mid)} is after the first change only.` },
        { value: a, misconception: 'back-to-start' },
      ].filter((t) => Math.abs(t.value - r) > 1e-9),
    };
  },
  compute: ({ a, p1, p2, kind }) => (kind === 1 ? 0 : clean(a * (1 + p1 / 100) * (1 + p2 / 100))),
  mistakes: [
    { problem: 'A price of 200 GEL rises 10% and then falls 10%. Final price?', steps: ['+10% and −10% cancel out', 'So the price is still 200 GEL'], wrongStep: 0, reason: 'The 10% off is taken from 220, so it is 22, bigger than the 20 added: 220 − 22 = 198 GEL.', fixOptions: ['200 → 220 → 220 − 22 = 198 GEL', '+10% and −10% cancel out', '200 + 20 + 20 = 240 GEL'], correctFix: 0 },
    { problem: 'A salary of 1000 GEL rises 20% then 30%. Final salary?', steps: ['20% + 30% = 50%', '1000 × 1.5 = 1500 GEL'], wrongStep: 0, reason: 'Do them one at a time: 1000 × 1.2 = 1200, then 1200 × 1.3 = 1560 GEL.', fixOptions: ['1000 × 1.2 = 1200, then 1200 × 1.3 = 1560 GEL', '20% + 30% = 50%', '1000 × 1.2 × 1.3 = 1300 GEL'], correctFix: 0 },
    { problem: 'A car worth 10000 GEL loses 20% a year. Value after 2 years?', steps: ['20% of 10000 = 2000', 'After 2 years: 10000 − 2000 − 2000 = 6000 GEL'], wrongStep: 1, reason: 'The second year\'s 20% is of 8000, which is 1600: 8000 − 1600 = 6400 GEL.', fixOptions: ['Year 1: 8000; year 2: 8000 − 1600 = 6400 GEL', '10000 − 2000 − 2000 = 6000 GEL', '10000 − 4000 = 6000 GEL'], correctFix: 0 },
  ],
  misconceptions: {
    'added-percents': 'Percentages of different amounts cannot just be added. Do one change at a time.',
    'one-change': 'That is after the first change only. Now do the second one on that amount.',
    'back-to-start': 'An increase and a decrease of the same percent do not cancel: the second is a percent of a different amount.',
  },
};
