"use client";

import type { AnswerBullet } from "@/lib/game/gameTypes";

interface Props {
  bullet: AnswerBullet;
  /** Visual role in the carousel — the centre card is the live, highlighted one. */
  slot: "center" | "side";
  /** Spent bullet (only ever seen briefly during its exit animation). */
  isUsed?: boolean;
}

/**
 * Presentational Truth Bullet card. No interaction lives here — the carousel
 * ([BulletInventory]) handles positioning, navigation, and drag. The card just
 * renders the aero look for its slot.
 */
export default function BulletCard({ bullet, slot, isUsed = false }: Props) {
  const isCenter = slot === "center";

  return (
    <div
      className={[
        "aero-button",
        isCenter ? "aero-button-selected" : "",
        isUsed ? "opacity-35 grayscale" : "",
        "relative flex items-center gap-3 pl-4 pr-5 py-4 text-left w-full h-full select-none",
      ]
        .filter(Boolean)
        .join(" ")}
      title={bullet.text}
    >
      {/* Bullet icon — fixed-width slot so text alignment never shifts. */}
      <span
        className="shrink-0 w-6 text-center text-2xl leading-none"
        aria-hidden="true"
        style={
          isCenter && !isUsed
            ? { color: "#0c5a26", textShadow: "0 0 8px rgb(126 231 135 / 0.95)" }
            : undefined
        }
      >
        {isUsed ? "✕" : isCenter ? "◆" : "◇"}
      </span>

      {/* Truncated text */}
      <span
        className="text-lg font-semibold leading-snug block overflow-hidden"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
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
    </div>
  );
}
