"use client";

import { motion } from "framer-motion";
import type { AnswerBullet } from "@/lib/game/gameTypes";

interface Props {
  bullets: AnswerBullet[];
  onStart: () => void;
}

/**
 * Shown after the tutorial, before the timed debate begins.
 * Lets the player read all the Truth Bullets up front (full text) so they
 * know their options, then a "Start Debate" click drops them into the debate.
 */
export default function AnswerPreview({ bullets, onStart }: Props) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-5 py-4 overflow-y-auto"
      style={{ background: "#050e1a" }}
    >
      <motion.div
        className="w-full max-w-md flex flex-col"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Heading */}
        <div className="text-center mb-1">
          <h2
            className="text-[#9fe9ff] font-black tracking-widest uppercase text-sm"
            style={{ textShadow: "0 0 10px #57c7ff" }}
          >
            Your Truth Bullets
          </h2>
          <p className="text-[#9fe9ff]/60 text-[0.65rem] mt-0.5">
            Study these now — once the debate starts, the clock is ticking.
          </p>
        </div>

        {/* Bullet list (full text, no clamp) */}
        <div className="flex flex-col gap-2 my-3">
          {bullets.map((b, i) => (
            <motion.div
              key={b.id}
              className="statement-card px-3 py-2"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="text-[#9fe9ff] text-sm leading-none mt-0.5"
                  aria-hidden="true"
                >
                  ◇
                </span>
                <p
                  className="text-white text-[0.75rem] leading-snug font-medium"
                  style={{ textShadow: "0 1px 3px rgb(0 0 0 / 0.8)" }}
                >
                  {b.text}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Start button */}
        <motion.button
          className="aero-button aero-button-selected px-4 py-2 text-sm font-black tracking-widest uppercase self-center"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
        >
          ▶ Start Debate
        </motion.button>
      </motion.div>
    </div>
  );
}
