/**
 * Never show the same question twice. The app keeps a list of every question text seen on this
 * device; `pickFresh` keeps generating until it finds one that is new (or gives up after `tries`).
 */
export const SEEN_LIMIT = 4000;

export function seenKey(skillId: string, text: string): string {
  return `${skillId}|${text}`;
}

export function pickFresh<T extends { text: string; skillId: string }>(
  generate: () => T,
  isSeen: (key: string) => boolean,
  tries = 30,
): T {
  let first: T | null = null;
  for (let i = 0; i < tries; i++) {
    const q = generate();
    if (!first) first = q;
    if (!isSeen(seenKey(q.skillId, q.text))) return q;
  }
  // Every try was a repeat (a skill with very few variants): fall back to the first one.
  return first!;
}

/** Adds a key to the seen list, dropping the oldest when the list is full. */
export function remember(seen: string[], key: string): string[] {
  if (seen.includes(key)) return seen;
  const next = [...seen, key];
  return next.length > SEEN_LIMIT ? next.slice(next.length - SEEN_LIMIT) : next;
}
