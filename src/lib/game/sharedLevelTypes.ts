import type { GameConfig } from "./gameTypes";

export type SharedLevelSummary = {
  id: string;
  title: string;
  topicName: string;
  topicSummary: string;
  createdAt: string;
  gameConfig: GameConfig;
};

