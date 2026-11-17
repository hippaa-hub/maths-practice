import { describe, expect, it } from 'vitest';
import { pickFresh, remember, seenKey, SEEN_LIMIT } from './fresh';

describe('never the same question twice', () => {
  it('skips questions already seen and returns a new one', () => {
    const texts = ['a', 'a', 'b', 'c'];
    let i = 0;
    const seen = new Set([seenKey('s', 'a')]);
    const q = pickFresh(() => ({ skillId: 's', text: texts[i++] }), (k) => seen.has(k));
    expect(q.text).toBe('b');
  });
  it('falls back to the first candidate when every try is a repeat', () => {
    const seen = new Set([seenKey('s', 'only')]);
    const q = pickFresh(() => ({ skillId: 's', text: 'only' }), (k) => seen.has(k), 5);
    expect(q.text).toBe('only');
  });
  it('remembers keys without duplicates and keeps the list bounded', () => {
    let seen: string[] = [];
    seen = remember(seen, 'x'); seen = remember(seen, 'x'); seen = remember(seen, 'y');
    expect(seen).toEqual(['x', 'y']);
    for (let i = 0; i < SEEN_LIMIT + 10; i++) seen = remember(seen, `k${i}`);
    expect(seen.length).toBe(SEEN_LIMIT);
    expect(seen[0]).toBe('k10');
  });
});
