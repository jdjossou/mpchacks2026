"use client";

import { motion } from "framer-motion";
import type { GameConfig } from "@/lib/game/gameTypes";
import { finalScore, SCORE_BASE, SCORE_HIT, SCORE_TIME_BONUS } from "@/lib/game/scoring";
import { solvedCount } from "@/lib/game/selectors";

interface Props {
  config: GameConfig;
  outcome: "success" | "fail";
  mistakes: number;
  timeLeft: number;
  resolvedStatements: Record<string, true>;
  onReset: () => void;
}

export default function ResultsScreen({
  config,
  outcome,
  mistakes,
  timeLeft,
  resolvedStatements,
  onReset,
}: Props) {
  const solved = solvedCount(config, resolvedStatements);
  const total  = config.debate.statements.filter((s) => s.type === "wrong").length;
  const score  = finalScore({ outcome, solved, mistakes, timeLeft });

  const isWin = outcome === "success";

  return (
    <motion.div
      className="w-full h-full overflow-y-auto flex flex-col items-center"
      style={{
        background: isWin
          ? "linear-gradient(160deg, #0a1e40 0%, #0e2a5a 50%, #081630 100%)"
          : "linear-gradient(160deg, #200a0a 0%, #3a1010 50%, #150505 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Inner stack: my-auto centers it when short, but every edge stays
          reachable when the content is taller than the screen. */}
      <div className="flex flex-col items-center gap-3 px-4 py-5 my-auto w-full">

      {/* Result banner */}
      <motion.div
        className="text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.2 }}
      >
        <div
          className="text-4xl font-black tracking-widest uppercase"
          style={{
            color: isWin ? "#7ee787" : "#ff5555",
            textShadow: isWin
              ? "0 0 24px #7ee787, 0 0 48px #7ee787"
              : "0 0 24px #ff5555, 0 0 48px #ff4444",
          }}
        >
          {isWin ? "✓ Case Closed!" : "✗ Time's Up!"}
        </div>
        <p className="text-[#9fe9ff] text-xs mt-1 tracking-wide">
          {isWin
            ? "You identified all false claims."
            : "You ran out of time before correcting all mistakes."}
        </p>
      </motion.div>

      {/* Score card */}
      <motion.div
        className="aero-glass w-full max-w-sm p-4"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Big score */}
        <div className="text-center mb-3">
          <p className="text-[0.6rem] text-[#9fe9ff]/70 uppercase tracking-widest mb-0.5">
            Final Score
          </p>
          <motion.p
            className="text-5xl font-black"
            style={{
              color: isWin ? "#7ee787" : "#ffd07a",
              textShadow: isWin ? "0 0 16px #7ee787" : "0 0 16px #ffd07a",
              fontFamily: "var(--font-mono)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {score.toLocaleString()}
          </motion.p>
        </div>

        {/* Score breakdown */}
        <div className="space-y-1.5 border-t border-white/20 pt-3">
          <ScoreLine label="Statements Corrected" value={`${solved} / ${total}`} positive />
          {isWin && (
            <ScoreLine
              label={`Base Reward`}
              value={`+${SCORE_BASE}`}
              positive
            />
          )}
          <ScoreLine
            label={`Hits (×${SCORE_HIT})`}
            value={`+${solved * SCORE_HIT}`}
            positive
          />
          <ScoreLine
            label="Wrong Shots"
            value={`${mistakes}`}
            positive={mistakes === 0}
          />
          {isWin && (
            <ScoreLine
              label={`Time Bonus (${timeLeft}s × ${SCORE_TIME_BONUS})`}
              value={`+${timeLeft * SCORE_TIME_BONUS}`}
              positive
            />
          )}
        </div>
      </motion.div>

      {/* Bullet explanations */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <p className="text-[0.6rem] text-[#9fe9ff]/70 uppercase tracking-widest mb-1.5">
          Bullet Explanations
        </p>
        <div className="space-y-1.5">
          {config.debate.answers.map((bullet) => {
            const target = config.debate.statements.find(
              (s) => s.id === bullet.targetsStatementId
            );
            return (
              <div
                key={bullet.id}
                className="aero-glass-dark px-3 py-2 text-xs"
                style={{ borderRadius: "0.5rem" }}
              >
                <p className="font-semibold text-[#9fe9ff] mb-0.5">
                  {bullet.type === "wrong" ? "🚫 Red Herring: " : "✓ "}
                  {bullet.text}
                </p>
                {target && (
                  <p className="text-white/60 text-[0.65rem] italic">
                    Corrects: "{target.text.slice(0, 60)}…"
                  </p>
                )}
                <p className="text-white/80 mt-0.5">{bullet.explanation}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Play again */}
      <motion.button
        className="aero-button px-8 py-2.5 text-sm font-bold tracking-wide mt-2"
        onClick={onReset}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        ↺ Play Again
      </motion.button>

      </div>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function ScoreLine({
  label,
  value,
  positive,
}: {
  label: string;
  value: string | number;
  positive: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-white/70">{label}</span>
      <span
        className="font-bold tabular-nums"
        style={{ color: positive ? "#7ee787" : "#ff7070" }}
      >
        {value}
      </span>
    </div>
  );
}
