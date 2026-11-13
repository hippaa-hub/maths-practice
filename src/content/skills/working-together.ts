import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { shuffleChoices } from '../util';

const ID = 'working-together';

export const workingTogether: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Working together: two taps',
  short: 'Two taps',
  taught: true,
  prerequisites: ['unit-rates-best-buy'],
  explain: {
    sentences: [
      'When two taps fill a tank together, ADD THE RATES (litres per minute), not the times.',
      'Tap A fills 3 L per minute and tap B 2 L per minute: together they fill 5 L per minute, so a 100 L tank takes 100 ÷ 5 = 20 minutes.',
      'If you are given times instead, find each rate first: a tap that fills 60 L in 20 minutes runs at 60 ÷ 20 = 3 L per minute.',
      'Two taps together are always faster than the faster tap alone, so the answer must be smaller than both times.',
    ],
    rule: 'Two taps: add the rates, not the times. Rate = amount ÷ time; time = amount ÷ rate.',
    picture: { type: 'doubleLine', top: { label: 'tap A (L/min)', values: [3] }, bottom: { label: 'tap B (L/min)', values: [2] } },
  },
  examples: [
    { problem: 'Tap A fills 3 L per minute and tap B 2 L per minute. How long do they take together to fill a 100 L tank?', steps: ['Add the rates: 3 + 2 = 5 L per minute', 'Time = amount ÷ rate: 100 ÷ 5 = 20', 'So 20 minutes'], answer: '20 minutes' },
    { problem: 'Tap A fills a 60 L tank in 20 minutes; tap B fills it in 30 minutes. How long together?', steps: ['Rate of A: 60 ÷ 20 = 3 L per minute', 'Rate of B: 60 ÷ 30 = 2 L per minute', 'Together: 3 + 2 = 5 L per minute', 'Time: 60 ÷ 5 = 12 minutes'], answer: '12 minutes' },
  ],
  faded: [
    { problem: 'Tap A fills 4 L per minute, tap B 6 L per minute. Time to fill 200 L together?', steps: [{ prompt: 'Add the rates: 4 + 6 = ?', answer: { kind: 'number', value: 10 }, answerText: '10' }, { prompt: '200 ÷ 10 = ? minutes', answer: { kind: 'number', value: 20 }, answerText: '20 minutes' }] },
    { problem: 'Tap A fills a 120 L tank in 30 min, tap B in 20 min. Time together?', steps: [{ prompt: 'Rate of A: 120 ÷ 30 = ?', answer: { kind: 'number', value: 4 }, answerText: '4' }, { prompt: 'Rate of B: 120 ÷ 20 = ?', answer: { kind: 'number', value: 6 }, answerText: '6' }, { prompt: 'Together 10 L/min: 120 ÷ 10 = ? minutes', answer: { kind: 'number', value: 12 }, answerText: '12 minutes' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    if (level === 3 && rng.chance(0.35)) {
      const ta = rng.pick([10, 20, 30]), tb = rng.pick([15, 30, 60]);
      const correct = `No. Together they are faster than either tap alone, so the time must be LESS than ${Math.min(ta, tb)} minutes. Add the rates, not the times.`;
      const { choices, correctIndex } = shuffleChoices(rng, correct, [`Yes. ${ta} + ${tb} = ${ta + tb} minutes together.`, `No. The time is the average: ${(ta + tb) / 2} minutes.`]);
      return { ...base, params: { ra: 0, rb: 0, v: 0, kind: 1 }, text: `Tap A fills a tank in ${ta} minutes and tap B fills it in ${tb} minutes. Luka says together they take ${ta + tb} minutes. Is he right?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'Two taps together are faster than one. Should the time go up or down?', steps: ['Two taps together fill faster than either alone, so the time must be less than both', 'Add the amounts per minute (the rates), then divide the tank by the total rate', correct], choices, traps: [] };
    }
    if (level === 1) {
      const ra = rng.int(1, 6), rb = rng.int(1, 6), v = (ra + rb) * rng.pick([5, 8, 10, 12, 15, 20]);
      const r = v / (ra + rb);
      return { ...base, params: { ra, rb, v, kind: 0 }, text: `Tap A fills ${ra} L per minute and tap B fills ${rb} L per minute. How long do they take together to fill a ${v} L tank?`, answer: { kind: 'number', value: r }, answerText: `${r} minutes`, hint: 'Add the rates to get litres per minute together, then time = amount ÷ rate.', steps: [`Add the rates: ${ra} + ${rb} = ${ra + rb} L per minute`, `Time = amount ÷ rate: ${v} ÷ ${ra + rb} = ${r}`, `So ${r} minutes`], traps: [{ value: v / ra + v / rb, misconception: 'added-times', message: 'Add the RATES (L per minute), not the times.' }, { value: v / Math.max(ra, rb), misconception: 'one-tap' }].filter((t) => Number.isInteger(t.value) && t.value !== r) };
    }
    let v = 60, ta = 20, tb = 30;
    for (let tries = 0; tries < 100; tries++) {
      v = rng.pick([60, 120, 180, 240, 300, 360]); ta = rng.pick([10, 12, 15, 20, 24, 30, 36, 40, 45, 60]); tb = rng.pick([10, 12, 15, 20, 24, 30, 36, 40, 45, 60]);
      if (ta !== tb && Number.isInteger(v / ta) && Number.isInteger(v / tb) && Number.isInteger(v / (v / ta + v / tb))) break;
    }
    const ra = v / ta, rb = v / tb, r = v / (ra + rb);
    return { ...base, params: { ra, rb, v, kind: 0 }, text: `Tap A fills a ${v} L tank in ${ta} minutes. Tap B fills the same tank in ${tb} minutes. How long do they take together?`, answer: { kind: 'number', value: r }, answerText: `${r} minutes`, hint: 'Find each tap\'s rate in L per minute first (amount ÷ time). Then add the rates.', steps: [`Rate of A: ${v} ÷ ${ta} = ${ra} L per minute`, `Rate of B: ${v} ÷ ${tb} = ${rb} L per minute`, `Together: ${ra} + ${rb} = ${ra + rb} L per minute`, `Time: ${v} ÷ ${ra + rb} = ${r} minutes`, `Check: less than ${Math.min(ta, tb)} minutes, the faster tap alone ✓`], traps: [{ value: ta + tb, misconception: 'added-times', message: 'Add the rates, not the times. Together must be quicker than either tap alone.' }, { value: (ta + tb) / 2, misconception: 'averaged' }, { value: ra + rb, misconception: 'gave-rate', message: `${ra + rb} L per minute is the combined rate. Now divide the tank by it.` }].filter((t) => Number.isFinite(t.value) && Math.abs(t.value - r) > 1e-9) };
  },
  compute: ({ ra, rb, v, kind }) => (kind === 1 ? 0 : v / (ra + rb)),
  mistakes: [
    { problem: 'Tap A fills a tank in 20 min and tap B in 30 min. How long together?', steps: ['Add the times: 20 + 30 = 50 minutes'], wrongStep: 0, reason: 'Two taps are FASTER together. Add the rates: for a 60 L tank, 3 + 2 = 5 L per minute, so 60 ÷ 5 = 12 minutes.', fixOptions: ['Add the rates: 3 + 2 = 5 L/min, so 60 ÷ 5 = 12 minutes', 'Add the times: 50 minutes', 'Average the times: 25 minutes'], correctFix: 0 },
    { problem: 'Tap A fills 5 L/min, tap B 3 L/min. Time to fill 160 L together?', steps: ['Together: 5 + 3 = 8 L per minute', 'Time: 160 × 8 = 1280 minutes'], wrongStep: 1, reason: 'Time = amount ÷ rate: 160 ÷ 8 = 20 minutes.', fixOptions: ['Time: 160 ÷ 8 = 20 minutes', 'Time: 160 × 8 = 1280 minutes', 'Time: 8 minutes'], correctFix: 0 },
    { problem: 'Tap A fills a 100 L tank in 25 min, tap B in 50 min. Together?', steps: ['Rate A: 100 ÷ 25 = 4 L/min', 'Rate B: 100 ÷ 50 = 2 L/min', 'Together 6 L/min, so the answer is 6 minutes'], wrongStep: 2, reason: '6 L/min is the rate; the time is 100 ÷ 6 ≈ 16.7 minutes.', fixOptions: ['Time: 100 ÷ 6 ≈ 16.7 minutes', 'The answer is 6 minutes', 'Time: 25 + 50 = 75 minutes'], correctFix: 0 },
  ],
  misconceptions: {
    'added-times': 'Adding the times makes it slower, but two taps together are faster. Add the rates.',
    averaged: 'Together is faster than the faster tap alone, so it cannot be the average.',
    'one-tap': 'Both taps are running: add their rates.',
    'gave-rate': 'That is litres per minute. Divide the tank size by it to get the time.',
  },
};
