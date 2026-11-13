/**
 * Evaluates a simple algebra expression such as "3n + 2", "2(n+1)", "n^2 - 1" or "7a + b".
 * Letters are variables; `env` gives their values (a lone `n` argument is a shortcut for {n}).
 * Returns null when the text is not an expression it understands.
 */
type Tok = { t: 'num'; v: number } | { t: 'var'; v: string } | { t: 'op'; v: string } | { t: '(' } | { t: ')' };

function tokenize(src: string): Tok[] | null {
  const s = src.toLowerCase().replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/²/g, '^2').replace(/³/g, '^3');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const m = s.slice(i).match(/^(\d+(?:\.\d+)?|\.\d+)/);
    if (m) { out.push({ t: 'num', v: Number(m[1]) }); i += m[0].length; continue; }
    if (/[a-z]/.test(c)) { out.push({ t: 'var', v: c }); i++; continue; }
    if ('+-*/^'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(') { out.push({ t: '(' }); i++; continue; }
    if (c === ')') { out.push({ t: ')' }); i++; continue; }
    return null;
  }
  return out;
}

export type Env = Record<string, number>;

export function evaluateWith(src: string, env: Env): number | null {
  const toks = tokenize(src);
  if (!toks || toks.length === 0) return null;
  let pos = 0;
  const peek = () => toks[pos];
  const startsFactor = (t: Tok | undefined) => !!t && (t.t === 'num' || t.t === 'var' || t.t === '(');

  const expr = (): number | null => {
    let left = term();
    if (left === null) return null;
    while (peek()?.t === 'op' && ((peek() as { v: string }).v === '+' || (peek() as { v: string }).v === '-')) {
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
    for (;;) {
      const t = peek();
      if (t?.t === 'op' && (t.v === '*' || t.v === '/')) {
        pos++;
        const right = power();
        if (right === null) return null;
        left = t.v === '*' ? left * right : left / right;
      } else if (startsFactor(t)) {
        const right = power();
        if (right === null) return null;
        left = left * right;
      } else break;
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
    const t = toks[pos];
    if (!t) return null;
    if (t.t === 'num') { pos++; return t.v; }
    if (t.t === 'var') { pos++; return env[t.v] ?? 0; }
    if (t.t === 'op' && t.v === '-') { pos++; const f = power(); return f === null ? null : -f; }
    if (t.t === '(') {
      pos++;
      const v = expr();
      if (v === null || toks[pos]?.t !== ')') return null;
      pos++;
      return v;
    }
    return null;
  };
  const v = expr();
  if (v === null || pos !== toks.length || !Number.isFinite(v)) return null;
  return v;
}

export function evaluateExpr(src: string, n: number): number | null {
  return evaluateWith(src, { n });
}

const PROBES: Env[] = [
  { n: 1, a: 2, b: 3, x: 5, y: 7, p: 11, q: 13, m: 17, k: 19, c: 23 },
  { n: 2, a: 3, b: 5, x: 7, y: 11, p: 13, q: 17, m: 19, k: 23, c: 29 },
  { n: 3, a: 5, b: 2, x: 11, y: 3, p: 17, q: 7, m: 23, k: 13, c: 31 },
  { n: 4, a: 7, b: 11, x: 2, y: 13, p: 3, q: 5, m: 29, k: 31, c: 37 },
  { n: 5, a: 11, b: 7, x: 13, y: 2, p: 5, q: 3, m: 31, k: 37, c: 41 },
  { n: 6, a: 13, b: 17, x: 3, y: 5, p: 7, q: 11, m: 37, k: 41, c: 43 },
];

/** Two expressions are the same rule when they agree on six sets of values. */
export function sameExpression(a: string, b: string): boolean {
  for (const env of PROBES) {
    const x = evaluateWith(a, env);
    const y = evaluateWith(b, env);
    if (x === null || y === null || Math.abs(x - y) > 1e-9) return false;
  }
  return true;
}
