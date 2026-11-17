import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from '../App';
import { SKILLS, SKILL_BY_ID, type MistakeHunt, type Question } from '../content';
import { fmt } from '../engine/answers';
import { newProgress } from '../engine/spacing';
import type { ProgressMap } from '../engine/types';
import { emptySaved, memoryStore } from '../storage/db';

const TODAY = '2026-11-12';
const now = () => new Date(2026, 10, 12, 17, 30);

function seededProgress(): ProgressMap {
  const progress: ProgressMap = {};
  for (const s of SKILLS) progress[s.id] = newProgress(s.id);
  // Five skills ready for review today, so the mix also introduces one new skill.
  for (const id of ['fdp-conversions', 'pct-of-amount', 'pct-one-of-another', 'pct-increase', 'pct-decrease']) {
    progress[id] = { ...progress[id], box: 2, dueDate: TODAY, correctDays: ['2026-11-10'] };
  }
  // Every other taught skill has had its quick check: pct-change failed it (lesson next), the rest passed.
  for (const s of SKILLS) {
    if (progress[s.id].box !== 0) continue;
    progress[s.id] = s.id === 'pct-change'
      ? { ...progress[s.id], checkDate: '2026-11-11', checkResult: 'fail' }
      : { ...progress[s.id], box: 2, dueDate: '2026-11-20', checkDate: '2026-11-11', checkResult: 'pass', introducedDate: '2026-11-11' };
  }
  return progress;
}

afterEach(cleanup);

