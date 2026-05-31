"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Character, CharacterId } from "@/lib/game/gameTypes";

interface Props {
  characters: Character[];
  activeSpeakerId: CharacterId | null;
}

// Emoji fallback + animation timing per character (real art slots into `character.avatar`).
const CHARACTER_STYLE: Record<
  CharacterId,
  { emoji: string; bob: number; shake: number }
> = {
  teacher:  { emoji: "👩‍🏫", bob: 2.1, shake: 5.2 },
  studentA: { emoji: "🧑‍💻", bob: 1.7, shake: 3.8 },
  studentB: { emoji: "🧑‍🎓", bob: 1.9, shake: 4.6 },
};

/**
 * Center stage: the active speaker pops up in the middle, Danganronpa-style,
 * one at a time. When no one is speaking (e.g. the solving phase) the stage is
 * empty so the rest of the screen gets the room.
 */
export default function CharacterStage({ characters, activeSpeakerId }: Props) {
  const speaker = activeSpeakerId
    ? characters.find((c) => c.id === activeSpeakerId) ?? null
    : null;

  return (
    <div className="relative flex-1 min-h-0 flex items-end justify-center px-6 pb-1">
      <AnimatePresence mode="wait">
        {speaker && <StageAvatar key={speaker.id} character={speaker} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Centered, animated speaker — big uncropped sprite ──────────────────────
function StageAvatar({ character }: { character: Character }) {
  const style = CHARACTER_STYLE[character.id];

  return (
    <motion.div
      className="flex items-end justify-center h-full"
      initial={{ opacity: 0, y: 48, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 36, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{
        animation: `character-bob ${style.bob}s ease-in-out infinite, character-shake ${style.shake}s ease-in-out infinite`,
      }}
    >
      {character.avatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={character.avatar}
          alt={character.name}
          style={{
            height: "100%",
            maxHeight: "clamp(320px, 64vh, 760px)",
            width: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 8px 18px rgb(0 0 0 / 0.45))",
          }}
          onError={(e) => {
            // Fall back to the emoji if the art file doesn't exist yet.
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (sib) sib.style.display = "flex";
          }}
        />
      ) : null}

      {/* Large emoji fallback (shown only if there's no art / it fails to load). */}
      <span
        style={{
          display: character.avatar ? "none" : "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          lineHeight: 1,
          fontSize: "clamp(180px, 46vh, 520px)",
        }}
      >
        {style.emoji}
      </span>
    </motion.div>
  );
}
