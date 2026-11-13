import { describe, expect, it } from 'vitest';
import { lolaComment } from './comments';
import type { SessionSummary } from './runtime';

const base: SessionSummary = { stronger: [], weaker: [], newlyLearned: [], checked: [], answered: 5, correct: 4, stateAfter: {} };
const t = (id: string) => `T(${id})`;

describe('lolaComment', () => {
  it('names the corrected mistake first', () => {
    expect(lolaComment({ ...base, stronger: ['a'] }, t, ['b'])).toContain('T(b)');
  });
  it('names the skill that moved up and its new state', () => {
    expect(lolaComment({ ...base, stronger: ['a'], stateAfter: { a: 'strong' } }, t, [])).toBe('T(a) moved up to "strong". It comes back in a few days to make sure.');
  });
  it('never gives generic praise', () => {
    for (const s of [base, { ...base, weaker: ['x'] }, { ...base, checked: ['c'] }, { ...base, newlyLearned: ['n'] }]) {
      expect(lolaComment(s, t, [])).not.toMatch(/great job|well done|awesome/i);
    }
  });
});
