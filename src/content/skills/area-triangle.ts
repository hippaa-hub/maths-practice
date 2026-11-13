import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { clean, decimals, fmt } from '../util';

const ID = 'area-triangle';

export const areaTriangle: Skill = {
  id: ID,
  unit: 4,
  order: 0,
  title: 'Area of a triangle',
  short: 'Triangle area',
  taught: true,
  prerequisites: [],
  explain: {
    sentences: [
      'A triangle is half of a rectangle with the same base and height.',
      'So area = ½ × base × height. The height is the straight-up distance from the base to the top corner, at right angles to the base.',
      'For base 10 cm and height 6 cm: ½ × 10 × 6 = 30 cm².',
      'Units matter: lengths in cm give an area in cm². Say the units in your answer.',
    ],
    rule: 'Area = ½ × base × height. The height must be at right angles to the base.',
    picture: { type: 'triangleArea', base: 10, height: 6 },
  },
  examples: [
    { problem: 'A triangle has base 10 cm and height 6 cm. Find its area.', steps: ['Area = ½ × base × height', '½ × 10 × 6 = 30', 'So the area is 30 cm²'], answer: '30 cm²' },
    { problem: 'A triangle has area 24 cm² and base 8 cm. Find its height.', steps: ['Area = ½ × base × height, so 24 = ½ × 8 × h', '½ × 8 = 4, so 24 = 4 × h', 'h = 24 ÷ 4 = 6', 'So the height is 6 cm'], answer: '6 cm' },
  ],
  faded: [
    { problem: 'A triangle has base 12 cm and height 5 cm. Find its area.', steps: [{ given: 'Area = ½ × base × height' }, { prompt: '12 × 5 = ?', answer: { kind: 'number', value: 60 }, answerText: '60' }, { prompt: 'Half of 60 = ? cm²', answer: { kind: 'number', value: 30 }, answerText: '30 cm²' }] },
    { problem: 'A triangle has area 20 cm² and height 4 cm. Find its base.', steps: [{ given: '20 = ½ × base × 4, so 20 = 2 × base' }, { prompt: 'base = 20 ÷ 2 = ?', answer: { kind: 'number', value: 10 }, answerText: '10 cm' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base0 = { skillId: ID, level };
    const unit = rng.pick(['cm', 'm', 'mm']);
    if (level === 3 && rng.chance(0.5)) {
      const b = rng.pick([4, 5, 6, 8, 10, 12, 15, 20]), h = rng.pick([3, 4, 5, 6, 7, 8, 9, 10]);
      const area = (b * h) / 2;
      const askHeight = rng.chance(0.5);
      const known = askHeight ? b : h, r = askHeight ? h : b;
      return { ...base0, params: { b, h, kind: askHeight ? 1 : 2 }, text: `A triangle has an area of ${area} ${unit}² and a ${askHeight ? 'base' : 'height'} of ${known} ${unit}. Find its ${askHeight ? 'height' : 'base'}.`, answer: { kind: 'number', value: r }, answerText: `${r} ${unit}`, hint: `Area = ½ × base × height. Put in what you know: ${area} = ½ × ${known} × ?`, steps: [`Area = ½ × base × height, so ${area} = ½ × ${known} × ?`, `½ × ${known} = ${known / 2}, so ${area} = ${known / 2} × ?`, `? = ${area} ÷ ${known / 2} = ${r}`, `So the ${askHeight ? 'height' : 'base'} is ${r} ${unit}`], picture: { type: 'triangleArea', base: askHeight ? b : 0, height: askHeight ? 0 : h, unit }, traps: [{ value: area / known, misconception: 'forgot-half', message: 'Remember the ½: area = ½ × base × height.' }, { value: area * 2 * known, misconception: 'multiplied' }].filter((t) => t.value !== r) };
    }
    const b = level === 1 ? rng.pick([4, 6, 8, 10, 12, 14]) : rng.pick([5, 7, 9, 11, 12, 15, 16, 18, 2.5, 3.5, 7.5]);
    const h = level === 1 ? rng.pick([3, 4, 5, 6, 7, 8]) : rng.pick([3, 4, 5, 6, 7, 8, 9, 10, 4.5, 6.5]);
    const area = clean((b * h) / 2);
    if (decimals(area) > 2) return this.generate(level, rng);
    const slant = level >= 2 ? rng.pick([h + 1, h + 2, h + 3]) : 0;
    const text = slant
      ? `A triangle has base ${fmt(b)} ${unit}, height ${fmt(h)} ${unit} and a sloping side of ${slant} ${unit}. Find its area.`
      : `A triangle has base ${fmt(b)} ${unit} and height ${fmt(h)} ${unit}. Find its area.`;
    return { ...base0, params: { b, h, kind: 0 }, text, answer: { kind: 'number', value: area }, answerText: `${fmt(area)} ${unit}²`, hint: 'Area = ½ × base × height. Use the height that is at right angles to the base, not the sloping side.', steps: ['Area = ½ × base × height', `½ × ${fmt(b)} × ${fmt(h)} = ${fmt(area)}`, `So the area is ${fmt(area)} ${unit}²`], picture: { type: 'triangleArea', base: b, height: h, unit }, traps: [{ value: clean(b * h), misconception: 'forgot-half', message: 'That is the area of the rectangle. A triangle is half of it.' }, ...(slant ? [{ value: clean((b * slant) / 2), misconception: 'slant', message: 'Use the height (at right angles to the base), not the sloping side.' }] : []), { value: clean(b + h), misconception: 'added' }].filter((t) => Math.abs(t.value - area) > 1e-9) };
  },
  compute: ({ b, h, kind }) => (kind === 0 ? clean((b * h) / 2) : kind === 1 ? h : b),
  mistakes: [
    { problem: 'A triangle has base 8 cm and height 5 cm. Find its area.', steps: ['Area = base × height', '8 × 5 = 40 cm²'], wrongStep: 0, reason: 'A triangle is HALF a rectangle: area = ½ × 8 × 5 = 20 cm².', fixOptions: ['Area = ½ × base × height = 20 cm²', 'Area = base × height = 40 cm²', 'Area = base + height = 13 cm²'], correctFix: 0 },
    { problem: 'A triangle has base 6 cm, height 4 cm and a sloping side of 5 cm. Find its area.', steps: ['Area = ½ × 6 × 5', '= 15 cm²'], wrongStep: 0, reason: 'Use the height at right angles to the base (4 cm), not the sloping side: ½ × 6 × 4 = 12 cm².', fixOptions: ['Area = ½ × 6 × 4 = 12 cm²', 'Area = ½ × 6 × 5 = 15 cm²', 'Area = ½ × 4 × 5 = 10 cm²'], correctFix: 0 },
    { problem: 'A triangle has base 10 cm and height 3 cm. Find its area.', steps: ['½ × 10 × 3 = 15', 'So the area is 15 cm'], wrongStep: 1, reason: 'Area is measured in square units: 15 cm².', fixOptions: ['So the area is 15 cm²', 'So the area is 15 cm', 'So the area is 15 cm³'], correctFix: 0 },
  ],
  misconceptions: {
    'forgot-half': 'A triangle is half of a rectangle: do not forget the ½.',
    slant: 'The height is at right angles to the base; the sloping side is not the height.',
    added: 'Area multiplies base and height; it does not add them.',
    multiplied: 'To find a missing length from the area, divide.',
  },
};
