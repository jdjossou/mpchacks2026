/**
 * SSR-safe looping background-music player.
 *
 * Each track lives in `public/music/<name>_music.mp3`. We keep a single shared
 * `HTMLAudioElement` so only one track is ever audible — switching tracks just
 * repoints that element. The module is a singleton, so it survives client-side
 * navigation between routes and keeps playing without a restart.
 */
import { isMuted, subscribe } from "./audioSettings";

export type MusicName = "landing_page" | "tutorial" | "game";

const MUSIC_VOLUME = 0.3;

let audio: HTMLAudioElement | null = null;
let currentName: MusicName | null = null;
let gestureUnlockBound = false;

// Keep the live audio element in sync with the global mute flag.
if (typeof window !== "undefined") {
  subscribe(() => {
    if (audio) audio.muted = isMuted();
  });
}

/**
 * Browsers block audio playback until the user interacts with the page. When
 * `play()` rejects, bind a one-time gesture listener that retries the current
 * track, then removes itself.
 */
function bindGestureUnlock() {
  if (gestureUnlockBound) return;
  gestureUnlockBound = true;

  const retry = () => {
    gestureUnlockBound = false;
    window.removeEventListener("pointerdown", retry);
    window.removeEventListener("keydown", retry);
    if (audio && currentName) {
      void audio.play().catch(() => bindGestureUnlock());
    }
  };

  window.addEventListener("pointerdown", retry, { once: true });
  window.addEventListener("keydown", retry, { once: true });
}

export function playMusic(name: MusicName) {
  if (typeof window === "undefined") return;
  if (name === currentName) return; // already playing — don't restart

  try {
    if (!audio) {
      audio = new Audio();
      audio.loop = true;
      audio.volume = MUSIC_VOLUME;
    }
    currentName = name;
    audio.muted = isMuted();
    audio.src = `/music/${name}_music.mp3`;
    void audio.play().catch(() => bindGestureUnlock());
  } catch {
    // Ignore playback errors (e.g. autoplay restrictions).
  }
}

export function stopMusic() {
  if (!audio) return;
  audio.pause();
  currentName = null;
}
