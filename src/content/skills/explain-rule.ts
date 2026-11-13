import type { Rng } from '../../engine/rng';
import type { Level } from '../../engine/types';
import type { Question, Skill } from '../types';
import { shuffleChoices } from '../util';

const ID = 'explain-rule';

export const explainRule: Skill = {
  id: ID,
  unit: 2,
  order: 0,
  title: 'Explaining a rule in words',
  short: 'Explain the rule',
  prerequisites: ['visual-patterns', 'formula-from-table'],
  variety: 5,
  explain: {
    sentences: [
      'In a pattern investigation you make a rule, test it, predict with it, and explain WHY it works.',
      'A good explanation links the numbers in the rule to the picture: in 3n + 1, the 3 is the matchsticks each new square adds, and the + 1 is the extra stick that closes the first square.',
      'A weak explanation only says what to do ("multiply by 3 and add 1") without saying why.',
      'Test the rule on a shape you have not used yet before you trust it.',
    ],
    rule: 'Say what each number in the rule means in the picture, and show the rule works on a new case.',
    picture: { type: 'pattern', shape: 'squares', terms: [1, 2, 3], labels: ['4', '7', '10'] },
  },
  examples: [
    { problem: 'Squares in a row use 4, 7, 10 matchsticks: rule 3n + 1. Which explanation is best?', steps: ['Link each number to the picture', 'The 3: every new square adds 3 matchsticks', 'The + 1: the first square needs one extra stick to close it', 'Test: shape 4 should have 3 × 4 + 1 = 13 — count it: yes'], answer: 'Each new square adds 3 sticks, plus 1 extra to close the first square' },
    { problem: 'A sequence 5, 8, 11, 14 has rule 3n + 2. Is "add 3 each time" a full explanation?', steps: ['"Add 3 each time" explains the 3n part only', 'It does not say where to start: the + 2 makes the first term 5', 'A full explanation gives the step AND the start'], answer: 'No: it misses the starting value' },
  ],
  faded: [
    { problem: 'Triangles in a row use 3, 5, 7 matchsticks: rule 2n + 1. Why the 2?', steps: [{ given: 'Each new triangle shares a side with the one before' }, { prompt: 'So each new triangle adds ? new sticks', answer: { kind: 'number', value: 2 }, answerText: '2' }] },
    { problem: 'The same pattern: why the + 1?', steps: [{ given: 'The rule 2n gives 2, 4, 6 but the pattern has 3, 5, 7' }, { prompt: 'The first triangle needs ? extra stick', answer: { kind: 'number', value: 1 }, answerText: '1' }] },
  ],
  generate(level: Level, rng: Rng): Question {
    const base = { skillId: ID, level };
    const patterns = [
      { thing: 'squares in a row', unit: 'matchsticks', a: 3, b: 1, why: (a: number, b: number) => `Each new square adds ${a} matchsticks, and ${b} extra stick closes the first square` },
      { thing: 'triangles in a row', unit: 'matchsticks', a: 2, b: 1, why: (a: number, b: number) => `Each new triangle adds ${a} matchsticks, and ${b} extra stick closes the first triangle` },
      { thing: 'L-shapes made of tiles', unit: 'tiles', a: 2, b: 1, why: (a: number, b: number) => `Each new shape adds ${a} tiles, one on each arm, and ${b} tile is the corner` },
      { thing: 'crosses made of dots', unit: 'dots', a: 4, b: 1, why: (a: number, b: number) => `Each new shape adds ${a} dots, one on each arm, and ${b} dot is the centre` },
      { thing: 'tables pushed together, counting chairs', unit: 'chairs', a: 2, b: 2, why: (a: number, b: number) => `Each new table adds ${a} chairs, one on each side, and ${b} chairs sit at the two ends` },
    ];
    const p = rng.pick(patterns);
    const terms = [1, 2, 3].map((n) => p.a * n + p.b);
    const rule = `${p.a}n + ${p.b}`;
    const correct = p.why(p.a, p.b);
    const wrongs = [
      `Multiply the shape number by ${p.a} and add ${p.b}`,
      `The ${p.unit} go up by ${p.a + p.b} each time`,
      `Each new shape adds ${p.b} ${p.unit}, and the first shape has ${p.a}`,
      `Shape 1 has ${terms[0]} ${p.unit}, so multiply by ${terms[0]}`,
    ];
    const picked = level === 1 ? [wrongs[1], wrongs[3]] : level === 2 ? [wrongs[0], wrongs[2]] : [wrongs[0], wrongs[1], wrongs[2]];
    const { choices, correctIndex } = shuffleChoices(rng, correct, picked);
    const ask = level === 3 ? `Which explanation would get full marks for explaining WHY the rule works?` : `Which explanation best says why the rule works?`;
    return {
      ...base, params: { a: p.a, b: p.b },
      text: `A pattern of ${p.thing} uses ${terms.join(', ')} ${p.unit} for shapes 1, 2, 3. The rule is ${rule}. ${ask}`,
      answer: { kind: 'choice', value: 0, choice: correctIndex }, answerText: correct,
      hint: 'The best explanation says what the ' + p.a + ' and the ' + p.b + ' each mean in the picture.',
      steps: [`The ${p.a} in ${rule} is the number of ${p.unit} each new shape adds`, `The ${p.b} is the extra part that only the first shape needs`, 'Saying only "multiply and add" tells you what to do, not why', `Test on shape 4: ${p.a} × 4 + ${p.b} = ${p.a * 4 + p.b} ✓`],
      choices, traps: [],
    };
  },
  compute: () => 0,
  mistakes: [
    { problem: 'Explain why squares in a row have the rule 3n + 1.', steps: ['You multiply the shape number by 3', 'Then you add 1', 'That gives the right numbers, so that is the explanation'], wrongStep: 2, reason: 'Getting the right numbers is a check, not an explanation. Say why: each square adds 3 sticks and the first square needs 1 extra.', fixOptions: ['Each square adds 3 sticks; the + 1 is the extra stick that closes the first square', 'That gives the right numbers, so that is the explanation', 'Because 3 + 1 = 4, the first shape'], correctFix: 0 },
    { problem: 'A pattern 4, 7, 10 has rule 3n + 1. Nino writes: "it goes up by 4 each time".', steps: ['From 4 to 7 is 3, so it goes up by 3, not 4', 'So the rule is 4n'], wrongStep: 1, reason: 'Going up by 3 means 3n, and shape 1 has 4, so 3n + 1. The step goes in front of n.', fixOptions: ['It goes up by 3, so the rule is 3n + 1', 'So the rule is 4n', 'So the rule is n + 3'], correctFix: 0 },
    { problem: 'Luka says a rule is right because it works for shape 1.', steps: ['The rule gives 4 for shape 1, which is right', 'So the rule is proved'], wrongStep: 1, reason: 'One case is not a proof. Test the rule on at least one more shape, ideally one you did not use to make it.', fixOptions: ['Test it on another shape too, for example shape 4', 'So the rule is proved', 'Shape 1 is enough'], correctFix: 0 },
  ],
  misconceptions: { 'what-not-why': 'Say what each number in the rule means in the picture, not just what to calculate.', 'one-case': 'Test the rule on more than one shape before trusting it.' },
};
