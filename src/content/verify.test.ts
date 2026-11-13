import { describe, expect, it } from 'vitest';
import { checkStepArithmetic } from './verify';

describe('checkStepArithmetic', () => {
  it('accepts correct arithmetic in several forms', () => {
    expect(checkStepArithmetic('30% of 80 = 3 × 8 = 24').ok).toBe(true);
    expect(checkStepArithmetic('10% of 80 = 80 ÷ 10 = 8').ok).toBe(true);
    expect(checkStepArithmetic('100% − 20% = 80%').ok).toBe(true);
    expect(checkStepArithmetic('Original price = 0.5 × 100 = 50 GEL').ok).toBe(true);
    expect(checkStepArithmetic('(50 − 40) ÷ 40 × 100 = 25').ok).toBe(true);
    expect(checkStepArithmetic('So 18 out of 20 is 90%.').ok).toBe(true);
    expect(checkStepArithmetic('18 ÷ 20 = 0.9').ok).toBe(true);
  });
  it('catches wrong arithmetic', () => {
    expect(checkStepArithmetic('30% of 80 = 3 × 8 = 28').ok).toBe(false);
    expect(checkStepArithmetic('10% of 80 = 80 ÷ 10 = 0.8').ok).toBe(false);
    expect(checkStepArithmetic('40 × 1.2 = 50').ok).toBe(false);
  });
  it('ignores sides with words', () => {
    const r = checkStepArithmetic('Change = new − old = 10 − 8 = 2');
    expect(r.ok).toBe(true);
    expect(r.values).toEqual([2, 2]);
  });
});
