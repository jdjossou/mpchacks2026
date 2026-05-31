"use client";

import { motion } from "framer-motion";
import type { AnswerBullet } from "@/lib/game/gameTypes";

interface Props {
  bullet: AnswerBullet;
  isSelected: boolean;
  isUsed: boolean;
  onClick: () => void;
}

/**
 * One "Truth Bullet" chip in the player's inventory.
 */
export default function BulletChip({ bullet, isSelected, isUsed, onClick }: Props) {
  return (
    <motion.button
      layout
      whileHover={isUsed ? {} : { scale: 1.03 }}
      whileTap={isUsed ? {} : { scale: 0.96 }}
      onClick={isUsed ? undefined : onClick}
      className={[
        "aero-button",
        isSelected ? "aero-button-selected" : "",
        isUsed ? "opacity-35 cursor-not-allowed grayscale" : "",
        "relative flex items-center gap-2 pl-3 pr-4 py-3 text-left w-full",
      ]
        .filter(Boolean)
        .join(" ")}
      title={isUsed ? "Used" : bullet.text}
      disabled={isUsed}
      aria-pressed={isSelected}
    >
      {/* Bullet icon — fixed-width slot so text alignment never shifts. */}
      <span
        className="shrink-0 w-5 text-center text-lg leading-none"
        aria-hidden="true"
        style={
          isSelected && !isUsed
            ? { color: "#0c5a26", textShadow: "0 0 8px rgb(126 231 135 / 0.95)" }
            : undefined
        }
      >
        {isUsed ? "✕" : isSelected ? "◆" : "◇"}
      </span>

      {/* Truncated text */}
      <span
        className="text-base font-semibold leading-snug block overflow-hidden"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          textShadow: "0 1px 2px rgb(0 0 0 / 0.3)",
        }}
      >
        {bullet.text}
      </span>

      {/* "Used" stamp overlay */}
      {isUsed && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[0.5rem] bg-black/25">
          <span className="text-sm font-black tracking-[0.2em] text-white/70 uppercase rotate-[-12deg] border-2 border-white/40 rounded px-2 py-0.5">
            Used
          </span>
        </div>
      )}
    </motion.button>
  );
}
