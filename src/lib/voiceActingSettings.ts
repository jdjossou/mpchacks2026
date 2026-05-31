/**
 * Shared, SSR-safe voice acting preference.
 *
 * When disabled, upload parsing skips teacher voiceover generation and dialogue
 * playback ignores any voice audio URLs that already exist in loaded content.
 */
const STORAGE_KEY = "clashroom_voice_acting_enabled";

let voiceActingEnabled = true;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    voiceActingEnabled = window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    // Ignore storage access errors (private mode, etc.).
  }
}

export function isVoiceActingEnabled() {
  return voiceActingEnabled;
}

export function setVoiceActingEnabled(value: boolean) {
  if (voiceActingEnabled === value) return;
  voiceActingEnabled = value;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      // Ignore storage write errors.
    }
  }
  listeners.forEach((fn) => fn());
}

export function toggleVoiceActing() {
  setVoiceActingEnabled(!voiceActingEnabled);
}

/** Subscribe to voice acting preference changes. Returns an unsubscribe function. */
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
