"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import type { DebateStatement } from "@/lib/game/gameTypes";

interface Props {
  statement: DebateStatement;
  isTargetable: boolean; // a bullet is selected and this statement isn't resolved
  isResolved: boolean; // already correctly refuted
  lastShotOutcome: "hit" | "miss" | null; // transient flash state
  onClick: () => void;
}

/** Pick a random off-screen-ish entry offset so each statement flies in from
 *  a different direction. Stable for the lifetime of one mount. */
function randomEntryOffset() {
  const angle = Math.random() * Math.PI * 2;
  const dist = 120 + Math.random() * 80; // 120–200px out
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
}

/**
 * A single debate statement that flies in over the speaker, Danganronpa-style.
 * It does not scroll — it enters from a random direction, then gently floats
 * and grows in place. The whole card is clickable: hit it anywhere to fire the
 * selected Truth Bullet at it.
 */
export default function FloatingStatement({
  statement,
  isTargetable,
  isResolved,
  lastShotOutcome,
  onClick,
}: Props) {
  // Stable per mount — re-rolls every rotation because the parent re-keys us.
  const [entry] = useState(randomEntryOffset);

  // Hit/miss shake (mirrors the old StatementCard feedback)
  const shakeVariants: Variants = {
    idle: { x: 0, rotate: 0 },
    hit: { x: [0, -8, 8, -6, 6, 0] },
    miss: { x: [0, -6, 6, -4, 4, 0], rotate: [0, -3, 3, -2, 2, 0] },
  };

  const textClasses = [
    "flying-statement",
    isTargetable && !isResolved ? "targetable" : "",
    isResolved ? "resolved" : "",
    lastShotOutcome === "hit" ? "hit-flash" : "",
    lastShotOutcome === "miss" ? "miss-flash" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // Layer 1: fly-in entrance from a random direction + grow.
    <motion.div
      initial={{ opacity: 0, scale: 0.65, x: entry.x, y: entry.y }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      {/* Layer 2: gentle continuous float + breathe while on screen. */}
      <motion.div
        animate={{ y: [0, -7, 0], scale: [1, 1.035, 1] }}
        transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
      >
        {/* Layer 3: transient hit/miss shake. */}
        <motion.div
          variants={shakeVariants}
          animate={lastShotOutcome ?? "idle"}
          transition={
            lastShotOutcome === "hit"
              ? { duration: 0.45 }
              : lastShotOutcome === "miss"
              ? { duration: 0.5 }
              : { duration: 0.3 }
          }
        >
          {/* Box-less, Danganronpa-style statement text */}
          <div className="relative max-w-[34rem]" onClick={isResolved ? undefined : onClick}>
            <p className={textClasses}>{statement.text}</p>

            {/* CORRECTED stamp */}
            {isResolved && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: -12 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div
                  className="text-[#7ee787] font-black text-3xl border-[4px] border-[#7ee787] px-5 py-2 rounded"
                  style={{
                    textShadow: "0 0 12px #7ee787",
                    boxShadow: "0 0 16px #7ee787",
                    background: "rgb(0 0 0 / 0.5)",
                  }}
                >
                  CORRECTED
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
