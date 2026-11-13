import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Picture, Question, Skill, Trap } from '../types';
import { clean, decimals, fmt, simplify } from '../util';

const ID = 'fdp-conversions';

const L1_PERCENTS = [5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
const L2_PERCENTS = [12.5, 37.5, 62.5, 87.5, 2.5, 15, 35, 45, 55, 65, 85, 95, 2, 4, 6, 8];
const L3_PERCENTS = [150, 120, 110, 175, 250, 0.5, 1, 3, 7, 9, 12.5, 62.5];
const L1_FRACTIONS: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [1, 100]];
const L2_FRACTIONS: [number, number][] = [[3, 8], [1, 8], [5, 8], [7, 8], [7, 20], [3, 20], [9, 20], [11, 20], [9, 25], [7, 25], [13, 50], [3, 50], [1, 25], [1, 50]];
const L3_FRACTIONS: [number, number][] = [[3, 2], [5, 4], [7, 4], [11, 10], [13, 20], [17, 25], [1, 40], [3, 40], [9, 8], [7, 8]];

type Kind = 'p2d' | 'd2p' | 'f2p' | 'p2f' | 'd2f' | 'f2d';
const KIND_CODE: Record<Kind, number> = { p2d: 0, d2p: 1, f2p: 2, p2f: 3, d2f: 4, f2d: 5 };

function picture(p: number): Picture {
  if (p <= 100) return { type: 'hundred', shaded: p, label: `${fmt(p)}%` };
  return { type: 'bar', parts: 10, shaded: p / 10, totalLabel: '100%', shadedLabel: `${fmt(p)}%` };
}

function fractionToPercentSteps(num: number, den: number, p: number): string[] {
  if (100 % den === 0) {
    const k = 100 / den;
    return [
      `Make the bottom number 100: ${den} × ${k} = 100`,
      `Do the same to the top: ${num} × ${k} = ${num * k}`,
      `So ${num}/${den} = ${num * k}/100 = ${fmt(p)}%`,
    ];
  }
  const dec = clean(num / den);
  return [
    `${num} ÷ ${den} = ${fmt(dec)}`,
    `${fmt(dec)} × 100 = ${fmt(p)}`,
    `So ${num}/${den} = ${fmt(p)}%`,
  ];
}

