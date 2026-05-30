// ─── Scoring constants (tune freely during the hackathon) ─────────────────
export const SCORE_BASE       = 1000; // flat bonus awarded on success
export const SCORE_HIT        = 250;  // per correct bullet-on-wrong-statement
export const SCORE_MISS_PEN   = 75;   // deducted per wrong shot (floored at 0)
export const SCORE_TIME_BONUS = 5;    // multiplied by seconds remaining

// ─── Final score computation ───────────────────────────────────────────────
export function finalScore(opts: {
  outcome: "success" | "fail";
  solved:  number;   // number of wrong statements correctly resolved
  mistakes: number;
  timeLeft: number;  // seconds remaining when game ended
}): number {
  const { outcome, solved, mistakes, timeLeft } = opts;

  const hits    = solved   * SCORE_HIT;
  const penalty = mistakes * SCORE_MISS_PEN;

  if (outcome === "success") {
    return Math.max(0, SCORE_BASE + hits - penalty + timeLeft * SCORE_TIME_BONUS);
  }
  return Math.max(0, hits - penalty);
}
