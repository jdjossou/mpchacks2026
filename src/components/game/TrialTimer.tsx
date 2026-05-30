"use client";

import { motion } from "framer-motion";

interface Props {
  timeLeft: number; // seconds
}

const URGENT_THRESHOLD = 20; // seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Countdown timer display — purely presentational.
 * Turns red and pulses when timeLeft < URGENT_THRESHOLD.
 */
export default function TrialTimer({ timeLeft }: Props) {
  const urgent = timeLeft <= URGENT_THRESHOLD;

  return (
    <div className="flex items-center gap-2">
      {/* Clock icon */}
      <span
        className="text-base"
        style={{
          filter: urgent ? "drop-shadow(0 0 6px #ff5555)" : "none",
          transition: "filter 0.3s",
        }}
      >
        ⏱
      </span>

      <motion.span
        className={`timer-display text-lg font-bold tabular-nums ${urgent ? "timer-urgent" : "text-[#9fe9ff]"}`}
        style={{
          textShadow: urgent ? "0 0 12px #ff5555" : "0 0 10px #57c7ff",
          fontFamily: "var(--font-mono)",
        }}
        key={urgent ? "urgent" : "normal"} // re-mount animation on urgency change
        animate={urgent ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={urgent ? { duration: 0.6, repeat: Infinity } : {}}
      >
        {formatTime(timeLeft)}
      </motion.span>
    </div>
  );
}
