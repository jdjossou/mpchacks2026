import type { GameConfig, DebateStatement } from "./gameTypes";

/** All statements that must be corrected (type === "wrong"). */
export function wrongStatements(config: GameConfig): DebateStatement[] {
  return config.debate.statements.filter((s) => s.type === "wrong");
}

/** True once every wrong statement appears in `resolved`. */
export function isWon(
  config: GameConfig,
  resolved: Record<string, true>
): boolean {
  return wrongStatements(config).every((s) => resolved[s.id]);
}

/** Count of wrong statements that have been resolved. */
export function solvedCount(
  config: GameConfig,
  resolved: Record<string, true>
): number {
  return wrongStatements(config).filter((s) => resolved[s.id]).length;
}
