"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Character, CharacterId } from "@/lib/game/gameTypes";

interface Props {
  characters: Character[];
  activeSpeakerId: CharacterId | null;
}

// Emoji + gradient placeholder per character (real art slots into `character.avatar`).
const CHARACTER_STYLE: Record<
  CharacterId,
  { emoji: string; gradient: string; border: string; bob: number; shake: number }
> = {
  teacher:  { emoji: "👩‍🏫", gradient: "linear-gradient(135deg, #1a78c2, #2e90d8)", border: "#57c7ff", bob: 2.1, shake: 5.2 },
  studentA: { emoji: "🧑‍💻", gradient: "linear-gradient(135deg, #3ab85e, #7ee787)", border: "#7ee787", bob: 1.7, shake: 3.8 },
  studentB: { emoji: "🧑‍🎓", gradient: "linear-gradient(135deg, #c260d4, #e08ff0)", border: "#e08ff0", bob: 1.9, shake: 4.6 },
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

// ─── Centered, animated speaker ─────────────────────────────────────────────
function StageAvatar({ character }: { character: Character }) {
  const style = CHARACTER_STYLE[character.id];
  const dim = 120;

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 48, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 36, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      {/* Speaking indicator */}
      <span
        className="text-[#9fe9ff] text-[0.65rem] font-bold tracking-widest uppercase"
        style={{ textShadow: "0 0 8px #57c7ff" }}
      >
        ★ speaking
      </span>

      {/* Avatar — idle bob + periodic emphatic shake (varies per character) */}
      <div
        style={{
          width: dim,
          height: dim,
          position: "relative",
          borderRadius: "50%",
          background: style.gradient,
          border: `3px solid ${style.border}`,
          boxShadow: `0 0 22px ${style.border}, 0 6px 18px rgb(0 0 0 / 0.45)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: dim * 0.46,
          overflow: "hidden",
          animation: `character-bob ${style.bob}s ease-in-out infinite, character-shake ${style.shake}s ease-in-out infinite`,
        }}
      >
        {/* Emoji placeholder sits behind; real art (if present) covers it. */}
        <span style={{ position: "absolute" }}>{style.emoji}</span>
        {character.avatar ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={character.avatar}
            alt={character.name}
            width={dim}
            height={dim}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
            }}
            onError={(e) => {
              // Fall back to the emoji if the art file doesn't exist yet.
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
      </div>

      {/* Name label */}
      <span
        className="text-xs font-semibold tracking-wide"
        style={{ color: style.border, textShadow: `0 0 8px ${style.border}` }}
      >
        {character.name}
      </span>
    </motion.div>
  );
}
