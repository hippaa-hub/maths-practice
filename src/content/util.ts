import { fmt, gel } from '../engine/answers';
import type { Rng } from '../engine/rng';

export { fmt, gel };

export const NAMES = ['Adele', 'Nino', 'Giorgi', 'Mariam', 'Luka', 'Ana', 'Sandro', 'Elene'];

export interface Item { name: string; plural?: string }
export const ITEMS: Item[] = [
  { name: 'a hoodie' }, { name: 'a pair of trainers' }, { name: 'a school bag' }, { name: 'a football' },
  { name: 'a phone case' }, { name: 'a book' }, { name: 'a pizza' }, { name: 'a cinema ticket' },
  { name: 'a skateboard' }, { name: 'a jacket' }, { name: 'a board game' }, { name: 'a water bottle' },
  { name: 'a backpack' }, { name: 'a pair of headphones' }, { name: 'a cake' }, { name: 'a scooter' },
];

export const PLACES = ['Tbilisi', 'Batumi', 'Mtskheta', 'Kutaisi'];

/** Round away floating-point dust: 0.1 + 0.2 -> 0.3 */
export function clean(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Number of decimal places (counted exactly, not after rounding for display). */
export function decimals(n: number): number {
  const s = clean(n).toString();
  if (s.includes('e')) return 10;
  const i = s.indexOf('.');
  return i === -1 ? 0 : s.length - i - 1;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function simplify(num: number, den: number): [number, number] {
  const g = gcd(num, den) || 1;
  return [num / g, den / g];
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Steps for "p% of a" using the 10% / 1% method. Returns the steps and the value. */
export function pctOfSteps(p: number, a: number): { steps: string[]; value: number } {
  const value = clean((p * a) / 100);
  const ten = clean(a / 10);
  const one = clean(a / 100);
  const five = clean(ten / 2);
  const half = clean(a / 2);
  const quarter = clean(a / 4);
  const s: string[] = [];
  if (p === 50) {
    s.push(`50% is a half: 50% of ${fmt(a)} = ${fmt(a)} ÷ 2 = ${fmt(half)}`);
  } else if (p === 25) {
    s.push(`50% of ${fmt(a)} = ${fmt(a)} ÷ 2 = ${fmt(half)}`);
    s.push(`25% is half of 50%: 25% of ${fmt(a)} = ${fmt(half)} ÷ 2 = ${fmt(quarter)}`);
  } else if (p === 75) {
    s.push(`50% of ${fmt(a)} = ${fmt(half)}`);
    s.push(`25% of ${fmt(a)} = ${fmt(quarter)}`);
    s.push(`75% of ${fmt(a)} = ${fmt(half)} + ${fmt(quarter)} = ${fmt(value)}`);
  } else if (p % 10 === 0 && p <= 100) {
    s.push(`10% of ${fmt(a)} = ${fmt(a)} ÷ 10 = ${fmt(ten)}`);
    if (p !== 10) s.push(`${p}% of ${fmt(a)} = ${p / 10} × ${fmt(ten)} = ${fmt(value)}`);
  } else if (p === 5) {
    s.push(`10% of ${fmt(a)} = ${fmt(a)} ÷ 10 = ${fmt(ten)}`);
    s.push(`5% is half of 10%: 5% of ${fmt(a)} = ${fmt(ten)} ÷ 2 = ${fmt(five)}`);
  } else if (p % 5 === 0 && p < 100) {
    const tens = Math.floor(p / 10);
    s.push(`10% of ${fmt(a)} = ${fmt(a)} ÷ 10 = ${fmt(ten)}`);
    s.push(`5% of ${fmt(a)} = ${fmt(ten)} ÷ 2 = ${fmt(five)}`);
    s.push(`${p}% of ${fmt(a)} = ${tens} × ${fmt(ten)} + ${fmt(five)} = ${fmt(value)}`);
  } else if (p === 2.5) {
    s.push(`10% of ${fmt(a)} = ${fmt(ten)}`);
    s.push(`5% of ${fmt(a)} = ${fmt(five)}`);
    s.push(`2.5% is half of 5%: 2.5% of ${fmt(a)} = ${fmt(five)} ÷ 2 = ${fmt(value)}`);
  } else if (p === 12.5) {
    s.push(`25% of ${fmt(a)} = ${fmt(quarter)}`);
    s.push(`12.5% is half of 25%: 12.5% of ${fmt(a)} = ${fmt(quarter)} ÷ 2 = ${fmt(value)}`);
  } else if (p === 17.5) {
    s.push(`10% of ${fmt(a)} = ${fmt(ten)}`);
    s.push(`5% of ${fmt(a)} = ${fmt(five)}`);
    s.push(`2.5% of ${fmt(a)} = ${fmt(clean(five / 2))}`);
    s.push(`17.5% of ${fmt(a)} = ${fmt(ten)} + ${fmt(five)} + ${fmt(clean(five / 2))} = ${fmt(value)}`);
  } else if (p > 100 && p % 10 === 0) {
    s.push(`10% of ${fmt(a)} = ${fmt(ten)}`);
    s.push(`${p}% of ${fmt(a)} = ${p / 10} × ${fmt(ten)} = ${fmt(value)}`);
  } else {
    s.push(`1% of ${fmt(a)} = ${fmt(a)} ÷ 100 = ${fmt(one)}`);
    s.push(`${fmt(p)}% of ${fmt(a)} = ${fmt(p)} × ${fmt(one)} = ${fmt(value)}`);
  }
  return { steps: s, value };
}

/** Pick an element that passes a test; falls back to the first passing element in order. */
export function pickWhere<T>(rng: Rng, items: readonly T[], ok: (t: T) => boolean): T {
  const good = items.filter(ok);
  if (!good.length) throw new Error('pickWhere: nothing passes');
  return rng.pick(good);
}

export function shuffleChoices(rng: Rng, correct: string, wrong: string[]): { choices: string[]; correctIndex: number } {
  const choices = rng.shuffle([correct, ...wrong]);
  return { choices, correctIndex: choices.indexOf(correct) };
}

/** Pick from a list by any number (decimals and big numbers are fine). */
export function at<T>(items: readonly T[], n: number): T {
  return items[Math.floor(Math.abs(n)) % items.length];
}
