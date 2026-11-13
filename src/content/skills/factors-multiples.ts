import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill, Trap } from '../types';
import { gcd } from '../util';

const ID = 'factors-multiples';

const factorsOf = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((i) => n % i === 0);
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
const multiples = (n: number, upTo: number) => Array.from({ length: Math.floor(upTo / n) }, (_, i) => n * (i + 1));

export const factorsMultiples: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Factors, multiples, HCF and LCM',
  short: 'HCF & LCM',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'A factor of a number divides into it exactly: the factors of 12 are 1, 2, 3, 4, 6 and 12.',
      'A multiple is in its times table: the multiples of 4 are 4, 8, 12, 16, …',
      'The highest common factor (HCF) is the biggest number that is a factor of both. For 12 and 18 it is 6.',
      'The lowest common multiple (LCM) is the smallest number in both times tables. For 4 and 6 it is 12.',
    ],
    rule: 'HCF: list the factors, pick the biggest shared one. LCM: list the multiples, pick the smallest shared one.',
    picture: { type: 'table', headers: ['', 'factors'], rows: [['12', '1 2 3 4 6 12'], ['18', '1 2 3 6 9 18'], ['HCF', '6']] },
  },
  examples: [
    {
      problem: 'Find the HCF of 12 and 18.',
      steps: ['Factors of 12: 1, 2, 3, 4, 6, 12', 'Factors of 18: 1, 2, 3, 6, 9, 18', 'Common factors: 1, 2, 3, 6', 'The highest common factor is 6'],
      answer: '6',
    },
    {
      problem: 'Find the LCM of 4 and 6.',
      steps: ['Multiples of 4: 4, 8, 12, 16, 20, 24', 'Multiples of 6: 6, 12, 18, 24', 'The lowest common multiple is 12'],
      answer: '12',
    },
  ],
  faded: [
    {
      problem: 'Find the HCF of 20 and 30.',
      steps: [
        { given: 'Factors of 20: 1, 2, 4, 5, 10, 20' },
        { given: 'Factors of 30: 1, 2, 3, 5, 6, 10, 15, 30' },
        { prompt: 'The highest common factor is ?', answer: { kind: 'number', value: 10 }, answerText: '10' },
      ],
    },
    {
      problem: 'Find the LCM of 6 and 9.',
      steps: [
        { given: 'Multiples of 6: 6, 12, 18, 24, 30' },
        { given: 'Multiples of 9: 9, 18, 27, 36' },
        { prompt: 'The lowest common multiple is ?', answer: { kind: 'number', value: 18 }, answerText: '18' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.5)) return threeNumbers(rng);
    const kind = level === 1 ? rng.int(0, 1) : level === 2 ? rng.int(0, 1) : rng.int(1, 2);
    const pairs: [number, number][] = [];
    const range = level === 1 ? [4, 6, 8, 9, 10, 12, 15, 16, 18, 20] : level === 2 ? [12, 14, 15, 16, 18, 20, 21, 24, 27, 28, 30, 36] : [6, 8, 9, 10, 12, 15, 18, 20, 24, 25, 30];
    for (const a of range) for (const b of range) if (a < b && gcd(a, b) > 1 && lcm(a, b) <= (level === 1 ? 60 : 120)) pairs.push([a, b]);
    const [a, b] = rng.pick(pairs);
    if (kind === 0) {
      const h = gcd(a, b);
      const common = factorsOf(a).filter((f) => b % f === 0);
      const traps: Trap[] = [
        { value: lcm(a, b), misconception: 'mixed-up', message: `${lcm(a, b)} is the lowest common MULTIPLE. The HCF is the biggest number that divides into both.` },
        { value: a * b, misconception: 'product' },
        { value: common[common.length - 2] ?? 1, misconception: 'not-highest' },
      ].filter((t) => t.value !== h);
      return {
        ...base,
        params: { a, b, kind },
        text: `Find the highest common factor (HCF) of ${a} and ${b}.`,
        answer: { kind: 'number', value: h },
        answerText: String(h),
        hint: `List the factors of ${a} and of ${b}. Which is the biggest number in both lists?`,
        steps: [`Factors of ${a}: ${factorsOf(a).join(', ')}`, `Factors of ${b}: ${factorsOf(b).join(', ')}`, `Common factors: ${common.join(', ')}`, `The highest common factor is ${h}`],
        traps,
      };
    }
    const l = lcm(a, b);
    if (kind === 1) {
      return {
        ...base,
        params: { a, b, kind },
        text: `Find the lowest common multiple (LCM) of ${a} and ${b}.`,
        answer: { kind: 'number', value: l },
        answerText: String(l),
        hint: `Write out the ${a} times table and the ${b} times table. Which number comes first in both?`,
        steps: [`Multiples of ${a}: ${multiples(a, l).join(', ')}`, `Multiples of ${b}: ${multiples(b, l).join(', ')}`, `The lowest common multiple is ${l}`],
        traps: [
          { value: gcd(a, b), misconception: 'mixed-up', message: `${gcd(a, b)} is the highest common FACTOR. The LCM is the smallest number in both times tables.` },
          { value: a * b, misconception: 'product', message: `${a} × ${b} = ${a * b} is a common multiple, but not the lowest one.` },
        ].filter((t) => t.value !== l),
      };
    }
    const text = rng.pick([
      `A bus to Rustavi leaves every ${a} minutes and a bus to Mtskheta every ${b} minutes. Both leave at 9:00. How many minutes later do they next leave together?`,
      `${['Nino', 'Luka', 'Mariam'][a % 3]} runs a lap in ${a} minutes and a friend runs it in ${b} minutes. They start together. After how many minutes are they at the start together again?`,
      `Hot dogs come in packs of ${a} and buns in packs of ${b}. What is the smallest number of each you can buy to have the same number of hot dogs and buns?`,
    ]);
    return {
      ...base,
      params: { a, b, kind },
      text,
      answer: { kind: 'number', value: l },
      answerText: String(l),
      hint: `You need the lowest common multiple of ${a} and ${b}.`,
      steps: [`This asks for the lowest common multiple of ${a} and ${b}`, `Multiples of ${a}: ${multiples(a, l).join(', ')}`, `Multiples of ${b}: ${multiples(b, l).join(', ')}`, `The lowest common multiple is ${l}`],
      traps: [
        { value: gcd(a, b), misconception: 'mixed-up' },
        { value: a * b, misconception: 'product' },
        { value: a + b, misconception: 'added' },
      ].filter((t) => t.value !== l),
    };
  },
  variety: 15,
  compute: ({ a, b, c, kind }) => (kind === 0 ? gcd(a, b) : kind === 3 ? gcd(gcd(a, b), c) : kind === 4 ? gcd(a, b) : kind === 5 ? lcm(lcm(a, b), c) : lcm(a, b)),
  mistakes: [
    {
      problem: 'Find the HCF of 8 and 12.',
      steps: ['Factors of 8: 1, 2, 4, 8', 'Factors of 12: 1, 2, 3, 4, 6, 12', 'Common factors: 1, 2, 4', 'The HCF is 2'],
      wrongStep: 3,
      reason: 'The HCF is the HIGHEST common factor, so pick the biggest: 4.',
      fixOptions: ['The HCF is 4', 'The HCF is 2', 'The HCF is 24'],
      correctFix: 0,
    },
    {
      problem: 'Find the LCM of 6 and 8.',
      steps: ['A common multiple is 6 × 8 = 48', 'So the LCM is 48'],
      wrongStep: 1,
      reason: '48 is a common multiple but not the lowest: 24 is in both times tables (6 × 4 and 8 × 3).',
      fixOptions: ['The lowest is 24', 'So the LCM is 48', 'So the LCM is 2'],
      correctFix: 0,
    },
    {
      problem: 'Find the LCM of 5 and 10.',
      steps: ['Multiples of 5: 5, 10, 15, 20', 'Multiples of 10: 10, 20, 30', 'The LCM is 20'],
      wrongStep: 2,
      reason: '10 appears in both lists before 20, so the LCM is 10.',
      fixOptions: ['The LCM is 10', 'The LCM is 20', 'The LCM is 50'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'mixed-up': 'HCF is the biggest factor of both; LCM is the smallest multiple of both.',
    product: 'Multiplying the two numbers gives a common multiple, but not always the lowest, and never the HCF.',
    'not-highest': 'That is a common factor, but not the highest one.',
    added: 'Adding the numbers does not give a common multiple.',
    'not-all-three': 'The answer must work for all three numbers, not just two.',
  },
};

/** Level 3: HCF or LCM of three numbers, and the "prize bags" HCF word problem. */
function threeNumbers(rng: Rng): Question {
  const kind = rng.int(3, 5);
  if (kind === 4) {
    const g = rng.pick([6, 8, 9, 12, 15]);
    const a = g * rng.pick([2, 3, 4, 5]), b = g * rng.pick([3, 5, 7]);
    if (gcd(a, b) !== g) return threeNumbers(rng);
    return {
      skillId: ID, level: 3, params: { a, b, c: 0, kind },
      text: `${rng.pick(['Nino', 'Luka', 'Ana'])} has ${a} pens and ${b} pencils to put into identical prize bags with nothing left over. What is the largest number of bags she can make?`,
      answer: { kind: 'number', value: g }, answerText: String(g),
      hint: 'Every bag must get the same number of pens and the same number of pencils, so you need a number that divides both: the HCF.',
      steps: [`Each bag gets the same share of pens and of pencils, so the number of bags divides both ${a} and ${b}`, `Factors of ${a}: ${factorsOf(a).join(', ')}`, `Factors of ${b}: ${factorsOf(b).join(', ')}`, `The highest common factor is ${g}, so ${g} bags (${a / g} pens and ${b / g} pencils each)`],
      traps: [{ value: lcm(a, b), misconception: 'mixed-up', message: 'Bags must DIVIDE both amounts, so you need the HCF, not the LCM.' }, { value: a * b, misconception: 'product' }].filter((t) => t.value !== g),
    };
  }
  const g = rng.pick([6, 12, 14, 18, 21, 42]);
  const a = g * rng.pick([2, 3, 4]), b = g * rng.pick([3, 5]), c = g * rng.pick([5, 7]);
  if (kind === 3) {
    const h = gcd(gcd(a, b), c);
    return {
      skillId: ID, level: 3, params: { a, b, c, kind },
      text: `Find the HCF of ${a}, ${b} and ${c}.`,
      answer: { kind: 'number', value: h }, answerText: String(h),
      hint: 'Find a number that goes into all three. Try the HCF of the first two, then check it against the third.',
      steps: [`HCF of ${a} and ${b}: ${gcd(a, b)}`, `Factors of ${gcd(a, b)} that also divide ${c}: the biggest is ${h}`, `So the HCF of all three is ${h}`],
      traps: [{ value: gcd(a, b), misconception: 'not-all-three', message: `${gcd(a, b)} divides ${a} and ${b}, but check ${c} too.` }].filter((t) => t.value !== h),
    };
  }
  const p = rng.pick([4, 6, 8]), q = rng.pick([6, 9, 10, 12]), r = rng.pick([10, 12, 15]);
  const l = lcm(lcm(p, q), r);
  return {
    skillId: ID, level: 3, params: { a: p, b: q, c: r, kind },
    text: rng.pick([`Find the LCM of ${p}, ${q} and ${r}.`, `Three lights flash every ${p}, ${q} and ${r} seconds. They flash together now. After how many seconds do they all flash together again?`]),
    answer: { kind: 'number', value: l }, answerText: String(l),
    hint: 'Find the LCM of the first two numbers, then the LCM of that answer and the third.',
    steps: [`LCM of ${p} and ${q}: ${lcm(p, q)}`, `LCM of ${lcm(p, q)} and ${r}: ${l}`, `So the LCM of all three is ${l}`],
    traps: [{ value: p * q * r, misconception: 'product' }, { value: lcm(p, q), misconception: 'not-all-three', message: `${lcm(p, q)} works for ${p} and ${q}; it must be a multiple of ${r} as well.` }].filter((t) => t.value !== l),
  };
}
