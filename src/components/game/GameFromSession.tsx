"use client";

import { useSyncExternalStore } from "react";

import {
  GENERATED_GAME_STORAGE_KEY,
  gameConfigFromParsedDocument,
  type GeneratedGameStoragePayload,
} from "@/lib/game/generatedGame";
import type { GameConfig } from "@/lib/game/gameTypes";
import { sampleGame } from "@/lib/game/sampleGame";
import ClassTrial from "./ClassTrial";

let cachedRawPayload: string | null = null;
let cachedGame: GameConfig = sampleGame;

function loadGeneratedGame(): GameConfig {
  const rawPayload = sessionStorage.getItem(GENERATED_GAME_STORAGE_KEY);
  if (rawPayload === cachedRawPayload) return cachedGame;

  cachedRawPayload = rawPayload;
  if (!rawPayload) {
    cachedGame = sampleGame;
    return cachedGame;
  }

  try {
    const payload = JSON.parse(rawPayload) as GeneratedGameStoragePayload;
    cachedGame = gameConfigFromParsedDocument(
      payload.json,
      payload.name,
      payload.voiceovers
    );
  } catch (error) {
    console.warn("Falling back to sample game; generated payload is invalid.", error);
    cachedGame = sampleGame;
  }

  return cachedGame;
}

export default function GameFromSession() {
  const game = useSyncExternalStore(
    () => () => {},
    loadGeneratedGame,
    () => sampleGame
  );

  return <ClassTrial key={game.id} game={game} />;
}
