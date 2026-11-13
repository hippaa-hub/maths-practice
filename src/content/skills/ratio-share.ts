import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { NAMES, at, gcd, gel } from '../util';

const ID = 'ratio-share';

export const ratioShare: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Share in a ratio',
  short: 'Share in a ratio',
  taught: true,
  prerequisites: ['ratio-equivalent'],
  explain: {
    sentences: [
      'To share an amount in a ratio, first add the parts of the ratio to find the total number of parts.',
      'Divide the amount by the total parts to find the size of one part.',
      'Then multiply by each person’s number of parts.',
      'For 40 GEL shared 3:5: 8 parts, one part is 5 GEL, so the shares are 15 GEL and 25 GEL.',
    ],
    rule: 'Add the parts, find one part, multiply up. Check: the shares add back to the total.',
    picture: { type: 'bar', parts: 8, shaded: 3, totalLabel: '40 GEL = 8 parts', shadedLabel: '3 parts = 15', partLabel: '1 part = 5' },
  },
  examples: [
    {
      problem: 'Share 40 GEL between Nino and Luka in the ratio 3:5. How much does Nino get?',
      steps: ['Total parts: 3 + 5 = 8', 'One part: 40 ÷ 8 = 5', 'Nino gets 3 parts: 3 × 5 = 15', 'Check: Luka gets 5 × 5 = 25, and 15 + 25 = 40'],
      answer: '15 GEL',
    },
    {
      problem: 'Share 60 sweets in the ratio 1:2:3. How many does the person with the most get?',
      steps: ['Total parts: 1 + 2 + 3 = 6', 'One part: 60 ÷ 6 = 10', 'The biggest share is 3 parts: 3 × 10 = 30'],
      answer: '30 sweets',
    },
  ],
  faded: [
    {
      problem: 'Share 35 GEL in the ratio 2:5. How much is the smaller share?',
      steps: [
        { prompt: 'Total parts: 2 + 5 = ?', answer: { kind: 'number', value: 7 }, answerText: '7' },
        { prompt: 'One part: 35 ÷ 7 = ?', answer: { kind: 'number', value: 5 }, answerText: '5' },
        { prompt: 'Smaller share: 2 × 5 = ?', answer: { kind: 'money', value: 10 }, answerText: '10 GEL' },
      ],
    },
    {
      problem: 'Share 48 stickers between Ana and Sandro in the ratio 5:3. How many does Ana get?',
      steps: [
        { given: 'Total parts: 5 + 3 = 8' },
        { prompt: 'One part: 48 ÷ 8 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' },
        { prompt: 'Ana gets 5 parts: 5 × 6 = ?', answer: { kind: 'number', value: 30 }, answerText: '30' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    let a = 1, b = 2, c = 0;
    do { a = rng.int(1, level === 1 ? 5 : 7); b = rng.int(1, level === 1 ? 5 : 7); } while (a === b || gcd(a, b) !== 1);
    if (level === 3 && rng.chance(0.5)) { c = rng.int(1, 6); }
    const parts = a + b + c;
    const one = level === 1 ? rng.pick([2, 3, 4, 5, 10]) : rng.pick([3, 4, 5, 6, 7, 8, 9, 12, 15, 20]);
    const total = parts * one;
    const n1 = at(NAMES, total), n2 = at(NAMES, total + 3), n3 = at(NAMES, total + 5);
    const askDiff = level >= 2 && c === 0 && rng.chance(0.3);
    const r = askDiff ? Math.abs(a - b) * one : a * one;
    const traps: Trap[] = [
      { value: total / a, misconception: 'divided-by-part', message: `Divide by the TOTAL number of parts (${parts}), not by ${a}.` },
      { value: total / (c ? 3 : 2), misconception: 'halved' },
      { value: one, misconception: 'one-part', message: `${one} is one part. ${n1} gets ${a} parts.` },
      { value: b * one, misconception: 'wrong-person' },
      { value: parts, misconception: 'parts-only' },
    ].filter((t) => Math.abs(t.value - r) > 1e-9);
    const ratioText = c ? `${a}:${b}:${c}` : `${a}:${b}`;
    const text = askDiff
      ? `${n1} and ${n2} share ${gel(total)} in the ratio ${a}:${b}. How much more does ${a > b ? n1 : n2} get than ${a > b ? n2 : n1}?`
      : c
        ? `${n1}, ${n2} and ${n3} share ${gel(total)} in the ratio ${ratioText}. How much does ${n1} get?`
        : rng.pick([
            `Share ${gel(total)} between ${n1} and ${n2} in the ratio ${ratioText}. How much does ${n1} get?`,
            `A ${total} cm ribbon is cut in the ratio ${ratioText}. How long is the first piece, in cm?`,
            `${total} sweets are shared in the ratio ${ratioText}. How many sweets is the first share?`,
          ]);
    const money = text.includes('GEL');
    return {
      ...base,
      params: { a, b, c, one, askDiff: askDiff ? 1 : 0 },
      text,
      answer: { kind: money ? 'money' : 'number', value: r },
      answerText: money ? gel(r) : String(r),
      hint: `First find ONE PART. Add the parts: ${c ? `${a} + ${b} + ${c}` : `${a} + ${b}`}, then divide ${total} by that.`,
      steps: [
        `Total parts: ${c ? `${a} + ${b} + ${c}` : `${a} + ${b}`} = ${parts}`,
        `One part: ${total} ÷ ${parts} = ${one}`,
        askDiff
          ? `${n1} gets ${a} × ${one} = ${a * one}; ${n2} gets ${b} × ${one} = ${b * one}`
          : `First share: ${a} × ${one} = ${r}`,
        askDiff ? `Difference: ${Math.max(a, b) * one} − ${Math.min(a, b) * one} = ${r}` : `Check: ${c ? `${a * one} + ${b * one} + ${c * one}` : `${a * one} + ${b * one}`} = ${total}`,
      ],
      picture: { type: 'bar', parts, shaded: a, totalLabel: `${total} = ${parts} parts`, shadedLabel: `${a} parts`, partLabel: `1 part = ${one}` },
      traps,
    };
  },
  compute: ({ a, b, one, askDiff }) => (askDiff ? Math.abs(a - b) * one : a * one),
  mistakes: [
    {
      problem: 'Share 30 GEL in the ratio 2:3. How much is the smaller share?',
      steps: ['Divide by 2: 30 ÷ 2 = 15', 'Smaller share: 15 GEL'],
      wrongStep: 0,
      reason: 'Add the parts first: 2 + 3 = 5 parts, one part is 30 ÷ 5 = 6, so the smaller share is 2 × 6 = 12 GEL.',
      fixOptions: ['Total parts 2 + 3 = 5; one part 30 ÷ 5 = 6; smaller share 2 × 6 = 12 GEL', 'Divide by 2: 15 GEL', 'Divide by 3: 10 GEL'],
      correctFix: 0,
    },
    {
      problem: 'Share 56 sweets in the ratio 3:4. How many is the larger share?',
      steps: ['Total parts: 3 + 4 = 7', 'One part: 56 ÷ 7 = 8', 'Larger share: 8 sweets'],
      wrongStep: 2,
      reason: '8 is one part. The larger share is 4 parts: 4 × 8 = 32.',
      fixOptions: ['Larger share: 4 × 8 = 32 sweets', 'Larger share: 8 sweets', 'Larger share: 3 × 8 = 24 sweets'],
      correctFix: 0,
    },
    {
      problem: 'Share 45 GEL between Ana and Giorgi in the ratio 4:5. How much does Giorgi get?',
      steps: ['Total parts: 4 + 5 = 9', 'One part: 45 ÷ 9 = 5', 'Giorgi gets 4 × 5 = 20 GEL'],
      wrongStep: 2,
      reason: 'Giorgi is second in the ratio, so he gets 5 parts: 5 × 5 = 25 GEL.',
      fixOptions: ['Giorgi gets 5 × 5 = 25 GEL', 'Giorgi gets 4 × 5 = 20 GEL', 'Giorgi gets 45 − 5 = 40 GEL'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'divided-by-part': 'Divide the total by the total number of parts, not by one of the ratio numbers.',
    halved: 'Sharing in a ratio is not sharing equally. Add the parts first.',
    'one-part': 'That is the size of one part. Multiply by the number of parts for that person.',
    'wrong-person': 'Check which number in the ratio belongs to the person in the question.',
    'parts-only': 'That is the number of parts. Now divide the amount by it.',
  },
};
