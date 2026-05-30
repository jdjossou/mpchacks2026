import type { GameConfig, DialogueLine } from "@/lib/game/gameTypes";
import { tutorialScript } from "@/lib/game/tutorialScript";
import { isWon } from "@/lib/game/selectors";
import { SCORE_HIT, SCORE_MISS_PEN } from "@/lib/game/scoring";

// ─── Phase ────────────────────────────────────────────────────────────────
export type Phase =
  | "boot"             // CRT power-on animation
  | "intro"            // teacher: data-driven topic intro
  | "tutorial"         // teacher: hard-coded mechanics explanation
  | "answerPreview"    // player reads the 3 truth bullets before the debate
  | "solving"          // interactive: a student speaks a statement, timer running
  | "winConclusion"    // teacher conclusion line after win
  | "results";         // success/fail summary screen

// ─── State ────────────────────────────────────────────────────────────────
export type GameState = {
  phase: Phase;

  // Dialogue driver (shared across intro / tutorial / statementPresent / winConclusion)
  dialogueScript: DialogueLine[];
  dialogueIndex: number;
  isLineComplete: boolean;

  // Interactive solving
  activeStatementIndex: number;             // which statement is on stage
  statementShowKey: number;                 // bumps each rotation → re-mounts the floating card
  selectedBulletId: string | null;
  resolvedStatements: Record<string, true>; // statementId → solved
  usedBullets: Record<string, true>;        // bulletId → consumed
  lastShot: {
    bulletId: string;
    statementId: string;
    outcome: "hit" | "miss";
  } | null;

  // Scoring / stats
  mistakes: number;
  score: number;

  // Timer
  timeLeft: number;    // seconds, starts at 120
  timerRunning: boolean;

  // End
  outcome: "success" | "fail" | null;
};

// ─── Actions ──────────────────────────────────────────────────────────────
export type Action =
  | { type: "BOOT_DONE" }
  | { type: "ADVANCE_DIALOGUE" }
  | { type: "LINE_TYPED" }
  | { type: "SKIP_LINE" }
  | { type: "START_SOLVING" }
  | { type: "NEXT_STATEMENT" }
  | { type: "SELECT_BULLET"; bulletId: string }
  | { type: "FIRE_AT"; statementId: string }
  | { type: "TICK" }
  | { type: "CLEAR_LAST_SHOT" }
  | { type: "GO_RESULTS" }
  | { type: "RESET" };

// ─── Initial state factory ─────────────────────────────────────────────────
export function makeInitialState(): GameState {
  return {
    phase: "boot",
    dialogueScript: [],
    dialogueIndex: 0,
    isLineComplete: false,
    activeStatementIndex: 0,
    statementShowKey: 0,
    selectedBulletId: null,
    resolvedStatements: {},
    usedBullets: {},
    lastShot: null,
    mistakes: 0,
    score: 0,
    timeLeft: 120,
    timerRunning: false,
    outcome: null,
  };
}

// ─── Helper: index of the next statement to put on stage ──────────────────
// Walks forward from `fromIndex` (wrapping) to the next statement that is not
// yet resolved, so corrected claims drop out of the rotation. If every
// statement is resolved it just returns `fromIndex` (the win check fires first).
function nextStatementIndex(
  config: GameConfig,
  resolved: Record<string, true>,
  fromIndex: number
): number {
  const statements = config.debate.statements;
  const n = statements.length;
  for (let step = 1; step <= n; step++) {
    const idx = (fromIndex + step) % n;
    if (!resolved[statements[idx].id]) return idx;
  }
  return fromIndex;
}

// ─── Helper: first statement to show when the debate opens ────────────────
function firstStatementIndex(
  config: GameConfig,
  resolved: Record<string, true>
): number {
  const idx = config.debate.statements.findIndex((s) => !resolved[s.id]);
  return idx === -1 ? 0 : idx;
}

