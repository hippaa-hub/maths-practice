import { describe, expect, it } from 'vitest';
import { checkAnswer, fmt } from '../engine/answers';
import { createRng } from '../engine/rng';
import type { Level } from '../engine/types';
import { SKILLS } from './index';
import { decimals } from './util';
import { checkStepArithmetic } from './verify';

const RUNS = 500;

describe.each(SKILLS.map((s) => [s.id, s] as const))('skill %s', (_id, skill) => {
  it('has all eight parts', () => {
    expect(skill.title.length).toBeGreaterThan(3);
    expect(skill.explain.sentences.length).toBeGreaterThanOrEqual(3);
    expect(skill.explain.sentences.length).toBeLessThanOrEqual(5);
    expect(skill.explain.rule.length).toBeGreaterThan(10);
    expect(skill.explain.picture).toBeTruthy();
    expect(skill.examples.length).toBeGreaterThanOrEqual(2);
    expect(skill.faded.length).toBeGreaterThanOrEqual(2);
    expect(skill.mistakes.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(skill.misconceptions).length).toBeGreaterThanOrEqual(2);
    for (const s of SKILLS) for (const pre of s.prerequisites) expect(SKILLS.some((x) => x.id === pre)).toBe(true);
  });

  it('worked examples and faded problems have correct arithmetic', () => {
    for (const ex of skill.examples) {
      expect(ex.steps.length).toBeGreaterThan(0);
      for (const step of ex.steps) {
        const r = checkStepArithmetic(step);
        expect(r.ok, r.detail).toBe(true);
      }
    }
    for (const f of skill.faded) {
      expect(f.steps.some((s) => 'prompt' in s)).toBe(true);
      for (const s of f.steps) {
        if ('given' in s) {
          const r = checkStepArithmetic(s.given);
          expect(r.ok, r.detail).toBe(true);
        } else {
          // "10% of 80 = ?" with the answer filled in must be right.
          const filled = s.prompt.replace('?', fmt(s.answer.value));
          const r = checkStepArithmetic(filled);
          expect(r.ok, r.detail).toBe(true);
          expect(checkAnswer(s.answerText, s.answer) || checkAnswer(fmt(s.answer.value), s.answer)).toBe(true);
        }
      }
    }
  });

  it('mistake hunts point at a real step and the right fix', () => {
    for (const m of skill.mistakes) {
      expect(m.wrongStep).toBeGreaterThanOrEqual(0);
      expect(m.wrongStep).toBeLessThan(m.steps.length);
      expect(m.correctFix).toBeGreaterThanOrEqual(0);
      expect(m.correctFix).toBeLessThan(m.fixOptions.length);
      expect(m.fixOptions.length).toBeGreaterThanOrEqual(3);
      expect(m.reason.length).toBeGreaterThan(10);
      m.steps.forEach((step, i) => {
        if (i === m.wrongStep) return;
        const r = checkStepArithmetic(step);
        expect(r.ok, `${skill.id} mistake: ${r.detail}`).toBe(true);
      });
      const fix = checkStepArithmetic(m.fixOptions[m.correctFix]);
      expect(fix.ok, `${skill.id} fix: ${fix.detail}`).toBe(true);
    }
  });

  describe.each([1, 2, 3] as Level[])('level %i generator', (level) => {
    it(`runs ${RUNS} times and every worked solution reaches the stated answer`, () => {
      const rng = createRng(level * 1000 + 7);
      const texts = new Set<string>();
      for (let i = 0; i < RUNS; i++) {
        const q = skill.generate(level, rng);
        const where = `${skill.id} L${level} #${i}: ${q.text}`;
        expect(q.skillId).toBe(skill.id);
        expect(q.text, where).not.toMatch(/undefined|NaN|null/);
        expect(q.text.length, where).toBeGreaterThan(5);
        expect(q.hint.length, where).toBeGreaterThan(5);
        expect(q.steps.length, where).toBeGreaterThan(0);
        texts.add(q.text);

        for (const step of q.steps) {
          expect(step, where).not.toMatch(/undefined|NaN/);
          const r = checkStepArithmetic(step);
          expect(r.ok, `${where}\n  step: ${r.detail}`).toBe(true);
        }

        if (q.answer.kind === 'choice') {
          expect(q.choices, where).toBeTruthy();
          expect(q.choices!.length, where).toBeGreaterThanOrEqual(3);
          expect(q.answer.choice, where).toBeGreaterThanOrEqual(0);
          expect(q.answer.choice!, where).toBeLessThan(q.choices!.length);
          expect(q.choices![q.answer.choice!], where).toBe(q.answerText);
          continue;
        }

        // The answer must match an independent recomputation from the question's numbers.
        const expected = skill.compute(q.params);
        expect(Math.abs(q.answer.value - expected), `${where}\n  answer ${q.answer.value} vs compute ${expected}`).toBeLessThan(1e-6);
        // The worked steps must end with the answer.
        const exact = q.answer.kind === 'fraction' || q.answer.kind === 'ratio' || q.answer.kind === 'expression';
        const shown = (exact ? q.answerText : fmt(q.answer.value)).replace(/−/g, '-');
        expect(q.steps.join(' ').replace(/−/g, '-'), where).toContain(shown);
        // What she would type for the answer is accepted by the checker, and the display text starts with it.
        const typed = (exact ? q.answerText : fmt(q.answer.value)).replace(/−/g, '-');
        expect(checkAnswer(typed, q.answer), `${where}\n  typed ${typed}`).toBe(true);
        expect(q.answerText.replace(/−/g, '-').replace(/^(Shop|Pack) [AB], (by )?/, '').startsWith(typed), `${where}\n  answerText ${q.answerText} vs ${typed}`).toBe(true);
        // Clean numbers: at most 2 decimals at levels 1-2, 3 at level 3.
        if (!exact) expect(decimals(q.answer.value), where).toBeLessThanOrEqual(level === 3 ? 3 : 2);
        expect(Number.isFinite(q.answer.value), where).toBe(true);

        for (const t of q.traps) {
          expect(Number.isFinite(t.value), where).toBe(true);
          if (q.answer.kind === 'ratio') {
            const same = JSON.stringify(t.ratio) === JSON.stringify(q.answer.ratio);
            expect(!same || t.misconception === 'not-simplified', `${where}\n  ratio trap equals answer`).toBe(true);
          } else {
            expect(Math.abs(t.value - q.answer.value), `${where}\n  trap equals answer`).toBeGreaterThan(1e-9);
          }
          expect(skill.misconceptions[t.misconception], `${where}\n  unknown misconception ${t.misconception}`).toBeTruthy();
        }
      }
      // Fresh numbers: a level must produce plenty of different questions.
      expect(texts.size).toBeGreaterThanOrEqual(skill.variety ?? 21);
    });
  });
});
