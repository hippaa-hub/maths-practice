/** Checking typed answers. Accepts equivalent forms where the question allows. */

import { sameExpression } from './expr';

export type AnswerKind = 'number' | 'percent' | 'money' | 'fraction' | 'choice' | 'ratio' | 'expression';

export interface AnswerSpec {
  kind: AnswerKind;
  /** The numeric answer. For 'percent' this is the percent number (50 for 50%). */
  value: number;
  /** For 'choice' questions: the index of the correct option. */
  choice?: number;
  /** For 'ratio' questions: the parts, e.g. [3, 4] for 3:4. */
  ratio?: number[];
  /** For 'expression' questions: the rule, e.g. "3n + 2". Any equivalent form is accepted. */
  expression?: string;
  /** Letters the keypad should offer for an expression answer (default ['n']). */
  letters?: string[];
  /** Let 0.5, .5 or 1/2 count for a 50% answer (and 50% for a 0.5 answer). */
  acceptEquivalents?: boolean;
  /** For 'fraction': the answer must be typed exactly as this simplest form, e.g. [3, 4]. */
  simplest?: boolean;
  tolerance?: number;
}

export interface Parsed {
  value: number;
  form: 'decimal' | 'fraction' | 'percent';
}

/** Turn what she typed into a number. Returns null when it is not a number. */
export function parseTyped(raw: string): Parsed | null {
  let s = raw.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^(gel|₾|\$|£|€)\s*/i, '');
  let isPercent = false;
  // Strip trailing units repeatedly ("24 GEL", "40 %").
  for (let i = 0; i < 3; i++) {
    const m = s.match(/\s*(gel|lari|₾|km\/h|m\/s|km|cm|mm|m|kg|g|ml|litres?|liters?|l|hours?|hrs?|h|minutes?|mins?|min|seconds?|secs?|s|marks?|points?|people|students?|sticks?|tiles?|dots?|squares?|°c|°|degrees?|percent|%)$/i);
    if (!m) break;
    if (m[1] === '%' || m[1] === 'percent') isPercent = true;
    s = s.slice(0, s.length - m[0].length).trim();
  }
  s = s.replace(/\s+/g, ' ').replace(/−/g, '-');
  // Mixed number: "1 1/2"
  const mixed = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1;
    const den = Number(mixed[4]);
    if (den === 0) return null;
    return { value: sign * (Number(mixed[2]) + Number(mixed[3]) / den), form: 'fraction' };
  }
  s = s.replace(/ /g, '');
  const frac = s.match(/^(-?\d+(?:[.,]\d+)?)\/(\d+(?:[.,]\d+)?)$/);
  if (frac) {
    const den = Number(frac[2].replace(',', '.'));
    if (den === 0) return null;
    return { value: Number(frac[1].replace(',', '.')) / den, form: isPercent ? 'percent' : 'fraction' };
  }
  // Decimal comma ("1,5") is allowed when there is no dot.
  if (!s.includes('.') && (s.match(/,/g) ?? []).length === 1) s = s.replace(',', '.');
  s = s.replace(/,/g, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return { value: Number(s), form: isPercent ? 'percent' : 'decimal' };
}

/** Reads "3:4", "3 : 4" or "3/4" (when ratios are expected) as a list of parts. */
export function parseRatio(raw: string): number[] | null {
  const parts = raw.trim().replace(/\s+/g, '').split(/[:/]/);
  if (parts.length < 2) return null;
  const nums = parts.map((p) => (/^\d+(\.\d+)?$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => !Number.isFinite(n))) return null;
  return nums;
}

function gcdAll(nums: number[]): number {
  const g = (a: number, b: number): number => (b ? g(b, a % b) : a);
  return nums.reduce((acc, n) => g(acc, n), 0);
}

export function checkAnswer(raw: string, spec: AnswerSpec): boolean {
  if (spec.kind === 'choice') return Number(raw) === spec.choice;
  if (spec.kind === 'ratio') {
    const typed = parseRatio(raw);
    const want = spec.ratio ?? [];
    if (!typed || typed.length !== want.length) return false;
    if (typed.every((n, i) => n === want[i])) return true;
    if (!spec.acceptEquivalents) return false;
    if (!typed.every(Number.isInteger)) return false;
    const g = gcdAll(typed);
    return g > 0 && typed.every((n, i) => n / g === want[i]);
  }
  if (spec.kind === 'expression') {
    return !!spec.expression && sameExpression(raw, spec.expression);
  }
  if (spec.kind === 'fraction' && spec.simplest) {
    const want = spec.ratio ?? [];
    // A mixed number like "4 1/4" counts when it equals the simplest improper fraction.
    const mixed = raw.trim().match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) {
      const w = Number(mixed[2]), a = Number(mixed[3]), b = Number(mixed[4]);
      if (b === 0 || a >= b || gcdAll([a, b]) !== 1) return false;
      const num = (mixed[1] === '-' ? -1 : 1) * (w * b + a);
      return num === want[0] && b === want[1];
    }
    const typed = parseRatio(raw);
    if (typed) return typed.length === 2 && typed[0] === want[0] && typed[1] === want[1];
    // A whole-number answer (3/1) may be typed as "3".
    const n = parseTyped(raw);
    return want[1] === 1 && !!n && n.form === 'decimal' && n.value === want[0];
  }
  const parsed = parseTyped(raw);
  if (!parsed) return false;
  const tol = spec.tolerance ?? 1e-6;
  const eq = (a: number, b: number) => Math.abs(a - b) < tol;

  if (spec.kind === 'percent') {
    if (parsed.form === 'percent' || parsed.form === 'decimal') {
      if (eq(parsed.value, spec.value)) return true;
    }
    if (spec.acceptEquivalents && parsed.form !== 'percent' && eq(parsed.value * 100, spec.value)) return true;
    return false;
  }

  // number, money, fraction: compare values; a % sign is only right when equivalents are allowed.
  if (parsed.form === 'percent') {
    return !!spec.acceptEquivalents && eq(parsed.value / 100, spec.value);
  }
  return eq(parsed.value, spec.value);
}

/** Pretty number: up to 4 decimals, no trailing zeros. */
export function fmt(n: number): string {
  const r = Math.round(n * 10000) / 10000;
  return Number.isInteger(r) ? String(r) : String(r).replace(/\.?0+$/, '');
}

export function gel(n: number): string {
  return `${fmt(n)} GEL`;
}
