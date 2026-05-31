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

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Resting zones for the card, as a percentage of the stage box. The card is
 * centered on the chosen point via translate(-50%, -50%). We deliberately
 * exclude the center column / mid height, where the speaker's face sits, and
 * spread across the upper band and the sides so statements never pile up on the
 * face and rarely land in the same spot twice.
 */
const ZONES: { left: [number, number]; top: [number, number] }[] = [
  { left: [26, 40], top: [13, 25] }, // upper-left
  { left: [44, 56], top: [6, 15] },  // top-center, held high above the head
  { left: [60, 74], top: [13, 25] }, // upper-right
  { left: [22, 34], top: [31, 47] }, // mid-left, clear of the centered body
  { left: [66, 78], top: [31, 47] }, // mid-right
];

/**
 * Roll one statement's whole "personality" for the lifetime of a single mount.
 * Re-rolls every rotation because the parent re-keys us. We vary the resting
 * zone, the entrance, the gentle drift/tilt path, and the exit — so no two
 * appearances feel the same and none of them sit on the speaker's face.
 */
function rollMotion() {
  // Resting placement (CSS, applied to the positioned wrapper).
  const zone = pick(ZONES);
  const place = { left: rand(zone.left[0], zone.left[1]), top: rand(zone.top[0], zone.top[1]) };

  // Entrance style — all offsets are RELATIVE to the resting point (0,0),
  // because the wrapper already positions us at the zone.
  const entryKind = pick(["fly", "slam", "swoop"] as const);
  let initial: { opacity: number; scale: number; x: number; y: number; rotate: number };
  let entryTransition: object;

  if (entryKind === "fly") {
    // Fly in from a random direction.
    const angle = Math.random() * Math.PI * 2;
    const dist = rand(160, 260);
    initial = { opacity: 0, scale: 0.6, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rotate: rand(-6, 6) };
    entryTransition = { type: "spring", stiffness: rand(200, 260), damping: rand(18, 22) };
  } else if (entryKind === "slam") {
    // Drop/punch in from above or below with an overshoot.
    const fromTop = Math.random() < 0.5;
    initial = { opacity: 0, scale: 1.35, x: 0, y: fromTop ? -220 : 220, rotate: rand(-3, 3) };
    entryTransition = { type: "spring", stiffness: rand(320, 420), damping: rand(14, 18) };
  } else {
    // Swoop in from a side with a noticeable tilt that settles.
    const fromLeft = Math.random() < 0.5;
    initial = { opacity: 0, scale: 0.8, x: fromLeft ? -300 : 300, y: 0, rotate: fromLeft ? rand(-14, -8) : rand(8, 14) };
    entryTransition = { type: "spring", stiffness: rand(180, 230), damping: rand(20, 26) };
  }

  // Resting drift + tilt. Nested inside the entry layer, so it oscillates around
  // 0. Slow, randomized, with a random phase so loops never sync up.
  const driftX = rand(5, 11);
  const driftY = rand(5, 10);
  const tilt = rand(1.4, 2.6);
  const drift = {
    x: [0, driftX, -driftX * 0.7, 0],
    y: [0, -driftY, driftY * 0.5, 0],
    rotate: [0, tilt, -tilt * 0.8, 0],
    scale: [1, 1.03, 0.995, 1],
  };
  const driftTransition = {
    duration: rand(4.2, 6),
    ease: "easeInOut" as const,
    repeat: Infinity,
    delay: -rand(0, 4), // negative delay desyncs the phase
  };

  // Exit — drift away + fade, direction also varied (relative to the rest point).
  const exit = {
    opacity: 0,
    scale: rand(0.7, 0.92),
    x: rand(-120, 120),
    y: rand(-90, 90),
    rotate: rand(-12, 12),
    transition: { duration: 0.28, ease: "easeIn" as const },
  };

  return {
    place,
    initial,
    animate: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 },
    entryTransition,
    drift,
    driftTransition,
    exit,
  };
}

/**
 * A single debate statement that flies in over the speaker, Danganronpa-style.
 * It rests in a varied off-center zone (never on the face), enters from a varied
 * direction, gently drifts and tilts in place, then drifts away on exit. The
 * whole card is clickable: hit it anywhere to fire the selected Truth Bullet.
 */
export default function FloatingStatement({
  statement,
  isTargetable,
  isResolved,
  lastShotOutcome,
  onClick,
}: Props) {
  // Stable per mount — re-rolls every rotation because the parent re-keys us.
  const [m] = useState(rollMotion);

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
    // Positioning wrapper: parks the card on its zone, centered on the point.
    <div
      className="absolute pointer-events-auto"
      style={{ left: `${m.place.left}%`, top: `${m.place.top}%`, transform: "translate(-50%, -50%)" }}
    >
      {/* Layer 1: varied fly-in entrance + exit (driven by AnimatePresence in the parent). */}
      <motion.div initial={m.initial} animate={m.animate} exit={m.exit} transition={m.entryTransition}>
        {/* Layer 2: gentle continuous drift + tilt + breathe, relative to the rest point. */}
        <motion.div animate={m.drift} transition={m.driftTransition}>
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
            <div className="relative w-[min(28rem,72vw)]" onClick={isResolved ? undefined : onClick}>
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
    </div>
  );
}
