"use client";

import { useReducer, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { GameConfig } from "@/lib/game/gameTypes";
import {
  classTrialReducer,
  makeInitialState,
  type Action,
} from "./classTrialReducer";
import { playSound } from "@/lib/sound";

import BootScreen        from "./BootScreen";
import CharacterStage    from "./CharacterStage";
import DialogueBox       from "./DialogueBox";
import TrialTimer        from "./TrialTimer";
import BulletInventory   from "./BulletInventory";
import AnswerPreview     from "./AnswerPreview";
import FloatingStatement from "./FloatingStatement";
import ResultsScreen     from "./ResultsScreen";

// How long each statement stays on stage before the debate rotates to the next.
const STATEMENT_WINDOW_MS = 5000;

interface Props {
  game: GameConfig;
}

/**
 * The top-level `'use client'` orchestrator.
 * Holds the reducer, timer effect, feedback-clear effect,
 * and routes on `state.phase` to the correct sub-screen.
 */
export default function ClassTrial({ game }: Props) {
  const [state, dispatchRaw] = useReducer(
    (s: ReturnType<typeof makeInitialState>, a: Action) =>
      classTrialReducer(s, a, game),
    game,
    makeInitialState
  );

  // Stable dispatch wrapper (avoids stale reference in effects)
  const dispatch = useCallback((action: Action) => dispatchRaw(action), [dispatchRaw]);

  // ── Timer: only runs while timerRunning is true ───────────────────────
  useEffect(() => {
    if (!state.timerRunning) return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.timerRunning, dispatch]);

  // ── Clear the shot feedback flash after 600ms ─────────────────────────
  useEffect(() => {
    if (!state.lastShot) return;
    const id = setTimeout(() => dispatch({ type: "CLEAR_LAST_SHOT" }), 650);
    return () => clearTimeout(id);
  }, [state.lastShot, dispatch]);

  // ── Sound: selecting a Truth Bullet ───────────────────────────────────
  useEffect(() => {
    if (state.selectedBulletId) playSound("answer_select");
  }, [state.selectedBulletId]);

  // ── Sound: firing a bullet (shoot, plus a correct chime on a hit) ──────
  useEffect(() => {
    if (!state.lastShot) return;
    playSound("answer_shoot");
    if (state.lastShot.outcome === "hit") {
      const id = setTimeout(() => playSound("correct_answer"), 180);
      return () => clearTimeout(id);
    }
  }, [state.lastShot]);

  // ── Sound: win fanfare (fires the moment the final claim is corrected) ─
  useEffect(() => {
    if (state.pendingWin) playSound("game_win");
  }, [state.pendingWin]);

  // ── Sound: lose sting (timer ran out) ─────────────────────────────────
  useEffect(() => {
    if (state.phase === "results" && state.outcome === "fail") {
      playSound("game_lose");
    }
  }, [state.phase, state.outcome]);

  // ── Debate rotation: cycle to the next statement on a steady beat ──────
  useEffect(() => {
    if (state.phase !== "solving") return;
    const id = setInterval(
      () => dispatch({ type: "NEXT_STATEMENT" }),
      STATEMENT_WINDOW_MS
    );
    return () => clearInterval(id);
  }, [state.phase, dispatch]);

  // ── Once the active statement is corrected, rotate it out promptly ─────
  // (keeps the CORRECTED stamp on screen for a beat, then moves on)
  useEffect(() => {
    if (state.phase !== "solving" || state.pendingWin) return;
    const activeId = game.debate.statements[state.activeStatementIndex]?.id;
    if (!activeId || !state.resolvedStatements[activeId]) return;
    const id = setTimeout(() => dispatch({ type: "NEXT_STATEMENT" }), 1000);
    return () => clearTimeout(id);
  }, [
    state.phase,
    state.pendingWin,
    state.activeStatementIndex,
    state.resolvedStatements,
    game,
    dispatch,
  ]);

  // ── On a win, hold the final CORRECTED animation, then go to conclusion ─
  useEffect(() => {
    if (!state.pendingWin) return;
    const id = setTimeout(() => dispatch({ type: "ENTER_WIN_CONCLUSION" }), 1400);
    return () => clearTimeout(id);
  }, [state.pendingWin, dispatch]);

  // ─── Derive the active speaker for CharacterStage ─────────────────────
  const activeSpeakerId = (() => {
    if (state.phase === "intro" || state.phase === "tutorial" ||
        state.phase === "winConclusion") {
      const line = state.dialogueScript[state.dialogueIndex];
      return line?.speakerId ?? null;
    }
    // During the debate, the student currently speaking is the one on stage.
    if (state.phase === "solving") {
      return game.debate.statements[state.activeStatementIndex]?.speakerId ?? null;
    }
    return null;
  })();

  // ─── Phase → screen ────────────────────────────────────────────────────
  const { phase } = state;

  if (phase === "boot") {
    return (
      <BootScreen onDone={() => dispatch({ type: "BOOT_DONE" })} />
    );
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        config={game}
        outcome={state.outcome ?? "fail"}
        mistakes={state.mistakes}
        timeLeft={state.timeLeft}
        resolvedStatements={state.resolvedStatements}
        onReset={() => dispatch({ type: "RESET" })}
      />
    );
  }

  if (phase === "answerPreview") {
    return (
      <AnswerPreview
        bullets={game.debate.answers}
        onStart={() => dispatch({ type: "START_SOLVING" })}
      />
    );
  }

  // Dialogue phases (intro / tutorial / winConclusion)
  const isDialoguePhase =
    phase === "intro" ||
    phase === "tutorial" ||
    phase === "winConclusion";

  const currentLine = state.dialogueScript[state.dialogueIndex];
  const activeStatement = game.debate.statements[state.activeStatementIndex];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden select-none" style={{ backgroundImage: "url('/backgrounds/classroom.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>

      {/* ── HUD row: topic name + timer ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
        <span
          className="text-[0.85rem] font-black tracking-widest uppercase text-[#57c7ff]/70"
          style={{ textShadow: "0 0 8px #57c7ff" }}
        >
          Class Trial — {game.topic.name}
        </span>

        {/* Timer only visible during solving */}
        <AnimatePresence>
          {phase === "solving" && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <TrialTimer timeLeft={state.timeLeft} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Phase-specific content (flexible centre) ──────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Dialogue phases: big speaker sprite underneath, dialogue box layered on top */}
        {isDialoguePhase && (
          <div className="relative flex-1 min-h-0 flex flex-col justify-end">
            {/* Character layer (below) */}
            <div className="absolute inset-0">
              <CharacterStage
                characters={game.characters}
                activeSpeakerId={activeSpeakerId}
              />
            </div>

            {/* Dialogue layer (above the character) */}
            <AnimatePresence mode="wait">
              {currentLine && (
                <motion.div
                  key={`dialogue-${state.dialogueIndex}-${phase}`}
                  className="relative z-10 shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DialogueBox
                    line={currentLine}
                    characters={game.characters}
                    isComplete={state.isLineComplete}
                    onLineTyped={() => dispatch({ type: "LINE_TYPED" })}
                    onInteract={() => dispatch({ type: "ADVANCE_DIALOGUE" })}
                    onChoice={(value) =>
                      dispatch(
                        value === "skip"
                          ? { type: "SKIP_TUTORIAL" }
                          : { type: "ADVANCE_DIALOGUE" }
                      )
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Solving phase — one student speaks, their statement floats over them */}
        {phase === "solving" && activeStatement && (
          <motion.div
            key="solving"
            className="flex-1 min-h-0 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Stage: speaker in the background, statement card flying over them */}
            <div className="relative flex-1 min-h-0">
              <div className="absolute inset-0">
                <CharacterStage
                  characters={game.characters}
                  activeSpeakerId={activeSpeakerId}
                />
              </div>

              <div className="absolute inset-0 px-4 pointer-events-none">
                <AnimatePresence mode="wait">
                  <FloatingStatement
                    key={state.statementShowKey}
                    statement={activeStatement}
                    isTargetable={
                      state.selectedBulletId !== null &&
                      !state.resolvedStatements[activeStatement.id]
                    }
                    isResolved={!!state.resolvedStatements[activeStatement.id]}
                    lastShotOutcome={
                      state.lastShot?.statementId === activeStatement.id
                        ? state.lastShot.outcome
                        : null
                    }
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 my-2.5 h-px bg-gradient-to-r from-transparent via-[#57c7ff]/30 to-transparent shrink-0" />

            {/* Bullet inventory */}
            <BulletInventory
              bullets={game.debate.answers}
              usedBullets={state.usedBullets}
              onDragStartBullet={(bulletId) =>
                dispatch({ type: "SELECT_BULLET", bulletId })
              }
              onDragCancel={() =>
                dispatch({ type: "SELECT_BULLET", bulletId: null })
              }
              onFire={(statementId, bulletId) =>
                dispatch({ type: "FIRE_AT", statementId, bulletId })
              }
            />
          </motion.div>
        )}

      </div>

      {/* ── Phase label watermark (tutorial only; solving shows the timer) ── */}
      {phase === "tutorial" && (
        <div
          className="absolute top-2 right-3 text-xs uppercase tracking-widest font-bold pointer-events-none"
          style={{ color: "rgb(87 199 255 / 0.4)" }}
        >
          Tutorial
        </div>
      )}
    </div>
  );
}
