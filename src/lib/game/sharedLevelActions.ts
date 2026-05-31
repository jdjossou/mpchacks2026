"use server";

import type { GameConfig } from "./gameTypes";
import { listSharedLevels, shareLevel } from "./sharedLevels";
import type { SharedLevelSummary } from "./sharedLevelTypes";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function shareLevelAction(
  gameConfig: GameConfig
): Promise<
  | { success: true; status: "created" | "exists"; levelId: string }
  | { success: false; error: string }
> {
  try {
    const result = await shareLevel(gameConfig);
    return { success: true, ...result };
  } catch (error) {
    console.error("Failed to share level:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Failed to share level."),
    };
  }
}

export async function listSharedLevelsAction(): Promise<
  | { success: true; data: SharedLevelSummary[] }
  | { success: false; error: string }
> {
  try {
    const data = await listSharedLevels();
    return { success: true, data };
  } catch (error) {
    console.error("Failed to load shared levels:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Failed to load shared levels."),
    };
  }
}

