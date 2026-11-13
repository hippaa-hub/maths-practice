import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { fmt, shuffleChoices } from '../util';

const ID = 'order-fdp';

interface Item { text: string; value: number; asPct: string }
const FRACS: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [3, 8], [5, 8], [1, 8], [7, 8], [1, 20], [3, 20]];

function makeItems(rng: Rng, level: Level): Item[] {
  const items: Item[] = [];
  const seen = new Set<number>();
  const push = (it: Item) => { if (!seen.has(it.value)) { seen.add(it.value); items.push(it); } };
  while (items.length < (level === 3 ? 4 : 3)) {
    const kind = items.length % 3;
    if (kind === 0) { const [n, d] = rng.pick(FRACS); push({ text: `${n}/${d}`, value: n / d, asPct: `${n}/${d} = ${fmt((n / d) * 100)}%` }); }
    else if (kind === 1) { const p = rng.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 12.5, 37.5, 62.5]); push({ text: `${fmt(p)}%`, value: p / 100, asPct: `${fmt(p)}%` }); }
    else { const d = rng.pick([0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.05, 0.15]); push({ text: fmt(d), value: d, asPct: `${fmt(d)} = ${fmt(d * 100)}%` }); }
  }
  return rng.shuffle(items);
}

export const orderFdp: Skill = {
  id: ID,
  unit: 1,
  order: 0,
  title: 'Ordering fractions, decimals and percents',
  short: 'Order F, D, %',
  taught: true,
  prerequisites: ['fdp-conversions'],
  explain: {
    sentences: [
      'To compare a fraction, a decimal and a percent, change them all into the same form first. Percents are usually easiest.',
      '1/5 = 20%, 0.5 = 50%, 75% stays 75%. Now they are easy to order: 1/5, 0.5, 75%.',
      'Watch out: 0.5 is not 5%, and 1/5 is not 15%.',
    ],
    rule: 'Same form first (usually percents), then compare.',
    picture: { type: 'table', headers: ['1/5', '0.5', '75%'], rows: [['20%', '50%', '75%'], ['smallest', '', 'largest']] },
  },
  examples: [
    { problem: 'Which is the largest: 1/5, 75% or 0.5?', steps: ['Change them all to percents: 1/5 = 20%, 0.5 = 50%, 75%', '75 is the biggest number', 'So 75% is the largest'], answer: '75%' },
    { problem: 'Put 3/8, 40% and 0.35 in order from smallest to largest.', steps: ['3/8 = 37.5%; 40%; 0.35 = 35%', 'Smallest to largest: 35%, 37.5%, 40%', 'So the order is 0.35, 3/8, 40%'], answer: '0.35, 3/8, 40%' },
  ],
  faded: [
    { problem: 'Which is larger, 2/5 or 35%?', steps: [{ prompt: '2/5 as a percent = ?', answer: { kind: 'percent', value: 40 }, answerText: '40%' }, { given: '40% is more than 35%, so 2/5 is larger' }] },
    { problem: 'Which is smaller, 0.7 or 3/4?', steps: [{ prompt: '3/4 as a percent = ?', answer: { kind: 'percent', value: 75 }, answerText: '75%' }, { prompt: '0.7 as a percent = ?', answer: { kind: 'percent', value: 70 }, answerText: '70%' }, { given: '70% is less than 75%, so 0.7 is smaller' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const items = makeItems(rng, level);
    const sorted = [...items].sort((a, b) => a.value - b.value);
    if (level === 3) {
      const correct = sorted.map((i) => i.text).join(', ');
      const w1 = [...sorted].reverse().map((i) => i.text).join(', ');
      const swapped = [...sorted]; [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
      const w2 = swapped.map((i) => i.text).join(', ');
      const { choices, correctIndex } = shuffleChoices(rng, correct, [w1, w2]);
      return { ...base, params: {}, text: `Which list puts ${items.map((i) => i.text).join(', ')} in order from smallest to largest?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct, hint: 'Change every one into a percent first.', steps: [`As percents: ${items.map((i) => i.asPct).join('; ')}`, `Smallest to largest: ${sorted.map((i) => `${fmt(i.value * 100)}%`).join(', ')}`, `So: ${correct}`], choices, traps: [] };
    }
    const largest = level === 1;
    const target = largest ? sorted[sorted.length - 1] : sorted[0];
    const { choices, correctIndex } = shuffleChoices(rng, target.text, items.filter((i) => i !== target).map((i) => i.text));
    return { ...base, params: {}, text: `Which is the ${largest ? 'largest' : 'smallest'}: ${items.map((i) => i.text).join(', ')}?`, answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: target.text, hint: 'Change them all into percents, then compare the numbers.', steps: [`As percents: ${items.map((i) => i.asPct).join('; ')}`, `The ${largest ? 'biggest' : 'smallest'} is ${fmt(target.value * 100)}%`, `So ${target.text} is the ${largest ? 'largest' : 'smallest'}`], choices, traps: [] };
  },
  compute: () => 0,
  mistakes: [
    { problem: 'Which is larger, 0.5 or 5%?', steps: ['0.5 and 5% are the same number', 'So they are equal'], wrongStep: 0, reason: '0.5 is 50%, which is much larger than 5%.', fixOptions: ['0.5 = 50%, so 0.5 is larger', '0.5 and 5% are the same', '5% is larger'], correctFix: 0 },
    { problem: 'Which is larger, 1/5 or 15%?', steps: ['1/5 looks like 15%', 'So they are equal'], wrongStep: 0, reason: '1/5 = 20% (5 × 20 = 100), so 1/5 is larger than 15%.', fixOptions: ['1/5 = 20%, so 1/5 is larger', '1/5 = 15%', '15% is larger'], correctFix: 0 },
    { problem: 'Order 3/4, 0.8 and 70% from smallest to largest.', steps: ['3/4 = 75%, 0.8 = 80%, 70%', 'Order: 3/4, 0.8, 70%'], wrongStep: 1, reason: 'Order the percents first: 70%, 75%, 80%, so 70%, 3/4, 0.8.', fixOptions: ['Order: 70%, 3/4, 0.8', 'Order: 3/4, 0.8, 70%', 'Order: 0.8, 3/4, 70%'], correctFix: 0 },
  ],
  misconceptions: { 'looks-alike': 'Change every number into a percent before comparing; digits that look alike can be very different sizes.', 'no-convert': 'Do not compare different forms directly.' },
};
