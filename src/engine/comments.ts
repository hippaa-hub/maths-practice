import type { SessionSummary } from './runtime';
import type { SkillState } from './types';

/**
 * Lola's end-of-session comment: short and specific to what she did, never generic praise.
 * Pure so it can be tested.
 */
export function lolaComment(summary: SessionSummary, title: (id: string) => string, corrected: string[]): string {
  const stateWord: Record<SkillState, string> = { new: 'new', learning: 'learning', strong: 'strong', mastered: 'mastered' };
  if (corrected.length) {
    return `You missed ${title(corrected[0])} and then got it right on the second go. That is exactly how it sticks.`;
  }
  if (summary.stronger.length) {
    const id = summary.stronger[0];
    const st = summary.stateAfter[id];
    return summary.stronger.length === 1
      ? `${title(id)} moved up to "${stateWord[st] ?? st}". It comes back in a few days to make sure.`
      : `${summary.stronger.length} skills moved up today, including ${title(id)}. They come back in a few days to make sure.`;
  }
  if (summary.checked.length) {
    return `You still remember ${title(summary.checked[0])} from school. No lesson needed, straight into review.`;
  }
  if (summary.newlyLearned.length) {
    return `${title(summary.newlyLearned[0])} is new today. It comes back tomorrow while it is fresh.`;
  }
  if (summary.weaker.length) {
    return `${title(summary.weaker[0])} was tricky today. The method is in the steps, and it comes back tomorrow.`;
  }
  if (summary.answered > 0) {
    return `${summary.correct} of ${summary.answered} right today. Everything you missed comes back tomorrow.`;
  }
  return 'Done for today. See you tomorrow.';
}
