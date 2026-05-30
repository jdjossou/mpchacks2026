"use client";

import { useReducer, useEffect, useRef } from "react";

interface TypewriterResult {
  displayed: string;
  done: boolean;
  /** Instantly reveal the full text */
  skip: () => void;
}

type TypewriterState = {
  displayed: string;
  done: boolean;
};

type TypewriterAction =
  | { type: "reset"; hasText: boolean }
  | { type: "display"; value: string }
  | { type: "complete"; value: string };

function typewriterReducer(
  state: TypewriterState,
  action: TypewriterAction
): TypewriterState {
  switch (action.type) {
    case "reset":
      return { displayed: "", done: !action.hasText };
    case "display":
      return { ...state, displayed: action.value };
    case "complete":
      return { displayed: action.value, done: true };
  }
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
  const [state, dispatch] = useReducer(typewriterReducer, {
    displayed: "",
    done: false,
  });
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // Reset whenever the text changes
  useEffect(() => {
    dispatch({ type: "reset", hasText: !!text });

    if (!text) {
      return;
    }

    let index = 0;
    const id = setInterval(() => {
      index++;
      const nextDisplayed = text.slice(0, index);
      if (index >= text.length) {
        clearInterval(id);
        dispatch({ type: "complete", value: nextDisplayed });
        onDoneRef.current?.();
        return;
      }
      dispatch({ type: "display", value: nextDisplayed });
    }, speed);

    return () => clearInterval(id);
  }, [text, speed]);

  const skip = () => {
    dispatch({ type: "complete", value: text });
    onDoneRef.current?.();
  };

  return { displayed: state.displayed, done: state.done, skip };
}
