import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { shuffleChoices } from '../util';

const ID = 'factors-primes';
const factorsOf = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter((i) => n % i === 0);
const isPrime = (n: number) => n > 1 && factorsOf(n).length === 2;
const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const TRICKY = [51, 57, 87, 91, 93, 39, 49, 77, 63, 69, 81, 85, 95, 99];

export const factorsPrimes: Skill = {
  id: ID,
  unit: 0,
  order: 0,
  title: 'Factors, factor pairs and primes',
  short: 'Factors & primes',
  taught: true,
  prerequisites: ['divisibility'],
  explain: {
    sentences: [
      'A factor divides into a number exactly. Factors come in pairs: for 12, the pairs are 1 × 12, 2 × 6 and 3 × 4, so 12 has 6 factors.',
      'To list them all, start at 1 and work up, writing each pair as you go. Stop when the pairs start repeating.',
      'A prime number has exactly two factors, 1 and itself: 2, 3, 5, 7, 11, 13, … A number with more factors is composite.',
      '1 is not prime (it has only one factor). Watch out for 51 (3 × 17) and 91 (7 × 13): they look prime but are not.',
    ],
    rule: 'Find factors in pairs, starting from 1. A prime has exactly two factors.',
    picture: { type: 'table', headers: ['12', 'pairs'], rows: [['1 × 12', '2 × 6'], ['3 × 4', '6 factors']] },
  },
  examples: [
    { problem: 'List all the factors of 105. How many are there?', steps: ['Pairs: 1 × 105, 3 × 35, 5 × 21, 7 × 15', 'Factors: 1, 3, 5, 7, 15, 21, 35, 105', 'That is 8 factors'], answer: '8 factors' },
    { problem: 'Is 51 prime?', steps: ['Digit sum 5 + 1 = 6, so 3 divides 51', '51 = 3 × 17', 'It has more than two factors, so 51 is not prime'], answer: 'No, 51 = 3 × 17' },
  ],
  faded: [
    { problem: 'How many factors does 36 have?', steps: [{ given: 'Pairs: 1 × 36, 2 × 18, 3 × 12, 4 × 9, 6 × 6' }, { prompt: 'Factors: 1, 2, 3, 4, 6, 9, 12, 18, 36. How many?', answer: { kind: 'number', value: 9 }, answerText: '9' }] },
    { problem: 'What is the largest prime factor of 84?', steps: [{ given: '84 = 2 × 42 = 2 × 2 × 21 = 2 × 2 × 3 × 7' }, { prompt: 'The largest prime factor is ?', answer: { kind: 'number', value: 7 }, answerText: '7' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const kind = level === 1 ? rng.int(0, 1) : level === 2 ? rng.int(1, 2) : rng.int(2, 3);
    if (kind === 0) {
      const n = rng.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48]);
      const f = factorsOf(n);
      const pairs = f.filter((x) => x * x <= n).map((x) => `${x} × ${n / x}`);
      return { ...base, params: { n, kind }, text: `How many factors does ${n} have?`, answer: { kind: 'number', value: f.length }, answerText: String(f.length), hint: 'Write the factor pairs, starting with 1 × …', steps: [`Pairs: ${pairs.join(', ')}`, `Factors: ${f.join(', ')}`, `That is ${f.length} factors`], traps: [{ value: pairs.length, misconception: 'pairs-not-factors', message: `${pairs.length} is the number of pairs; each pair gives two factors (unless both are the same).` }].filter((t) => t.value !== f.length) };
    }
    if (kind === 1) {
      const prime = rng.pick(PRIMES), tricky = rng.pick(TRICKY), other = rng.pick([rng.int(20, 99) * 2, rng.int(7, 33) * 3]);
      const { choices, correctIndex } = shuffleChoices(rng, String(prime), [String(tricky), String(other)]);
      const small = factorsOf(tricky).find((x) => x > 1)!;
      return { ...base, params: { n: prime, kind }, text: `Which of these numbers is prime: ${choices.join(', ')}?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: String(prime), hint: 'Test each one with the divisibility rules for 2, 3, 5 and 7.', steps: [`${tricky} = ${small} × ${tricky / small}, so not prime`, `${other} is ${other % 2 === 0 ? 'even' : 'divisible by 3'}, so not prime`, `${prime} has no factors apart from 1 and ${prime}, so it is prime`], choices, traps: [] };
    }
    if (kind === 2) {
      const n = rng.pick([60, 72, 84, 90, 96, 100, 105, 108, 120, 126, 132, 140]);
      const f = factorsOf(n);
      const pairs = f.filter((x) => x * x <= n).map((x) => `${x} × ${n / x}`);
      return { ...base, params: { n, kind }, text: `How many factor pairs does ${n} have?`, answer: { kind: 'number', value: pairs.length }, answerText: String(pairs.length), hint: 'Start with 1 × … and work upwards until the pairs repeat.', steps: [`Pairs: ${pairs.join(', ')}`, `That is ${pairs.length} pairs`], traps: [{ value: f.length, misconception: 'factors-not-pairs', message: `${f.length} is the number of factors; the question asks for pairs.` }].filter((t) => t.value !== pairs.length) };
    }
    const n = rng.pick([84, 90, 98, 110, 126, 130, 154, 165, 182, 198, 210, 220]);
    const primes = factorsOf(n).filter(isPrime);
    const big = primes[primes.length - 1];
    let m = n; const chain: string[] = [];
    for (const p of primes) while (m % p === 0) { chain.push(`${m} = ${p} × ${m / p}`); m /= p; }
    return { ...base, params: { n, kind }, text: `What is the largest prime factor of ${n}?`, answer: { kind: 'number', value: big }, answerText: String(big), hint: 'Keep dividing by the smallest prime that fits until only a prime is left.', steps: [...chain.slice(0, 4), `So ${n} = ${primes.join(' × ')}${primes.length === factorsOf(n).filter(isPrime).length ? '' : ''} (with repeats), and the largest prime factor is ${big}`], traps: [{ value: factorsOf(n)[factorsOf(n).length - 2], misconception: 'not-prime', message: 'That is the largest factor apart from the number itself, but it is not prime.' }, { value: primes[0], misconception: 'smallest' }].filter((t) => t.value !== big) };
  },
  compute: ({ n, kind }) => {
    const f = factorsOf(n);
    if (kind === 0) return f.length;
    if (kind === 1) return 0;
    if (kind === 2) return f.filter((x) => x * x <= n).length;
    return f.filter(isPrime).pop() ?? 0;
  },
  mistakes: [
    { problem: 'How many factors does 16 have?', steps: ['Pairs: 1 × 16, 2 × 8, 4 × 4', '3 pairs, so 6 factors'], wrongStep: 1, reason: '4 × 4 uses the same factor twice, so 16 has 5 factors: 1, 2, 4, 8, 16.', fixOptions: ['Factors: 1, 2, 4, 8, 16, so 5 factors', '3 pairs, so 6 factors', '3 pairs, so 3 factors'], correctFix: 0 },
    { problem: 'Is 91 prime?', steps: ['91 is odd, not in the 3 or 5 times table', 'So 91 is prime'], wrongStep: 1, reason: 'Check 7 as well: 91 = 7 × 13, so it is not prime.', fixOptions: ['Check 7: 91 = 7 × 13, so not prime', 'So 91 is prime', '91 = 9 × 11, so not prime'], correctFix: 0 },
    { problem: 'Is 1 a prime number?', steps: ['1 only divides by 1 and itself', 'So 1 is prime'], wrongStep: 1, reason: 'A prime needs exactly TWO factors. 1 has only one factor, so it is not prime.', fixOptions: ['1 has only one factor, so it is not prime', 'So 1 is prime', '1 is composite'], correctFix: 0 },
  ],
  misconceptions: {
    'pairs-not-factors': 'Each factor pair gives two factors (one if the pair is a square).',
    'factors-not-pairs': 'The question asks for pairs, not the total number of factors.',
    'not-prime': 'The answer must be a prime number: exactly two factors.',
    smallest: 'The question asks for the largest prime factor.',
  },
};
