"use client";

import { useEffect } from "react";
import type { DialogueLine, Character } from "@/lib/game/gameTypes";
import { useTypewriter } from "./useTypewriter";

interface Props {
  line: DialogueLine;
  characters: Character[];
  isComplete: boolean;
  onLineTyped: () => void;
  /** Called when the user clicks: skip if typing, advance if done */
  onInteract: () => void;
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
}: Props) {
  const speaker = characters.find((c) => c.id === line.speakerId);

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
    } else {
      onInteract(); // advance to next line
    }
  };

  return (
    <div
      className="dialogue-box mx-3 mb-3 cursor-pointer select-none"
      style={{ minHeight: "110px" }}
      onClick={handleClick}
      role="button"
      aria-label="Click to continue dialogue"
    >
      {/* Name plate */}
      {speaker && (
        <div className="name-plate">{speaker.name}</div>
      )}

      {/* Text area */}
      <div className="px-4 py-3">
        <p
          className="text-white text-sm leading-relaxed min-h-[3.5rem]"
          style={{ textShadow: "0 1px 3px rgb(0 0 0 / 0.8)" }}
        >
          {displayed}
          {/* Blinking cursor while typing */}
          {!isComplete && (
            <span
              className="inline-block w-0.5 h-3.5 bg-[#9fe9ff] ml-0.5 align-middle"
              style={{ animation: "aero-pulse 0.6s ease-in-out infinite" }}
            />
          )}
        </p>

        {/* "Click to continue" indicator */}
        {isComplete && (
          <div className="flex justify-end mt-1">
            <span
              className="text-[#9fe9ff] text-xs"
              style={{ animation: "aero-pulse 0.9s ease-in-out infinite" }}
            >
              ▼ click to continue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
