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
        "relative px-4 py-3 text-left w-full",
      ]
        .filter(Boolean)
        .join(" ")}
      title={isUsed ? "Used" : bullet.text}
      disabled={isUsed}
      aria-pressed={isSelected}
    >
      {/* Bullet icon */}
      <span className="mr-1.5 text-base" aria-hidden="true">
        {isUsed ? "✕" : isSelected ? "◆" : "◇"}
      </span>

      {/* Truncated text */}
      <span
        className="text-base font-semibold leading-tight block overflow-hidden"
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
        <div className="absolute inset-0 flex items-center justify-center rounded-[0.5rem] bg-black/20">
          <span className="text-xs font-black tracking-widest text-white/60 uppercase rotate-[-12deg]">
            Used
          </span>
        </div>
      )}
    </motion.button>
  );
}
