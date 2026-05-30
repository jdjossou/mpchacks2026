"use client";

import { useReducer, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

import type { GameConfig } from "@/lib/game/gameTypes";
import {
  classTrialReducer,
  makeInitialState,
  type Action,
} from "./classTrialReducer";

import BootScreen        from "./BootScreen";
import CharacterStage    from "./CharacterStage";
import DialogueBox       from "./DialogueBox";
import TrialTimer        from "./TrialTimer";
import BulletInventory   from "./BulletInventory";
import AnswerPreview     from "./AnswerPreview";
import FloatingStatement from "./FloatingStatement";
import ResultsScreen     from "./ResultsScreen";

// How long each statement stays on stage before the debate rotates to the next.
const STATEMENT_WINDOW_MS = 3500;

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
    if (state.phase !== "solving") return;
    const activeId = game.debate.statements[state.activeStatementIndex]?.id;
    if (!activeId || !state.resolvedStatements[activeId]) return;
    const id = setTimeout(() => dispatch({ type: "NEXT_STATEMENT" }), 1000);
    return () => clearTimeout(id);
  }, [
    state.phase,
    state.activeStatementIndex,
    state.resolvedStatements,
    game,
    dispatch,
  ]);

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
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundImage: "url('/backgrounds/classroom.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}>

      {/* ── HUD row: topic name + timer ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1 shrink-0">
        <span
          className="text-[0.6rem] font-black tracking-widest uppercase text-[#57c7ff]/70"
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

        {/* Dialogue phases: speaker centered on stage + dialogue box anchored low */}
        {isDialoguePhase && (
          <>
            <CharacterStage
              characters={game.characters}
              activeSpeakerId={activeSpeakerId}
            />

            <AnimatePresence mode="wait">
              {currentLine && (
                <motion.div
                  key={`dialogue-${state.dialogueIndex}-${phase}`}
                  className="shrink-0"
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
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
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

              <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
                <div className="pointer-events-auto">
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
                    onClick={() =>
                      dispatch({ type: "FIRE_AT", statementId: activeStatement.id })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-3 my-1.5 h-px bg-gradient-to-r from-transparent via-[#57c7ff]/30 to-transparent shrink-0" />

            {/* Bullet inventory */}
            <BulletInventory
              bullets={game.debate.answers}
              selectedBulletId={state.selectedBulletId}
              usedBullets={state.usedBullets}
              onSelect={(bulletId) =>
                dispatch({ type: "SELECT_BULLET", bulletId })
              }
            />
          </motion.div>
        )}

      </div>

      {/* ── Phase label watermark (tutorial only; solving shows the timer) ── */}
      {phase === "tutorial" && (
        <div
          className="absolute top-2 right-3 text-[0.55rem] uppercase tracking-widest font-bold pointer-events-none"
          style={{ color: "rgb(87 199 255 / 0.4)" }}
        >
          Tutorial
        </div>
      )}
    </div>
  );
}
