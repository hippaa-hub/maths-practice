import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { clean, decimals, fmt, shuffleChoices } from '../util';

const ID = 'scale-drawings';

export const scaleDrawings: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Scale drawings and map scales',
  short: 'Scale',
  taught: true,
  prerequisites: ['converting-units', 'ratio-equivalent'],
  explain: {
    sentences: [
      'A scale of 1:100 means 1 cm on the drawing is 100 cm in real life. The first number is the drawing, the second is real life.',
      'Drawing → real: multiply by the scale number. 5 cm on a 1:100 plan is 5 × 100 = 500 cm, which is 5 m.',
      'Real → drawing: divide by the scale number. A 3 km road on a 1:50 000 map: 3 km is 300 000 cm, and 300 000 ÷ 50 000 = 6 cm.',
      'Change the units at the end so the answer makes sense (cm for the map, m or km for real life).',
    ],
    rule: 'The map is small and real life is big. Map → real: multiply. Real → map: divide. Then fix the units.',
    picture: { type: 'doubleLine', top: { label: 'map (cm)', values: [1, 2, 4] }, bottom: { label: 'real (km)', values: [0.5, 1, 2] } },
  },
  examples: [
    {
      problem: 'On a plan with scale 1:100, a room is 5 cm long. How long is the real room, in metres?',
      steps: ['Plan → real: multiply by 100', '5 × 100 = 500', '500 cm is 500 ÷ 100 = 5 m', 'So the room is 5 m long.'],
      answer: '5 m',
    },
    {
      problem: 'A map has scale 1:50 000. Two villages are 4 cm apart on the map. How far apart are they really, in km?',
      steps: ['Map → real: multiply by 50000', '4 × 50000 = 200000', '200000 cm is 200000 ÷ 100000 = 2 km', 'So 2 km.'],
      answer: '2 km',
    },
  ],
  faded: [
    {
      problem: 'On a 1:200 plan, a garden is 8 cm long. What is the real length in metres?',
      steps: [
        { prompt: 'Plan → real: 8 × 200 = ? cm', answer: { kind: 'number', value: 1600 }, answerText: '1600' },
        { prompt: '1600 ÷ 100 = ? m', answer: { kind: 'number', value: 16 }, answerText: '16 m' },
      ],
    },
    {
      problem: 'A map scale is 1:25 000. A path is 2 km long. How long is it on the map, in cm?',
      steps: [
        { given: '2 km is 200000 cm' },
        { prompt: 'Real → map: 200000 ÷ 25000 = ? cm', answer: { kind: 'number', value: 8 }, answerText: '8 cm' },
      ],
    },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 1) {
      const scale = rng.pick([50, 100, 200]);
      const cm = rng.pick([2, 3, 4, 5, 6, 8, 10, 12]);
      const realCm = cm * scale;
      const m = realCm / 100;
      const thing = rng.pick(['a room', 'a classroom', 'a garden', 'a swimming pool', 'a car park']);
      return {
        ...base, params: { scale, map: cm, kind: 0 },
        text: `On a plan with scale 1:${scale}, ${thing} is ${cm} cm long. How long is it in real life, in metres?`,
        answer: { kind: 'number', value: m }, answerText: `${fmt(m)} m`,
        hint: `1 cm on the plan is ${scale} cm in real life. Multiply, then change cm to m.`,
        steps: [`Plan → real: multiply by ${scale}`, `${cm} × ${scale} = ${realCm}`, `${realCm} cm is ${realCm} ÷ 100 = ${fmt(m)} m`, `So ${fmt(m)} m.`],
        traps: [
          { value: realCm, misconception: 'units', message: `${realCm} is in cm. The question asks for metres: ÷ 100.` },
          { value: clean(cm / scale), misconception: 'wrong-way' },
          { value: cm * 100, misconception: 'wrong-scale' },
        ].filter((t) => Math.abs(t.value - m) > 1e-9),
      };
    }
    if (level === 3 && rng.chance(0.45)) {
      if (rng.chance(0.5)) {
        const km = rng.pick([1, 2, 5, 10, 0.5]), cm = rng.pick([1, 2, 4, 5]);
        const n = (km * 100000) / cm;
        return { ...base, params: { scale: n, map: 0, kind: 3 }, text: `On a map, ${cm} cm represents ${fmt(km)} km. Write the scale in the form 1:n.`, answer: { kind: 'number', value: n }, answerText: `${n} (the scale is 1:${n.toLocaleString('en-GB').replace(/,/g, ' ')})`, hint: `Same units first: change ${fmt(km)} km into cm. Then divide both sides by ${cm}.`, steps: [`Same units first: ${fmt(km)} km is ${fmt(km)} × 100000 = ${km * 100000} cm`, `So ${cm} cm : ${km * 100000} cm`, `Divide both by ${cm}: 1 : ${n}`, `The scale is 1:${n}`], traps: [{ value: km / cm, misconception: 'units', message: 'Both sides of a scale must be in the same unit: change km to cm first.' }, { value: km * 1000 / cm, misconception: 'units', message: 'There are 100 000 cm in a km, not 1000.' }].filter((t) => Math.abs(t.value - n) > 1e-9) };
      }
      const real = rng.pick([20, 30, 40, 50, 60, 80, 100]), paper = rng.pick([20, 25, 30, 40]);
      const need = (real * 100) / paper;
      const options = [50, 100, 200, 250, 500, 1000];
      const best = options.find((o) => o >= need)!;
      const correct = `1:${best}`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, options.filter((o) => o !== best).slice(0, 3).map((o) => `1:${o}`).slice(0, 2));
      return { ...base, params: { scale: best, map: 0, kind: 4 }, text: `A field is ${real} m long and must fit on a sheet of paper ${paper} cm wide. Which scale gives the largest drawing that still fits?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: `Same units first: ${real} m is ${real * 100} cm. The drawing must be at most ${paper} cm.`, steps: [`${real} m is ${real * 100} cm`, `The drawing can be at most ${paper} cm: ${real * 100} ÷ ${paper} = ${fmt(need)}, so the scale must be at least 1:${fmt(need)}`, `The smallest scale from the choices that is at least 1:${fmt(need)} is ${correct}, giving a drawing of ${fmt((real * 100) / best)} cm`], choices, traps: [] };
    }
    const scale = rng.pick(level === 2 ? [25000, 50000, 100000] : [20000, 25000, 40000, 50000, 200000]);
    const toReal = level === 2 ? true : rng.chance(0.5);
    let cm = 4, km = 2;
    for (let tries = 0; tries < 50; tries++) {
      cm = rng.pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 1.5, 2.5]);
      km = clean((cm * scale) / 100000);
      if (decimals(km) <= 1) break;
    }
    const place = rng.pick(['Two villages', 'The school and the stadium', 'Two metro stations', 'The lake and the campsite']);
    if (toReal) {
      return {
        ...base, params: { scale, map: cm, kind: 1 },
        text: `A map has scale 1:${scale.toLocaleString('en-GB').replace(/,/g, ' ')}. ${place} are ${fmt(cm)} cm apart on the map. How far apart are they in real life, in km?`,
        answer: { kind: 'number', value: km }, answerText: `${fmt(km)} km`,
        hint: `Multiply by ${scale} to get cm, then divide by 100 000 to get km.`,
        steps: [`Map → real: multiply by ${scale}`, `${fmt(cm)} × ${scale} = ${cm * scale}`, `${cm * scale} cm is ${cm * scale} ÷ 100000 = ${fmt(km)} km`, `So ${fmt(km)} km.`],
        picture: { type: 'doubleLine', top: { label: 'map (cm)', values: [1, cm] }, bottom: { label: 'real (km)', values: [clean(scale / 100000), km] } },
        traps: [
          { value: cm * scale, misconception: 'units', message: `${cm * scale} is in cm. For km, divide by 100 000.` },
          { value: clean((cm * scale) / 1000), misconception: 'units', message: 'There are 100 000 cm in a km (100 × 1000).' },
          { value: clean((cm * scale) / 100), misconception: 'units' },
        ].filter((t) => Math.abs(t.value - km) > 1e-9),
      };
    }
    return {
      ...base, params: { scale, map: cm, kind: 2 },
      text: `A map has scale 1:${scale.toLocaleString('en-GB').replace(/,/g, ' ')}. ${place} are ${fmt(km)} km apart in real life. How far apart are they on the map, in cm?`,
      answer: { kind: 'number', value: cm }, answerText: `${fmt(cm)} cm`,
      hint: `Change ${fmt(km)} km into cm first (× 100 000), then divide by ${scale}.`,
      steps: [`${fmt(km)} km is ${fmt(km)} × 100000 = ${km * 100000} cm`, `Real → map: divide by ${scale}`, `${km * 100000} ÷ ${scale} = ${fmt(cm)}`, `So ${fmt(cm)} cm on the map.`],
      traps: [
        { value: clean(km * scale), misconception: 'wrong-way', message: 'Real → map means the number gets smaller: divide by the scale.' },
        { value: clean((km * 1000) / scale), misconception: 'units', message: 'Change km into cm (× 100 000) before dividing.' },
      ].filter((t) => Math.abs(t.value - cm) > 1e-9),
    };
  },
  compute: ({ scale, map, kind }) => (kind === 0 ? (map * scale) / 100 : kind === 1 ? clean((map * scale) / 100000) : kind === 3 ? scale : kind === 4 ? 0 : map),
  mistakes: [
    {
      problem: 'A plan has scale 1:50. A table is 3 cm long on the plan. How long is it really?',
      steps: ['Plan → real: divide by 50', '3 ÷ 50 = 0.06 cm'],
      wrongStep: 0,
      reason: 'Real life is bigger than the plan, so MULTIPLY: 3 × 50 = 150 cm = 1.5 m.',
      fixOptions: ['Plan → real: multiply by 50: 3 × 50 = 150 cm', 'Plan → real: divide by 50', 'Plan → real: add 50'],
      correctFix: 0,
    },
    {
      problem: 'A map scale is 1:100 000. Two towns are 6 cm apart on the map. How far apart are they in km?',
      steps: ['6 × 100000 = 600000', '600000 cm is 600 km'],
      wrongStep: 1,
      reason: 'There are 100 000 cm in a km: 600000 ÷ 100000 = 6 km.',
      fixOptions: ['600000 ÷ 100000 = 6 km', '600000 cm is 600 km', '600000 cm is 60 km'],
      correctFix: 0,
    },
    {
      problem: 'A map scale is 1:25 000. A road is 5 km long. How long is it on the map?',
      steps: ['5 ÷ 25000 = 0.0002 cm'],
      wrongStep: 0,
      reason: 'Change km to cm first: 5 km is 500 000 cm, then 500000 ÷ 25000 = 20 cm.',
      fixOptions: ['5 km is 500000 cm; 500000 ÷ 25000 = 20 cm', '5 ÷ 25000 = 0.0002 cm', '5 × 25000 = 125000 cm'],
      correctFix: 0,
    },
  ],
  misconceptions: {
    'wrong-way': 'Map → real: multiply. Real → map: divide.',
    units: 'Fix the units: 100 cm in a metre, 100 000 cm in a km.',
    'wrong-scale': 'Use the scale number in the question, not 100 every time.',
  },
};
