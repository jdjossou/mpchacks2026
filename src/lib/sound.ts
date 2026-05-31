/**
 * Tiny, SSR-safe sound-effect player.
 *
 * Each effect lives in `public/effects/<name>_sound.wav`, so the `SoundName`
 * union below is the only mapping needed. We cache one `HTMLAudioElement` per
 * sound and rewind it on replay — fine for short, non-overlapping cues.
 */
export type SoundName =
  | "menu_hover"
  | "menu_select"
  | "answer_select"
  | "answer_shoot"
  | "correct_answer"
  | "game_win"
  | "game_lose";

const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

export function playSound(name: SoundName, volume = 0.6) {
  if (typeof window === "undefined") return;
  try {
    let a = cache[name];
    if (!a) {
      a = new Audio(`/effects/${name}_sound.wav`);
      cache[name] = a;
    }
    a.currentTime = 0;
    a.volume = volume;
    void a.play().catch(() => {});
  } catch {
    // Ignore playback errors (e.g. autoplay restrictions).
  }
}
