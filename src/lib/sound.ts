/**
 * Tiny, SSR-safe sound-effect player.
 *
 * Each effect lives in `public/effects/<name>_sound.wav`, so the `SoundName`
 * union below is the only mapping needed. We keep one preloaded
 * `HTMLAudioElement` per sound as a template and play a fresh clone on each
 * call: rewinding a single cached element is unreliable for longer clips
 * (e.g. `game_win` would refuse to replay after the first time) and can't
 * overlap. Cloning sidesteps both — the browser cache means the clone reuses
 * the already-downloaded file.
 */
import { isMuted } from "./audioSettings";

export type SoundName =
  | "menu_hover"
  | "menu_select"
  | "answer_select"
  | "answer_shoot"
  | "correct_answer"
  | "wrong_answer"
  | "dialogue_double_click"
  | "game_win"
  | "game_lose";

const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

export function playSound(name: SoundName, volume = 0.6) {
  if (typeof window === "undefined") return;
  if (isMuted()) return;
  try {
    let template = cache[name];
    if (!template) {
      template = new Audio(`/effects/${name}_sound.wav`);
      cache[name] = template;
    }
    const node = template.cloneNode() as HTMLAudioElement;
    node.volume = volume;
    void node.play().catch(() => {});
  } catch {
    // Ignore playback errors (e.g. autoplay restrictions).
  }
}