describe('playing a full Daily Mix', () => {
  it('teaches a new skill, asks every question, retries a miss and saves the log', async () => {
    const user = userEvent.setup();
    const store = memoryStore({ ...emptySaved(), progress: seededProgress() });
    let current: Question | null = null;
    let hunt: MistakeHunt | null = null;
    render(<App deps={{ now, seed: 11, store, onQuestion: (q) => { current = q; }, onHunt: (h) => { hunt = h; } }} />);

    await user.click(await screen.findByRole('button', { name: /start today's mix/i }));

    // --- Lesson: Learn -> Try with help -> Solo (pct-change failed its quick check yesterday) ---
    await screen.findByText('New skill');
    const lessonTitle = screen.getByRole('heading', { level: 1 }).textContent!;
    const skill = SKILLS.find((s) => s.title === lessonTitle)!;
    expect(skill).toBeTruthy();
    expect(skill.id).toBe('pct-change'); // a failed check puts the lesson first in line

    for (let guard = 0; guard < 40; guard++) {
      const next = screen.queryByRole('button', { name: /^next step$|^next example$/i });
      if (next) { await user.click(next); continue; }
      break;
    }
    await user.click(screen.getByRole('button', { name: /try with help/i }));

    // Fill every blank in order, from the skill's own content.
    const prompts = skill.faded.flatMap((f) => f.steps.filter((s): s is Extract<typeof s, { prompt: string }> => 'prompt' in s));
    let pi = 0;
    for (let guard = 0; guard < 60; guard++) {
      if (screen.queryByText(/^Solo · question/)) break;
      const solo = screen.queryByRole('button', { name: /solo time/i });
      if (solo) { await user.click(solo); continue; }
      const nextProblem = screen.queryByRole('button', { name: /next problem/i });
      if (nextProblem) { await user.click(nextProblem); continue; }
      const blank = screen.queryByRole('textbox', { name: /fill in the blank/i });
      if (blank) {
        await user.type(blank, fmt(prompts[pi].answer.value));
        await user.click(screen.getByRole('button', { name: /^check$/i }));
        await screen.findByText(/that's it!/i);
        pi++;
        continue;
      }
      const next = screen.queryByRole('button', { name: /^next$/i });
      if (next) { await user.click(next); continue; }
      throw new Error('Stuck in the faded stage');
    }
    expect(pi).toBe(prompts.length);

    // --- Solo: 3 questions, then the rest of the mix (one item is a Mistake Hunt) ---
    let answered = 0;
    let misses = 0;
    let hunts = 0;
    for (let guard = 0; guard < 40; guard++) {
      if (screen.queryByText(/mix done!/i)) break;
      if (screen.queryByText(/Mistake Hunt ·/)) {
        const h = hunt!;
        await user.click(screen.getByRole('button', { name: `Step ${h.wrongStep + 1}` }));
        await screen.findByText(/found it!/i);
        await user.click(screen.getByRole('radio', { name: h.fixOptions[h.correctFix] }));
        await user.click(screen.getByRole('button', { name: /^check$/i }));
        await screen.findByText(/you fixed it!/i);
        await user.click(screen.getByRole('button', { name: /continue/i }));
        hunts++;
        continue;
      }
      await screen.findByRole('button', { name: /^check$/i });
      const q = current!;
      expect(q).toBeTruthy();
      const missThisOne = answered === 4; // one deliberate miss in the mix
      if (q.answer.kind === 'choice') {
        const idx = missThisOne ? (q.answer.choice! + 1) % q.choices!.length : q.answer.choice!;
        await user.click(screen.getByRole('radio', { name: q.choices![idx] }));
      } else {
        await user.type(screen.getByRole('textbox', { name: /your answer/i }), missThisOne ? '999999' : fmt(q.answer.value));
      }
      await user.click(screen.getByRole('button', { name: /^check$/i }));
      if (missThisOne) {
        await screen.findByText('Not yet');
        expect(screen.getByText(new RegExp(`The answer is`))).toBeInTheDocument();
        misses++;
      } else {
        await screen.findByText('Nice!');
      }
      // Worked steps are always shown.
      expect(screen.getByRole('list', { name: /worked steps/i }).children.length).toBe(q.steps.length);
      await user.click(screen.getByRole('button', { name: /continue|finish lesson/i }));
      answered++;
    }

    // --- Summary ---
    await screen.findByText(/mix done!/i);
    expect(misses).toBe(1);
    expect(hunts).toBe(1);
    // 3 solo + 4 due questions + 1 retry of the missed skill (the 5th due item was the Mistake Hunt)
    expect(answered).toBe(8);
    expect(screen.getByText('6')).toBeInTheDocument(); // items in the mix: 4 + hunt + retry

    // Saved on the device: every answer is in the log and the new skill moved to box 1.
    await waitFor(() => expect(store.current!.log.filter((r) => r.source === 'mix' || r.source === 'mistakeHunt')).toHaveLength(6));
    expect(store.current!.progress['pct-change'].box).toBe(1);
    expect(store.current!.log.filter((r) => r.source === 'mistakeHunt')).toHaveLength(1);
    const mixRecords = store.current!.log.filter((r) => r.source === 'mix' || r.source === 'mistakeHunt');
    expect(mixRecords.filter((r) => !r.correct)).toHaveLength(1);
    // No two neighbouring questions shared a skill.
    for (let i = 1; i < mixRecords.length; i++) expect(mixRecords[i].skillId).not.toBe(mixRecords[i - 1].skillId);
    // The missed skill dropped a box; the others went up.
    const missed = mixRecords.find((r) => !r.correct)!.skillId;
    expect(store.current!.progress[missed].box).toBeLessThanOrEqual(2);
    for (const id of ['fdp-conversions', 'pct-of-amount', 'pct-one-of-another', 'pct-increase', 'pct-decrease']) {
      if (id !== missed) expect(store.current!.progress[id].box).toBe(3);
    }

    // The finished mix is recorded, XP was earned and the first badge appears.
    await waitFor(() => expect(store.current!.sessions.filter((s) => s.finished && s.mode === 'mix')).toHaveLength(1));
    expect(screen.getByText(/\+\d+ XP/)).toBeInTheDocument();
    expect(screen.getByText(/new badge/i)).toBeInTheDocument();

    // Back home: the week shows one practice day and the message is specific.
    await user.click(screen.getByRole('button', { name: /back home/i }));
    await screen.findByText(/you answered 9 questions today/i);
    expect(screen.getByLabelText(/1 of 3 practice days/i)).toBeInTheDocument();
    expect(SKILL_BY_ID['pct-change']).toBeTruthy();
  }, 30000);

  it('the skill map offers practice on a learning skill, and practice never moves a box', async () => {
    const user = userEvent.setup();
    const store = memoryStore({ ...emptySaved(), progress: seededProgress() });
    let current: Question | null = null;
    render(<App deps={{ now, seed: 5, store, onQuestion: (q) => { current = q; } }} />);
    await user.click(await screen.findByRole('button', { name: /skills$/i }));
    await screen.findByRole('heading', { name: /skill map/i });
    await user.click(screen.getByRole('button', { name: /^Percent of an amount: Learning$/ }));
    await user.click(await screen.findByRole('button', { name: /practise \(3 questions\)/i }));
    const seenTexts: string[] = [];
    for (let i = 0; i < 3; i++) {
      await screen.findByRole('button', { name: /^check$/i });
      const q = current!;
      expect(q.skillId).toBe('pct-of-amount');
      seenTexts.push(q.text);
      if (i === 1) {
        // She leaves the app (another app, a calculator) while the question is open.
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        await screen.findByText(/you left the app/i);
        Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      }
      await user.type(screen.getByRole('textbox', { name: /your answer/i }), fmt(q.answer.value));
      await user.click(screen.getByRole('button', { name: /^check$/i }));
      await screen.findByText(i === 1 ? /counts as "with help"/i : 'Nice!');
      await user.click(screen.getByRole('button', { name: /continue/i }));
    }
    await screen.findByText(/practice done!/i);
    expect(store.current!.progress['pct-of-amount'].box).toBe(2); // unchanged
    const practice = store.current!.log.filter((r) => r.source === 'practice');
    expect(practice).toHaveLength(3);
    // The question she left the app on is right but counts as 'with help'.
    expect(practice[1]).toMatchObject({ correct: true, hintUsed: true, leftApp: true });
    expect(practice[0].leftApp).toBeUndefined();
    // Never the same question twice: all three were different and are now remembered.
    expect(new Set(seenTexts).size).toBe(3);
    expect(store.current!.seen).toHaveLength(3);
    expect(store.current!.seen.every((k) => k.startsWith('pct-of-amount|'))).toBe(true);
    await waitFor(() => expect(store.current!.sessions).toHaveLength(1));
    expect(store.current!.sessions[0].mode).toBe('practice');
    // XP was earned even though no box moved.
    expect(screen.getByText(/\+\d+ XP/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /back home/i }));
    await screen.findByRole('heading', { name: /skill map/i });
  });

  it('starts a brand-new learner with two quick checks on taught skills, percentages first', async () => {
    const user = userEvent.setup();
    const store = memoryStore(null);
    let current: Question | null = null;
    render(<App deps={{ now, seed: 3, store, onQuestion: (q) => { current = q; } }} />);
    await user.click(await screen.findByRole('button', { name: /start today's mix/i }));
    // Day 1: two Unit 1 quick checks first, then the lesson for the class's current unit.
    await screen.findByText(/Quick check · Fractions, decimals and percents/);
    expect(screen.getByText('1/3')).toBeInTheDocument();

    // Pass the first check 3/3: the skill jumps to box 2, due in 2 days.
    for (let i = 0; i < 3; i++) {
      await screen.findByRole('button', { name: /^check$/i });
      const q = current!;
      if (q.answer.kind === 'choice') await user.click(screen.getByRole('radio', { name: q.choices![q.answer.choice!] }));
      else await user.type(screen.getByRole('textbox', { name: /your answer/i }), q.answerText.replace(/^Shop [AB], by /, ''));
      await user.click(screen.getByRole('button', { name: /^check$/i }));
      await screen.findByText('Nice!');
      await user.click(screen.getByRole('button', { name: /continue|see result/i }));
    }
    await screen.findByText(/you remember this one/i);
    await user.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => expect(store.current!.progress['fdp-conversions'].box).toBe(2));
    expect(store.current!.progress['fdp-conversions'].dueDate).toBe('2026-11-14');
    expect(store.current!.log.filter((r) => r.source === 'check')).toHaveLength(3);

    // Second check: fail it (0/3) -> stays at box 0, lesson queued.
    await screen.findByText(/Quick check · What percentage is shaded/);
    for (let i = 0; i < 3; i++) {
      await screen.findByRole('button', { name: /^check$/i });
      const q = current!;
      if (q.answer.kind === 'choice') await user.click(screen.getByRole('radio', { name: q.choices![(q.answer.choice! + 1) % q.choices!.length] }));
      else await user.type(screen.getByRole('textbox', { name: /your answer/i }), '999999');
      await user.click(screen.getByRole('button', { name: /^check$/i }));
      await screen.findByText('Not yet');
      await user.click(screen.getByRole('button', { name: /continue|see result/i }));
    }
    await screen.findByText(/go through this one properly/i);
    await user.click(screen.getByRole('button', { name: /continue/i }));
    // Then the Unit 2 lesson (what the class is doing now).
    await screen.findByText('New skill');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Continue a sequence');
    await waitFor(() => expect(store.current!.progress['pct-shaded'].checkResult).toBe('fail'));
    expect(store.current!.progress['pct-shaded'].box).toBe(0);
  });
});
