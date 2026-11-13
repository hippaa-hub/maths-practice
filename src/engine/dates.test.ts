import { describe, expect, it } from 'vitest';
import { addDays, dateKeyOf, daysBetween, weekStart } from './dates';

describe('learning day', () => {
  it('starts at 04:00 local time', () => {
    expect(dateKeyOf(new Date(2026, 10, 12, 3, 59))).toBe('2026-11-11');
    expect(dateKeyOf(new Date(2026, 10, 12, 4, 0))).toBe('2026-11-12');
    expect(dateKeyOf(new Date(2026, 10, 12, 23, 30))).toBe('2026-11-12');
  });
  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-11-12', '2026-11-28')).toBe(16);
  });
  it('finds the Monday that starts a week', () => {
    expect(weekStart('2026-11-12')).toBe('2026-11-09'); // Thursday -> Monday
    expect(weekStart('2026-11-15')).toBe('2026-11-09'); // Sunday -> previous Monday
    expect(weekStart('2026-11-09')).toBe('2026-11-09');
  });
});