// ─── Reducer ──────────────────────────────────────────────────────────────
export function classTrialReducer(
  state: GameState,
  action: Action,
  config: GameConfig
): GameState {
  switch (action.type) {

    // ── boot → intro ──────────────────────────────────────────────────────
    case "BOOT_DONE":
      return {
        ...state,
        phase: "intro",
        dialogueScript: [config.intro],
        dialogueIndex: 0,
        isLineComplete: false,
      };

    // ── Typewriter completed the current line ──────────────────────────────
    case "LINE_TYPED":
      return { ...state, isLineComplete: true };

    // ── Skip current line (show it instantly) ─────────────────────────────
    case "SKIP_LINE":
      return { ...state, isLineComplete: true };

    // ── Advance through dialogue script ───────────────────────────────────
    case "ADVANCE_DIALOGUE": {
      const nextIndex = state.dialogueIndex + 1;

      // Still lines left in the current script
      if (nextIndex < state.dialogueScript.length) {
        return { ...state, dialogueIndex: nextIndex, isLineComplete: false };
      }

      // End of intro → load tutorial
      if (state.phase === "intro") {
        return {
          ...state,
          phase: "tutorial",
          dialogueScript: tutorialScript,
          dialogueIndex: 0,
          isLineComplete: false,
        };
      }

      // End of tutorial → show the truth-bullet preview (no dialogue script)
      if (state.phase === "tutorial") {
        return {
          ...state,
          phase: "answerPreview",
          dialogueScript: [],
          dialogueIndex: 0,
          isLineComplete: false,
        };
      }

      // End of winConclusion → results (success)
      if (state.phase === "winConclusion") {
        return classTrialReducer(state, { type: "GO_RESULTS" }, config);
      }

      return state;
    }

    // ── Transition to solving phase ────────────────────────────────────────
    case "START_SOLVING":
      return {
        ...state,
        phase: "solving",
        dialogueScript: [],
        dialogueIndex: 0,
        isLineComplete: false,
        activeStatementIndex: firstStatementIndex(config, state.resolvedStatements),
        statementShowKey: 0,
        timerRunning: true,
      };

    // ── Rotate to the next unresolved statement ────────────────────────────
    case "NEXT_STATEMENT": {
      if (state.phase !== "solving") return state;
      return {
        ...state,
        activeStatementIndex: nextStatementIndex(
          config,
          state.resolvedStatements,
          state.activeStatementIndex
        ),
        statementShowKey: state.statementShowKey + 1,
      };
    }

    // ── Timer tick ────────────────────────────────────────────────────────
    case "TICK": {
      if (state.phase !== "solving") return state;
      const newTime = state.timeLeft - 1;
      if (newTime <= 0) {
        return {
          ...state,
          timeLeft: 0,
          timerRunning: false,
          outcome: "fail",
          phase: "results",
        };
      }
      return { ...state, timeLeft: newTime };
    }

    // ── Select / deselect a bullet ────────────────────────────────────────
    case "SELECT_BULLET": {
      if (state.usedBullets[action.bulletId]) return state; // already consumed
      const sameSelected = state.selectedBulletId === action.bulletId;
      return {
        ...state,
        selectedBulletId: sameSelected ? null : action.bulletId,
      };
    }

    // ── Fire a bullet at a statement ──────────────────────────────────────
    case "FIRE_AT": {
      const { statementId } = action;
      const { selectedBulletId } = state;

      // Guard: must have a bullet selected
      if (!selectedBulletId) return state;
      // Guard: already resolved
      if (state.resolvedStatements[statementId]) return state;

      const bullet = config.debate.answers.find((b) => b.id === selectedBulletId);
      const stmt   = config.debate.statements.find((s) => s.id === statementId);
      if (!bullet || !stmt) return state;

      // Check for a correct hit (both directions of the link must match)
      const isHit =
        bullet.type === "correct" &&
        bullet.targetsStatementId === stmt.id &&
        stmt.type === "wrong" &&
        stmt.correctAnswerId === bullet.id;

      if (isHit) {
        const newResolved = { ...state.resolvedStatements, [statementId]: true as const };
        const newUsed     = { ...state.usedBullets, [selectedBulletId]: true as const };
        const newScore    = state.score + SCORE_HIT;

        const won = isWon(config, newResolved);

        const nextState: GameState = {
          ...state,
          resolvedStatements: newResolved,
          usedBullets: newUsed,
          score: newScore,
          selectedBulletId: null,
          lastShot: { bulletId: selectedBulletId, statementId, outcome: "hit" },
          // The corrected card keeps its CORRECTED stamp on screen briefly;
          // ClassTrial dispatches NEXT_STATEMENT shortly after to rotate it out.
          // If won: stop timer, transition to winConclusion
          timerRunning: won ? false : state.timerRunning,
          phase: won ? "winConclusion" : state.phase,
          dialogueScript: won ? [config.conclusion] : state.dialogueScript,
          dialogueIndex: won ? 0 : state.dialogueIndex,
          isLineComplete: won ? false : state.isLineComplete,
        };
        return nextState;
      }

      // Miss: penalty, bullet NOT consumed (forgiving)
      const newMistakes = state.mistakes + 1;
      const newScore    = Math.max(0, state.score - SCORE_MISS_PEN);
      return {
        ...state,
        mistakes: newMistakes,
        score: newScore,
        selectedBulletId: null,
        lastShot: { bulletId: selectedBulletId, statementId, outcome: "miss" },
      };
    }

    // ── Clear the transient shot feedback ─────────────────────────────────
    case "CLEAR_LAST_SHOT":
      return { ...state, lastShot: null };

    // ── Transition to results ─────────────────────────────────────────────
    case "GO_RESULTS":
      return {
        ...state,
        phase: "results",
        outcome: "success",
        timerRunning: false,
      };

    // ── Reset to initial state ────────────────────────────────────────────
    case "RESET":
      return makeInitialState();

    default:
      return state;
  }
}
