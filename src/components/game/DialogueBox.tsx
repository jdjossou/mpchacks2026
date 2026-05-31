"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { DialogueLine, Character } from "@/lib/game/gameTypes";
import { useTypewriter } from "./useTypewriter";

interface Props {
  line: DialogueLine;
  characters: Character[];
  isComplete: boolean;
  onLineTyped: () => void;
  /** Called when the user clicks: skip if typing, advance if done */
  onInteract: () => void;
  /** Called with a choice's value when the line is a branching prompt */
  onChoice?: (value: string) => void;
}

/**
 * Renders the current dialogue line with a typewriter effect.
 * Clicking skips the animation or advances to the next line.
 */
export default function DialogueBox({
  line,
  characters,
  isComplete,
  onLineTyped,
  onInteract,
  onChoice,
}: Props) {
  const speaker = characters.find((c) => c.id === line.speakerId);
  const hasChoices = !!line.choices?.length;

  const { displayed, skip } = useTypewriter(line.text, {
    speed: 25,
    onDone: onLineTyped,
  });

  // When the external state says "line is complete", make sure the text is revealed
  useEffect(() => {
    if (isComplete) skip();
  // skip changes identity every render — intentionally ignoring it here;
  // we only want to run this when isComplete flips to true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handleClick = () => {
    if (!isComplete) {
      skip(); // reveal text instantly
    } else if (!hasChoices) {
      onInteract(); // advance to next line (choice lines wait for a pick)
    }
  };

  return (
    <div
      className="dialogue-box mx-5 mb-5 select-none"
      style={{ minHeight: "150px", cursor: hasChoices && isComplete ? "default" : "pointer" }}
      onClick={handleClick}
      role="button"
      aria-label="Click to continue dialogue"
    >
      {/* Name plate */}
      {speaker && (
        <div className="name-plate">{speaker.name}</div>
      )}

      {/* Text area */}
      <div className="px-6 py-4">
        {/* The box height is reserved up-front by an invisible "ghost" copy of the
            full line, so the box never grows while the typewriter reveals text. */}
        <div className="relative">
          <p
            className="text-lg leading-relaxed min-h-[4.5rem] invisible"
            aria-hidden="true"
          >
            {line.text}
          </p>
          <p
            className="absolute inset-0 text-white text-lg leading-relaxed"
            style={{ textShadow: "0 1px 3px rgb(0 0 0 / 0.8)" }}
          >
            {displayed}
            {/* Blinking cursor while typing */}
            {!isComplete && (
              <span
                className="inline-block w-0.5 h-5 bg-[#9fe9ff] ml-0.5 align-middle"
                style={{ animation: "aero-pulse 0.6s ease-in-out infinite" }}
              />
            )}
          </p>
        </div>

        {/* Footer: branching choices for prompt lines, otherwise the
            "click to continue" indicator. */}
        {hasChoices ? (
          <div
            className="flex flex-wrap justify-end gap-2 mt-2 min-h-[2.25rem] transition-opacity duration-150"
            style={{ opacity: isComplete ? 1 : 0, pointerEvents: isComplete ? "auto" : "none" }}
          >
            {line.choices!.map((choice) => (
              <motion.button
                key={choice.value}
                className="aero-button px-4 py-1.5 text-sm font-bold tracking-wide"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChoice?.(choice.value);
                }}
              >
                {choice.label}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex justify-end mt-1 h-5">
            <span
              className="text-[#9fe9ff] text-sm transition-opacity duration-150"
              style={{
                opacity: isComplete ? 1 : 0,
                animation: "aero-pulse 0.9s ease-in-out infinite",
              }}
            >
              ▼ click to continue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
