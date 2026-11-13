/**
 * Checks the arithmetic inside a worked step. A step like "30% of 80 = 3 × 8 = 24" is split on
 * "=" and every side that is pure arithmetic must come to the same value. Sides with words are
 * ignored, so "Original price = 0.5 × 100 = 50 GEL" checks only the last two sides.
 */

const UNITS = /\b(gel|lari|km\/h|m\/s|km|cm|mm|kg|g|ml|litres?|l|hours?|h|minutes?|mins?|min|seconds?|m|marks?|points?|students?|people|sticks?|tiles?|dots?|squares?|degrees?)[²³]?(?![a-z])/gi;

type Tok = { t: 'num'; v: number } | { t: 'op'; v: string } | { t: '('; } | { t: ')' };

function tokenize(side: string): Tok[] | null {
  const s = side.replace(UNITS, ' ').replace(/₾|°c|°/gi, ' ').replace(/\bof\b/gi, '×').replace(/²/g, '^2').trim();
  if (!s) return null;
  if (/[a-z]/i.test(s)) return null; // words -> not arithmetic
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    const m = s.slice(i).match(/^(\d+(?:\.\d+)?|\.\d+)(%?)/);
    if (m) {
      let v = Number(m[1]);
      if (m[2]) v /= 100;
      out.push({ t: 'num', v });
      i += m[0].length;
      continue;
    }
    if ('+−-×*÷/^'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(') { out.push({ t: '(' }); i++; continue; }
    if (c === ')') { out.push({ t: ')' }); i++; continue; }
    return null;
  }
  return out;
}

function evaluate(toks: Tok[]): number | null {
  let pos = 0;
  const peek = () => toks[pos];
  const expr = (): number | null => {
    let left = term();
    if (left === null) return null;
    while (peek()?.t === 'op' && ['+', '−', '-'].includes((peek() as { v: string }).v)) {
      const op = (toks[pos++] as { v: string }).v;
      const right = term();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };
  const term = (): number | null => {
    let left = power();
    if (left === null) return null;
    while (peek()?.t === 'op' && ['×', '*', '÷', '/'].includes((peek() as { v: string }).v)) {
      const op = (toks[pos++] as { v: string }).v;
      const right = power();
      if (right === null) return null;
      left = op === '×' || op === '*' ? left * right : left / right;
    }
    return left;
  };
  const power = (): number | null => {
    const base = factor();
    if (base === null) return null;
    if (peek()?.t === 'op' && (peek() as { v: string }).v === '^') {
      pos++;
      const e = factor();
      if (e === null) return null;
      return Math.pow(base, e);
    }
    return base;
  };
  const factor = (): number | null => {
    const tok = toks[pos];
    if (!tok) return null;
    if (tok.t === 'num') { pos++; return tok.v; }
    if (tok.t === 'op' && (tok.v === '-' || tok.v === '−')) { pos++; const f = factor(); return f === null ? null : -f; }
    if (tok.t === '(') {
      pos++;
      const v = expr();
      if (v === null || toks[pos]?.t !== ')') return null;
      pos++;
      return v;
    }
    return null;
  };
  const v = expr();
  if (v === null || pos !== toks.length) return null;
  return v;
}

export interface StepCheck { ok: boolean; values: number[]; detail?: string }

export function checkStepArithmetic(step: string): StepCheck {
  // A step may hold several clauses: "100% − 20% = 80%, so 40 is 80%; 1% = 40 ÷ 80 = 0.5".
  // Each clause is checked on its own.
  const clauses = step.split(/;|, so |, and |, then |\. /);
  const all: number[] = [];
  for (const clause of clauses) {
    if (!clause.includes('=')) continue;
    const values: number[] = [];
    for (const side of clause.split('=')) {
      const toks = tokenize(side);
      if (!toks) continue;
      const v = evaluate(toks);
      if (v === null) continue;
      values.push(v);
    }
    for (let i = 1; i < values.length; i++) {
      if (Math.abs(values[i] - values[0]) > 1e-6) {
        return { ok: false, values, detail: `"${step}" -> ${values.map((v) => +v.toFixed(6)).join(' vs ')}` };
      }
    }
    all.push(...values);
  }
  return { ok: true, values: all };
}
