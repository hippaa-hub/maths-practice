import { describe, expect, it } from 'vitest';
import { checkAnswer, fmt, parseTyped, type AnswerSpec } from './answers';

describe('parseTyped', () => {
  it('reads plain numbers, decimals and negatives', () => {
    expect(parseTyped('24')?.value).toBe(24);
    expect(parseTyped(' 2.5 ')?.value).toBe(2.5);
    expect(parseTyped('.5')?.value).toBe(0.5);
    expect(parseTyped('-3')?.value).toBe(-3);
    expect(parseTyped('1,5')?.value).toBe(1.5);
  });
  it('reads fractions and mixed numbers', () => {
    expect(parseTyped('1/2')).toEqual({ value: 0.5, form: 'fraction' });
    expect(parseTyped('7/20')?.value).toBeCloseTo(0.35);
    expect(parseTyped('1 1/2')?.value).toBe(1.5);
    expect(parseTyped('1/0')).toBeNull();
  });
  it('ignores spaces and units typed after the number', () => {
    expect(parseTyped('24 GEL')?.value).toBe(24);
    expect(parseTyped('24gel')?.value).toBe(24);
    expect(parseTyped('40 %')).toEqual({ value: 40, form: 'percent' });
    expect(parseTyped('12 km')?.value).toBe(12);
  });
  it('rejects words', () => {
    expect(parseTyped('twenty')).toBeNull();
    expect(parseTyped('')).toBeNull();
    expect(parseTyped('2x')).toBeNull();
  });
});

describe('checkAnswer', () => {
  it('money answers accept equal values with or without units', () => {
    const spec = { kind: 'money', value: 24 } as const;
    expect(checkAnswer('24', spec)).toBe(true);
    expect(checkAnswer('24.0 GEL', spec)).toBe(true);
    expect(checkAnswer('24%', spec)).toBe(false);
    expect(checkAnswer('42', spec)).toBe(false);
  });
  it('percent answers accept 50 and 50%, and 0.5 or 1/2 only when allowed', () => {
    expect(checkAnswer('50', { kind: 'percent', value: 50 })).toBe(true);
    expect(checkAnswer('50%', { kind: 'percent', value: 50 })).toBe(true);
    expect(checkAnswer('0.5', { kind: 'percent', value: 50 })).toBe(false);
    expect(checkAnswer('0.5', { kind: 'percent', value: 50, acceptEquivalents: true })).toBe(true);
    expect(checkAnswer('.5', { kind: 'percent', value: 50, acceptEquivalents: true })).toBe(true);
    expect(checkAnswer('1/2', { kind: 'percent', value: 50, acceptEquivalents: true })).toBe(true);
    expect(checkAnswer('5', { kind: 'percent', value: 50, acceptEquivalents: true })).toBe(false);
  });
  it('fraction answers accept any equal fraction or decimal', () => {
    const spec = { kind: 'fraction', value: 0.35, acceptEquivalents: true } as const;
    expect(checkAnswer('7/20', spec)).toBe(true);
    expect(checkAnswer('35/100', spec)).toBe(true);
    expect(checkAnswer('0.35', spec)).toBe(true);
    expect(checkAnswer('35%', spec)).toBe(true);
    expect(checkAnswer('3/5', spec)).toBe(false);
  });
  it('ratio answers accept 3:4 and 3 : 4; equivalent ratios only when allowed', () => {
    const spec: AnswerSpec = { kind: 'ratio', value: 0.75, ratio: [3, 4] };
    expect(checkAnswer('3:4', spec)).toBe(true);
    expect(checkAnswer('3 : 4', spec)).toBe(true);
    expect(checkAnswer('4:3', spec)).toBe(false);
    expect(checkAnswer('6:8', spec)).toBe(false);
    expect(checkAnswer('6:8', { ...spec, acceptEquivalents: true })).toBe(true);
    expect(checkAnswer('3:4:5', spec)).toBe(false);
    expect(checkAnswer('3', spec)).toBe(false);
    expect(checkAnswer('2:3:5', { kind: 'ratio', value: 0, ratio: [2, 3, 5] })).toBe(true);
  });
  it('formula answers accept any equivalent form', () => {
    const spec = { kind: 'expression', value: 23, expression: '3n + 2' } as const;
    expect(checkAnswer('3n+2', spec)).toBe(true);
    expect(checkAnswer('2 + 3n', spec)).toBe(true);
    expect(checkAnswer('3×n+2', spec)).toBe(true);
    expect(checkAnswer('3*n + 2', spec)).toBe(true);
    expect(checkAnswer('n+n+n+2', spec)).toBe(true);
    expect(checkAnswer('3n+1', spec)).toBe(false);
    expect(checkAnswer('3n', spec)).toBe(false);
    expect(checkAnswer('hello', spec)).toBe(false);
    expect(checkAnswer('n^2', { kind: 'expression', value: 0, expression: 'n²' })).toBe(true);
    expect(checkAnswer('n(n+1)', { kind: 'expression', value: 0, expression: 'n^2 + n' })).toBe(true);
  });
  it('choice answers compare the option index', () => {
    expect(checkAnswer('2', { kind: 'choice', value: 0, choice: 2 })).toBe(true);
    expect(checkAnswer('1', { kind: 'choice', value: 0, choice: 2 })).toBe(false);
  });
});

describe('fmt', () => {
  it('shows clean numbers', () => {
    expect(fmt(24)).toBe('24');
    expect(fmt(2.5)).toBe('2.5');
    expect(fmt(0.1 + 0.2)).toBe('0.3');
    expect(fmt(12.345)).toBe('12.345');
    expect(fmt(0.375)).toBe('0.375');
    expect(fmt(0.0625)).toBe('0.0625');
  });
});
