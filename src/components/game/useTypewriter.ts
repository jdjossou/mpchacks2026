"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterResult {
  displayed: string;
  done: boolean;
  /** Instantly reveal the full text */
  skip: () => void;
}

/**
 * Reveals `text` one character at a time.
 * Emits `onDone` when the full text has been displayed.
 * Cleans up its interval on unmount or when text changes.
 */
export function useTypewriter(
  text: string,
  opts: { speed?: number; onDone?: () => void } = {}
): TypewriterResult {
  const { speed = 28, onDone } = opts;
  const [displayed, setDisplayed] = useState("");
  const [done, setDone]           = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Reset whenever the text changes
  useEffect(() => {
    setDisplayed("");
    setDone(false);

    if (!text) {
      setDone(true);
      return;
    }

    let index = 0;
    const id = setInterval(() => {
      index++;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(id);
        setDone(true);
        onDoneRef.current?.();
      }
    }, speed);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed]);

  const skip = () => {
    setDisplayed(text);
    setDone(true);
    onDoneRef.current?.();
  };

  return { displayed, done, skip };
}
