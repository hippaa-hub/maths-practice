import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { clean, decimals, fmt } from '../util';

const ID = 'surface-area';

export const surfaceArea: Skill = {
  id: ID,
  unit: 4,
  order: 0,
  title: 'Surface area of a cube and a box',
  short: 'Surface area',
  taught: true,
  prerequisites: [],
  variety: 15,
  explain: {
    sentences: [
      'The surface area is the total area of all the faces, like the amount of paper needed to wrap the shape.',
      'A cube has 6 identical square faces: surface area = 6 × (edge × edge).',
      'A box (rectangular prism) has 3 pairs of equal faces: top and bottom (l × w), front and back (l × h), two ends (w × h). Add the three, then double.',
      'For a 5 × 3 × 2 box: 15 + 10 + 6 = 31, and 2 × 31 = 62 cm².',
    ],
    rule: 'Cube: 6 × edge². Box: 2 × (l×w + l×h + w×h).',
    picture: { type: 'solid', kind: 'cuboid', dims: [5, 3, 2] },
  },
  examples: [
    { problem: 'Find the surface area of a cube with edges of 4 cm.', steps: ['One face: 4 × 4 = 16', 'Six faces: 6 × 16 = 96', 'So the surface area is 96 cm²'], answer: '96 cm²' },
    { problem: 'Find the surface area of a box 5 cm by 3 cm by 2 cm.', steps: ['Top and bottom: 5 × 3 = 15', 'Front and back: 5 × 2 = 10', 'Two ends: 3 × 2 = 6', 'Add the three: 15 + 10 + 6 = 31', 'Double it: 2 × 31 = 62', 'So the surface area is 62 cm²'], answer: '62 cm²' },
  ],
  faded: [
    { problem: 'Find the surface area of a cube with edges of 3 cm.', steps: [{ prompt: 'One face: 3 × 3 = ?', answer: { kind: 'number', value: 9 }, answerText: '9' }, { prompt: 'Six faces: 6 × 9 = ? cm²', answer: { kind: 'number', value: 54 }, answerText: '54 cm²' }] },
    { problem: 'Find the surface area of a box 4 cm by 2 cm by 1 cm.', steps: [{ prompt: '4 × 2 = ?', answer: { kind: 'number', value: 8 }, answerText: '8' }, { prompt: '4 × 1 = ?', answer: { kind: 'number', value: 4 }, answerText: '4' }, { prompt: '2 × 1 = ?', answer: { kind: 'number', value: 2 }, answerText: '2' }, { prompt: '2 × (8 + 4 + 2) = ? cm²', answer: { kind: 'number', value: 28 }, answerText: '28 cm²' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const unit = rng.pick(['cm', 'm']);
    if (level === 1) {
      const a = rng.int(2, 10);
      const sa = 6 * a * a;
      return { ...base, params: { l: a, w: a, h: a, kind: 0 }, text: `Find the surface area of a cube with edges of ${a} ${unit}.`, answer: { kind: 'number', value: sa }, answerText: `${sa} ${unit}²`, hint: 'A cube has 6 square faces. Find one face, then × 6.', steps: [`One face: ${a} × ${a} = ${a * a}`, `Six faces: 6 × ${a * a} = ${sa}`, `So the surface area is ${sa} ${unit}²`], picture: { type: 'solid', kind: 'cube', dims: [a, a, a], unit }, traps: [{ value: a * a, misconception: 'one-face' }, { value: a * a * a, misconception: 'volume', message: `${a * a * a} is the volume (edge³). Surface area adds the faces.` }, { value: 4 * a * a, misconception: 'four-faces' }].filter((t) => t.value !== sa) };
    }
    const l = level === 2 ? rng.int(3, 10) : rng.pick([2.5, 4, 5, 6, 7.5, 8, 10, 12]);
    const w = level === 2 ? rng.int(2, 6) : rng.pick([1.5, 2, 3, 4, 5, 6]);
    const h = level === 2 ? rng.int(1, 5) : rng.pick([1, 2, 2.5, 3, 4]);
    const lw = clean(l * w), lh = clean(l * h), wh = clean(w * h);
    const sa = clean(2 * (lw + lh + wh));
    if (decimals(sa) > 1) return this.generate(level, rng);
    const ctx = level === 3 ? rng.pick([`A gift box is ${fmt(l)} ${unit} long, ${fmt(w)} ${unit} wide and ${fmt(h)} ${unit} high. How much wrapping paper is needed to cover it exactly?`, `A water tank is ${fmt(l)} ${unit} by ${fmt(w)} ${unit} by ${fmt(h)} ${unit}. What is its total surface area?`]) : `Find the surface area of a box ${fmt(l)} ${unit} by ${fmt(w)} ${unit} by ${fmt(h)} ${unit}.`;
    return { ...base, params: { l, w, h, kind: 1 }, text: ctx, answer: { kind: 'number', value: sa }, answerText: `${fmt(sa)} ${unit}²`, hint: 'Three pairs of faces: l×w, l×h and w×h. Add them, then double.', steps: [`Top and bottom: ${fmt(l)} × ${fmt(w)} = ${fmt(lw)}`, `Front and back: ${fmt(l)} × ${fmt(h)} = ${fmt(lh)}`, `Two ends: ${fmt(w)} × ${fmt(h)} = ${fmt(wh)}`, `Add the three: ${fmt(lw)} + ${fmt(lh)} + ${fmt(wh)} = ${fmt(lw + lh + wh)}`, `Double it: 2 × ${fmt(lw + lh + wh)} = ${fmt(sa)}`, `So the surface area is ${fmt(sa)} ${unit}²`], picture: { type: 'solid', kind: 'cuboid', dims: [l, w, h], unit }, traps: [{ value: clean(lw + lh + wh), misconception: 'not-doubled', message: 'That is three faces. Each has a matching face: double it.' }, { value: clean(l * w * h), misconception: 'volume' }, { value: clean(6 * l * w), misconception: 'cube-formula' }].filter((t) => Math.abs(t.value - sa) > 1e-9) };
  },
  compute: ({ l, w, h, kind }) => (kind === 0 ? 6 * l * l : clean(2 * (l * w + l * h + w * h))),
  mistakes: [
    { problem: 'Find the surface area of a cube with edges of 5 cm.', steps: ['5 × 5 × 5 = 125', 'Surface area = 125 cm²'], wrongStep: 0, reason: '5 × 5 × 5 is the volume. Surface area is 6 faces of 5 × 5: 6 × 25 = 150 cm².', fixOptions: ['6 × (5 × 5) = 150 cm²', '5 × 5 × 5 = 125 cm²', '5 × 5 = 25 cm²'], correctFix: 0 },
    { problem: 'Find the surface area of a box 6 cm by 4 cm by 2 cm.', steps: ['6 × 4 = 24; 6 × 2 = 12; 4 × 2 = 8', '24 + 12 + 8 = 44', 'Surface area = 44 cm²'], wrongStep: 2, reason: 'Each of those faces has a matching one: 2 × 44 = 88 cm².', fixOptions: ['Double it: 2 × 44 = 88 cm²', 'Surface area = 44 cm²', 'Surface area = 44 cm³'], correctFix: 0 },
    { problem: 'Find the surface area of a box 3 cm by 3 cm by 10 cm.', steps: ['It is like a cube, so 6 × 3 × 3 = 54 cm²'], wrongStep: 0, reason: 'It is not a cube: faces are 3×3, 3×10 and 3×10. 2 × (9 + 30 + 30) = 138 cm².', fixOptions: ['2 × (3×3 + 3×10 + 3×10) = 138 cm²', '6 × 3 × 3 = 54 cm²', '3 × 3 × 10 = 90 cm²'], correctFix: 0 },
  ],
  misconceptions: {
    'one-face': 'That is one face. A cube has six.',
    volume: 'Multiplying all three lengths gives the volume, not the surface area.',
    'four-faces': 'A cube has six faces, including the top and bottom.',
    'not-doubled': 'Every face has a matching opposite face: double the sum.',
    'cube-formula': 'Only a cube has six equal faces. A box has three different pairs.',
  },
};
