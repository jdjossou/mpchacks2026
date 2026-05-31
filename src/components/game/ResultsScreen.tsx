"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { GameConfig } from "@/lib/game/gameTypes";
import { finalScore, SCORE_BASE, SCORE_HIT, SCORE_TIME_BONUS } from "@/lib/game/scoring";
import { solvedCount } from "@/lib/game/selectors";
import { slugify } from "@/lib/game/generatedGame";

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
  const grade = gradeFor(score, isWin);
  const medal = MEDAL[grade];

  const scoreColor = isWin ? "#7ee787" : "#ffd07a";

  // Export the full game definition as a .clashroom file (JSON under the hood).
  function handleDownload() {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const slug = slugify(config.topic.name) || config.id || "clashroom-game";

    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.clashroom`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      className="relative w-full h-full overflow-y-auto flex flex-col items-center"
      style={{
        background: isWin
          ? "linear-gradient(160deg, #0a1e40 0%, #0e2a5a 50%, #081630 100%)"
          : "linear-gradient(160deg, #200a0a 0%, #3a1010 50%, #150505 100%)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Decorative CRT-arcade layer: floating bubbles + scanlines (theme reuse) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            className="aero-bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              bottom: "-20%",
              animationDuration: b.dur,
              animationDelay: b.delay,
            }}
          />
        ))}
        <div className="scanlines" />
      </div>

      {/* Inner stack: my-auto centers it when short, but every edge stays
          reachable when the content is taller than the screen. */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 py-6 my-auto w-full">

      {/* Result banner — arcade marquee */}
      <motion.div
        className="text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.2 }}
      >
        <div
          className="text-5xl font-black tracking-widest uppercase"
          style={{
            color: isWin ? "#7ee787" : "#ff5555",
            textShadow: isWin
              ? "0 0 24px #7ee787, 0 0 48px #7ee787"
              : "0 0 24px #ff5555, 0 0 48px #ff4444",
          }}
        >
          {isWin ? "✓ Case Closed!" : "✗ Time's Up!"}
        </div>
        <p
          className="text-[#dff6ff] text-base mt-1 tracking-wide"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
        >
          {isWin
            ? "You identified all false claims."
            : "You ran out of time before correcting all mistakes."}
        </p>
      </motion.div>

      {/* Score card */}
      <motion.div
        className="aero-glass w-full max-w-lg p-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Rank medal + big HIGH SCORE readout */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {/* Rank medal */}
          <motion.div
            className="arcade-rank-medal w-24 h-24 shrink-0"
            style={
              {
                "--medal-from": medal.from,
                "--medal-to": medal.to,
                "--medal-ring": medal.ring,
                "--medal-glow": medal.glow,
              } as React.CSSProperties
            }
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 14, delay: 0.7 }}
          >
            <div className="flex flex-col items-center leading-none">
              <span
                className="text-[0.55rem] font-bold uppercase tracking-[0.2em]"
                style={{ color: medal.text, opacity: 0.8 }}
              >
                Rank
              </span>
              <span
                className="text-5xl font-black"
                style={{
                  color: medal.text,
                  fontFamily: "var(--font-mono)",
                  textShadow: "0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                {grade}
              </span>
            </div>
          </motion.div>

          {/* HIGH SCORE */}
          <div className="text-left">
            <p
              className="text-xs uppercase tracking-[0.25em] mb-0.5 text-[#9fe9ff]"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
            >
              High Score
            </p>
            <motion.p
              className="text-6xl font-black tabular-nums"
              style={{
                color: scoreColor,
                fontFamily: "var(--font-mono)",
                animation: "arcade-score-glow 2.2s ease-in-out infinite",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <CountUp value={score} delay={900} />
            </motion.p>
          </div>
        </div>

        {/* Score breakdown — leaderboard table */}
        <div className="arcade-chrome-bar px-3 py-1.5 mb-2 text-center text-xs font-black uppercase tracking-[0.2em]">
          Score Breakdown
        </div>
        <div className="space-y-1.5">
          <ScoreLine index={0} label="Statements Corrected" value={`${solved} / ${total}`} positive />
          {isWin && (
            <ScoreLine index={1} label="Base Reward" value={`+${SCORE_BASE}`} positive />
          )}
          <ScoreLine index={2} label={`Hits (×${SCORE_HIT})`} value={`+${solved * SCORE_HIT}`} positive />
          <ScoreLine index={3} label="Wrong Shots" value={`${mistakes}`} positive={mistakes === 0} />
          {isWin && (
            <ScoreLine
              index={4}
              label={`Time Bonus (${timeLeft}s × ${SCORE_TIME_BONUS})`}
              value={`+${timeLeft * SCORE_TIME_BONUS}`}
              positive
            />
          )}
        </div>
      </motion.div>

      {/* Bullet explanations */}
      <motion.div
        className="w-full max-w-lg"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <p
          className="text-xs uppercase tracking-[0.2em] mb-2 text-[#9fe9ff]"
          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
        >
          Bullet Explanations
        </p>
        <div className="space-y-2">
          {config.debate.answers.map((bullet) => {
            const target = config.debate.statements.find(
              (s) => s.id === bullet.targetsStatementId
            );
            const isRedHerring = bullet.type === "wrong";
            return (
              <div key={bullet.id} className="arcade-explain-card px-4 py-3">
                <p
                  className="font-bold mb-0.5"
                  style={{ color: isRedHerring ? "#ff9a8a" : "#8df0a3" }}
                >
                  {isRedHerring ? "🚫 Red Herring: " : "✓ "}
                  {bullet.text}
                </p>
                {target && (
                  <p className="text-[#bcd9ee] text-sm italic">
                    {`Corrects: "${target.text.slice(0, 60)}..."`}
                  </p>
                )}
                <p className="text-[#eaf6ff] mt-0.5">{bullet.explanation}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.button
          className="aero-button px-10 py-3 text-base font-bold tracking-wide"
          onClick={onReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          ↺ Play Again
        </motion.button>
        <motion.button
          className="glossy-button-green glossy-shimmer px-8 py-3 text-base font-bold tracking-wide rounded-full"
          onClick={handleDownload}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          ⬇ Save .clashroom
        </motion.button>
      </motion.div>

      </div>
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function ScoreLine({
  index,
  label,
  value,
  positive,
}: {
  index: number;
  label: string;
  value: string | number;
  positive: boolean;
}) {
  return (
    <div
      className="leaderboard-row text-base"
      style={{
        background: index % 2 === 0 ? "rgb(255 255 255 / 0.06)" : "rgb(255 255 255 / 0.02)",
      }}
    >
      <span
        className="text-[#dff6ff]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
      >
        {label}
      </span>
      <span
        className="font-bold tabular-nums"
        style={{
          color: positive ? "#7ee787" : "#ff7070",
          fontFamily: "var(--font-mono)",
          textShadow: "0 0 8px currentColor",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Derive an arcade letter grade from the final score. */
function gradeFor(score: number, isWin: boolean): "S" | "A" | "B" | "C" | "D" {
  if (isWin && score >= 2200) return "S";
  if (score >= 1600) return "A";
  if (score >= 1000) return "B";
  if (score >= 500) return "C";
  return "D";
}

/** Glossy gel theme per grade (medal fill, ring, glow, and inner text color). */
const MEDAL: Record<
  "S" | "A" | "B" | "C" | "D",
  { from: string; to: string; ring: string; glow: string; text: string }
> = {
  S: { from: "#fff1b8", to: "#e0a83a", ring: "rgb(255 215 100 / 0.7)", glow: "rgb(255 200 60 / 0.8)",  text: "#3a2600" },
  A: { from: "#b5f0a5", to: "#3ab85e", ring: "rgb(126 231 135 / 0.7)", glow: "rgb(126 231 135 / 0.8)", text: "#06371b" },
  B: { from: "#a8e4ff", to: "#2e90d8", ring: "rgb(87 199 255 / 0.6)",  glow: "rgb(87 199 255 / 0.75)", text: "#062a44" },
  C: { from: "#f4f4f5", to: "#a1a1aa", ring: "rgb(220 220 230 / 0.6)", glow: "rgb(200 200 210 / 0.6)", text: "#27272a" },
  D: { from: "#ffcaa8", to: "#c0683a", ring: "rgb(255 150 100 / 0.6)", glow: "rgb(255 130 80 / 0.65)", text: "#3a1500" },
};

/** Static positions/timing for the decorative floating bubbles. */
const BUBBLES = [
  { left: "8%",  size: "70px",  dur: "13s", delay: "0s" },
  { left: "28%", size: "44px",  dur: "17s", delay: "3s" },
  { left: "62%", size: "90px",  dur: "15s", delay: "1.5s" },
  { left: "82%", size: "52px",  dur: "19s", delay: "5s" },
];

/** Eased count-up for the big score readout. */
function CountUp({ value, duration = 1000, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    let raf = 0;
    let start: number | undefined;

    const tick = (ts: number) => {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  return <>{n.toLocaleString()}</>;
}
