"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { isMuted, toggleMuted, subscribe } from "@/lib/audioSettings";

/**
 * Floating glassy speaker toggle. Silences all audio (music + effects) via the
 * shared `audioSettings` store, which persists the choice to localStorage.
 * Mounted globally in the root layout, so it sits on every screen.
 */
export default function MuteButton() {
  // Server snapshot is always `false` (effects/music are no-ops during SSR).
  const muted = useSyncExternalStore(subscribe, isMuted, () => false);

  return (
    <button
      type="button"
      onClick={() => toggleMuted()}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      title={muted ? "Unmute" : "Mute"}
      className="fixed bottom-4 left-4 z-[200] flex h-11 w-11 items-center justify-center rounded-full bg-white/20 border border-white/40 text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-200 hover:bg-white/35 hover:border-white/55 hover:scale-105 active:scale-95 cursor-pointer"
    >
      {muted ? (
        <VolumeX className="h-5 w-5" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
    </button>
  );
}
