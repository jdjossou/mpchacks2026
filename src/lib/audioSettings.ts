/**
 * Shared, SSR-safe audio mute state.
 *
 * A single global flag silences both sound effects (`sound.ts`) and background
 * music (`music.ts`). Both modules import from here so there is one source of
 * truth and no circular dependency between them. The mute button subscribes via
 * `subscribe` (designed for React's `useSyncExternalStore`).
 */
const STORAGE_KEY = "clashroom_muted";

let muted = false;
const listeners = new Set<() => void>();

// Hydrate from localStorage once on the client.
if (typeof window !== "undefined") {
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Ignore storage access errors (private mode, etc.).
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  if (muted === value) return;
  muted = value;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      // Ignore storage write errors.
    }
  }
  listeners.forEach((fn) => fn());
}

export function toggleMuted() {
  setMuted(!muted);
}

/** Subscribe to mute changes. Returns an unsubscribe function. */
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
