import "server-only";

import type { Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { GameConfig } from "./gameTypes";
import type { SharedLevelSummary } from "./sharedLevelTypes";

const LEVELS_COLLECTION = "levels";

type SharedLevelDocument = {
  _id: string;
  title: string;
  topicName: string;
  topicSummary: string;
  createdAt: Date;
  gameConfig: GameConfig;
};

export type ShareLevelResult = {
  status: "created" | "exists";
  levelId: string;
};

function getDatabaseName() {
  const dbName = process.env.MONGODB_DB?.trim();
  if (!dbName) {
    throw new Error("Missing MONGODB_DB");
  }

  return dbName;
}

async function getLevelsCollection(): Promise<Collection<SharedLevelDocument>> {
  const client = await clientPromise;
  return client.db(getDatabaseName()).collection<SharedLevelDocument>(LEVELS_COLLECTION);
}

function requireGameConfig(value: unknown): GameConfig {
  if (!value || typeof value !== "object") {
    throw new Error("GameConfig must be an object.");
  }

  const candidate = value as Partial<GameConfig>;
  if (typeof candidate.id !== "string" || !candidate.id.trim()) {
    throw new Error("GameConfig is missing an id.");
  }
  if (typeof candidate.title !== "string" || !candidate.title.trim()) {
    throw new Error("GameConfig is missing a title.");
  }
  if (!candidate.topic || typeof candidate.topic.name !== "string") {
    throw new Error("GameConfig is missing topic data.");
  }
  if (!Array.isArray(candidate.characters)) {
    throw new Error("GameConfig is missing characters.");
  }
  if (!candidate.intro || typeof candidate.intro.text !== "string") {
    throw new Error("GameConfig is missing intro text.");
  }
  if (!candidate.conclusion || typeof candidate.conclusion.text !== "string") {
    throw new Error("GameConfig is missing conclusion text.");
  }
  if (!candidate.debate || !Array.isArray(candidate.debate.statements) || !Array.isArray(candidate.debate.answers)) {
    throw new Error("GameConfig is missing debate data.");
  }

  return candidate as GameConfig;
}

function withoutGeneratedAudio(gameConfig: GameConfig): GameConfig {
  const intro = { ...gameConfig.intro };
  const conclusion = { ...gameConfig.conclusion };
  delete intro.audioUrl;
  delete conclusion.audioUrl;

  return {
    ...gameConfig,
    intro,
    conclusion,
  };
}

function toSummary(document: SharedLevelDocument): SharedLevelSummary {
  return {
    id: document._id,
    title: document.title,
    topicName: document.topicName,
    topicSummary: document.topicSummary,
    createdAt: document.createdAt.toISOString(),
    gameConfig: document.gameConfig,
  };
}

export async function shareLevel(gameConfigInput: unknown): Promise<ShareLevelResult> {
  const gameConfig = withoutGeneratedAudio(requireGameConfig(gameConfigInput));
  const levelId = gameConfig.id.trim();
  const collection = await getLevelsCollection();
  const now = new Date();

  const result = await collection.updateOne(
    { _id: levelId },
    {
      $setOnInsert: {
        _id: levelId,
        title: gameConfig.title,
        topicName: gameConfig.topic.name,
        topicSummary: gameConfig.topic.summary,
        createdAt: now,
        gameConfig,
      },
    },
    { upsert: true }
  );

  return {
    status: result.upsertedCount > 0 ? "created" : "exists",
    levelId,
  };
}

export async function listSharedLevels(): Promise<SharedLevelSummary[]> {
  const collection = await getLevelsCollection();
  const documents = await collection
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return documents.map(toSummary);
}