export const fdpConversions: Skill = {
  id: ID,
  unit: 1,
  order: 1,
  title: 'Fractions, decimals and percents',
  short: 'Conversions',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'Percent means "out of 100". So 25% is 25 out of 100.',
      'That is the same as the fraction 25/100, which simplifies to 1/4, and the decimal 0.25.',
      'To turn a percent into a decimal, divide by 100. To turn a decimal into a percent, multiply by 100.',
      'To turn a fraction into a percent, make the bottom number 100 if you can.',
    ],
    rule: 'Percent means out of 100: ÷ 100 to get the decimal, × 100 to get the percent.',
    picture: { type: 'hundred', shaded: 25, label: '25% = 25/100 = 1/4 = 0.25' },
  },
  examples: [
    {
      problem: 'Write 3/5 as a percent.',
      steps: ['Make the bottom number 100: 5 × 20 = 100', 'Do the same to the top: 3 × 20 = 60', 'So 3/5 = 60/100 = 60%'],
      answer: '60%',
    },
    {
      problem: 'Write 0.35 as a fraction in its simplest form.',
      steps: ['0.35 is 35 hundredths: 0.35 = 35/100', 'Divide top and bottom by 5', '35/100 = 7/20'],
      answer: '7/20',
    },
  ],
  faded: [
    {
      problem: 'Write 0.6 as a percent.',
      steps: [
        { given: 'To turn a decimal into a percent, multiply by 100.' },
        { prompt: '0.6 × 100 = ?', answer: { kind: 'number', value: 60 }, answerText: '60', hint: 'Move the digits two places: 0.6 → 6 → 60.' },
        { given: 'So 0.6 = 60%.' },
      ],
    },
    {
      problem: 'Write 4/5 as a percent.',
      steps: [
        { given: 'Make the bottom number 100: 5 × 20 = 100' },
        { prompt: 'Do the same to the top: 4 × 20 = ?', answer: { kind: 'number', value: 80 }, answerText: '80' },
        { prompt: 'So 4/5 = 80/100 = ?%', answer: { kind: 'percent', value: 80 }, answerText: '80%' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const kinds: Kind[] = level === 1 ? ['p2d', 'd2p', 'f2p', 'p2f'] : level === 2 ? ['p2d', 'd2p', 'f2p', 'p2f', 'f2d'] : ['f2p', 'p2f', 'd2f', 'f2d', 'p2d', 'd2p'];
    const kind = rng.pick(kinds);
    const percents = level === 1 ? L1_PERCENTS : level === 2 ? L2_PERCENTS : L3_PERCENTS;
    const fractions = level === 1 ? L1_FRACTIONS : level === 2 ? L2_FRACTIONS : L3_FRACTIONS;
    const base = { skillId: ID, level, params: {} as Record<string, number>, traps: [] as Trap[] };

    if (kind === 'p2d') {
      // Level 1-2 decimals stay at 2 places; 0.125 and friends wait for level 3.
      const p = rng.pick(percents.filter((x) => decimals(x / 100) <= (level === 3 ? 3 : 2)));
      const d = clean(p / 100);
      return {
        ...base,
        params: { kind: KIND_CODE.p2d, p },
        text: `Write ${fmt(p)}% as a decimal.`,
        answer: { kind: 'number', value: d },
        answerText: fmt(d),
        hint: 'Percent means out of 100. Divide by 100.',
        steps: [`${fmt(p)}% means ${fmt(p)} out of 100`, `${fmt(p)} ÷ 100 = ${fmt(d)}`],
        revealPicture: true,
        picture: picture(p),
        traps: [
          { value: p, misconception: 'no-divide', message: `${fmt(p)} is the percent. Divide by 100 to get the decimal: ${fmt(d)}.` },
          { value: clean(p / 10), misconception: 'divide-ten' },
        ],
      };
    }
    if (kind === 'd2p') {
      const p = rng.pick(percents);
      const d = clean(p / 100);
      return {
        ...base,
        params: { kind: KIND_CODE.d2p, p },
        text: `Write ${fmt(d)} as a percent.`,
        answer: { kind: 'percent', value: p },
        answerText: `${fmt(p)}%`,
        hint: 'To turn a decimal into a percent, multiply by 100.',
        steps: [`${fmt(d)} × 100 = ${fmt(p)}`, `So ${fmt(d)} = ${fmt(p)}%`],
        revealPicture: true,
        picture: picture(p),
        traps: [
          { value: d, misconception: 'no-multiply', message: `${fmt(d)} is the decimal. Multiply by 100 to get the percent: ${fmt(p)}%.` },
          { value: clean(d * 10), misconception: 'times-ten' },
        ],
      };
    }
    if (kind === 'f2p') {
      const [num, den] = rng.pick(fractions);
      const p = clean((num / den) * 100);
      const digits = Number(`${num}${den}`);
      return {
        ...base,
        params: { kind: KIND_CODE.f2p, p },
        text: `Write ${num}/${den} as a percent.`,
        answer: { kind: 'percent', value: p },
        answerText: `${fmt(p)}%`,
        hint: 100 % den === 0 ? `Find the number that turns ${den} into 100, and multiply the top by the same number. The new top number is the percent.` : `A fraction is a division: work out ${num} ÷ ${den}, then × 100.`,
        steps: fractionToPercentSteps(num, den, p),
        revealPicture: true,
        picture: picture(p),
        traps: [
          { value: digits, misconception: 'digits', message: `${num}/${den} is not ${digits}%. The bottom number must become 100.` },
          { value: num, misconception: 'numerator' },
          { value: clean(num / den), misconception: 'no-multiply' },
        ].filter((t) => Math.abs(t.value - p) > 1e-9),
      };
    }
    if (kind === 'p2f') {
      const p = rng.pick(percents.filter((x) => Number.isInteger(x) && x <= 100));
      const [n, d] = simplify(p, 100);
      const g = 100 / d;
      return {
        ...base,
        params: { kind: KIND_CODE.p2f, p },
        text: `Write ${p}% as a fraction in its simplest form.`,
        answer: { kind: 'fraction', value: clean(p / 100), acceptEquivalents: true },
        answerText: `${n}/${d}`,
        hint: `${p}% is ${p} out of 100. Write that as a fraction, then simplify.`,
        steps: [`${p}% = ${p}/100`, g === 1 ? 'It is already in its simplest form.' : `Divide top and bottom by ${g}`, `${p}/100 = ${n}/${d}`],
        revealPicture: true,
        picture: picture(p),
        traps: [
          { value: p, misconception: 'no-divide', message: `${p}% means ${p} out of 100, so the fraction is ${p}/100 = ${n}/${d}.` },
          { value: clean(p / 10), misconception: 'divide-ten' },
        ],
      };
    }
    if (kind === 'd2f') {
      const p = rng.pick(percents.filter((x) => x < 100));
      const d = clean(p / 100);
      const den = Number.isInteger(p) ? 100 : 1000;
      const num = Math.round(d * den);
      const [n, dd] = simplify(num, den);
      const g = num / n;
      return {
        ...base,
        params: { kind: KIND_CODE.d2f, p },
        text: `Write ${fmt(d)} as a fraction in its simplest form.`,
        answer: { kind: 'fraction', value: d, acceptEquivalents: true },
        answerText: `${n}/${dd}`,
        hint: `${fmt(d)} is ${num} ${den === 100 ? 'hundredths' : 'thousandths'}.`,
        steps: [`${fmt(d)} = ${num}/${den}`, g === 1 ? 'It is already in its simplest form.' : `Divide top and bottom by ${g}`, `${num}/${den} = ${n}/${dd}`],
        revealPicture: true,
        picture: picture(p),
        traps: [
          { value: clean(num / 100) === d ? num / 10 : num / 100, misconception: 'wrong-denominator' },
          { value: num, misconception: 'no-divide' },
        ],
      };
    }
    // f2d: at level 2 keep to 2 decimal places (eighths wait for level 3)
    const [num, den] = rng.pick(fractions.filter(([n, d]) => decimals(n / d) <= (level === 3 ? 3 : 2)));
    const d = clean(num / den);
    return {
      ...base,
      params: { kind: KIND_CODE.f2d, p: clean(d * 100) },
      text: `Write ${num}/${den} as a decimal.`,
      answer: { kind: 'number', value: d },
      answerText: fmt(d),
      hint: `A fraction is a division: ${num} ÷ ${den}.`,
      steps: [`${num}/${den} means ${num} ÷ ${den}`, `${num} ÷ ${den} = ${fmt(d)}`],
      revealPicture: true,
      picture: picture(clean(d * 100)),
      traps: [
        { value: Number(`${num}.${den}`), misconception: 'digits', message: `${num}/${den} is a division, ${num} ÷ ${den}, not the digits ${num}.${den}.` },
        { value: clean(d * 100), misconception: 'times-hundred' },
      ],
    };
  },
  compute(params) {
    const k = params.kind;
    return k === KIND_CODE.d2p || k === KIND_CODE.f2p ? params.p : clean(params.p / 100);
  },
  mistakes: [
    {
      problem: 'Write 0.07 as a percent.',
      steps: ['0.07 × 100 moves the digits two places', '0.07 × 100 = 70', 'So 0.07 = 70%'],
      wrongStep: 1,
      reason: '0.07 × 100 is 7, not 70. Each place moves the digits once: 0.07 → 0.7 → 7.',
      fixOptions: ['0.07 × 100 = 7', '0.07 × 100 = 0.7', '0.07 × 100 = 700'],
      correctFix: 0,
    },
    {
      problem: 'Write 3/4 as a percent.',
      steps: ['3/4 means 3 out of 4', 'So 3/4 = 34%'],
      wrongStep: 1,
      reason: 'The digits 3 and 4 are not a percent. The bottom number must become 100: 4 × 25 = 100, so 3 × 25 = 75.',
      fixOptions: ['So 3/4 = 75%', 'So 3/4 = 43%', 'So 3/4 = 3.4%'],
      correctFix: 0,
    },
    {
      problem: 'Write 40% as a fraction in its simplest form.',
      steps: ['40% = 40/100', 'Divide top and bottom by 10', '40/100 = 4/100'],
      wrongStep: 2,
      reason: 'Whatever you do to the top you must do to the bottom too: 40 ÷ 10 = 4 and 100 ÷ 10 = 10, so 4/10, which simplifies again to 2/5.',
      fixOptions: ['40/100 = 4/10 = 2/5', '40/100 = 4/1', '40/100 = 40/10'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'no-divide': 'Percent means out of 100. Divide by 100 to get the decimal or fraction.',
    'divide-ten': 'Close, but percent is out of 100, not out of 10. Divide by 100.',
    'no-multiply': 'That is the decimal. Multiply by 100 to turn it into a percent.',
    'times-ten': 'Multiply by 100, not 10, to get the percent.',
    'times-hundred': 'The question asks for a decimal, not a percent. Do not multiply by 100.',
    'digits': 'A fraction is a division, not two digits side by side.',
    'numerator': 'The top number alone is not the percent. Compare it with the bottom number.',
    'wrong-denominator': 'Count the decimal places: 2 places means hundredths, 3 places means thousandths.',
  },
};
