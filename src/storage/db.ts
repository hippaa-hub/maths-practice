import { del, get, set } from 'idb-keyval';
import type { AnswerRecord, ProgressMap } from '../engine/types';
import type { MasteryLog } from '../engine/mastery';
import type { SessionRecord } from '../engine/xp';

export interface Settings {
  name: string;
  muted: boolean;
}

export interface Saved {
  version: 1;
  progress: ProgressMap;
  log: AnswerRecord[];
  sessions: SessionRecord[];
  settings: Settings;
  /** Skills she can do, by day — for the week-by-week chart on My progress. */
  masteryLog?: MasteryLog;
}

export interface Store {
  load(): Promise<Saved | null>;
  save(s: Saved): Promise<void>;
  /** Wipe everything on this device (used by the ?reset link). */
  clear(): Promise<void>;
}

const KEY = 'adele-maths-v1';

export const DEFAULT_SETTINGS: Settings = { name: 'Adele', muted: false };

export function emptySaved(): Saved {
  return { version: 1, progress: {}, log: [], sessions: [], settings: { ...DEFAULT_SETTINGS } };
}

/** Progress lives in the browser's IndexedDB on this device only. Nothing leaves the phone. */
export const idbStore: Store = {
  async load() {
    try {
      const v = await get<Saved>(KEY);
      return v ?? null;
    } catch {
      return null;
    }
  },
  async save(s) {
    await set(KEY, s);
  },
  async clear() {
    await del(KEY);
  },
};

export function memoryStore(initial: Saved | null = null): Store & { current: Saved | null } {
  const store = {
    current: initial,
    async load() { return store.current; },
    async save(s: Saved) { store.current = s; },
    async clear() { store.current = null; },
  };
  return store;
}
