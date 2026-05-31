import type { Character, CharacterId, GameConfig } from "./gameTypes";
import type { TeacherVoiceovers } from "@/lib/voice/elevenLabs";

export const GENERATED_GAME_STORAGE_KEY = "clashroom:generated-game:v1";

export type ParsedDocumentGameJson = {
  topic: string;
  intro: string;
  "statement-wrong-1": string;
  "statement-wrong-2": string;
  "statement-correct-1": string;
  "statement-correct-2": string;
  "answer-correct-1": string;
  "answer-correct-2": string;
  "answer-wrong-1": string;
  "answer-wrong-2": string;
  conclusion: string;
};

export type GeneratedGameStoragePayload = {
  json: unknown;
  version: string;
  size: number;
  name: string;
  voiceovers?: TeacherVoiceovers;
};

const REQUIRED_FIELDS = [
  "topic",
  "intro",
  "statement-wrong-1",
  "statement-wrong-2",
  "statement-correct-1",
  "statement-correct-2",
  "answer-correct-1",
  "answer-correct-2",
  "answer-wrong-1",
  "answer-wrong-2",
  "conclusion",
] as const satisfies readonly (keyof ParsedDocumentGameJson)[];

const DEFAULT_CHARACTERS: Record<CharacterId, Character> = {
  teacher: {
    id: "teacher",
    name: "Professor Vale",
    role: "teacher",
    avatar: "/characters/teacher.png",
  },
  mascot: {
    id: "mascot",
    name: "TUTO-SAN",
    role: "mascot",
    avatar: "/characters/mascot.png",
  },
  studentA: {
    id: "studentA",
    name: "Mika",
    role: "student",
    avatar: "/characters/studentA.png",
  },
  studentB: {
    id: "studentB",
    name: "Ren",
    role: "student",
    avatar: "/characters/studentB.png",
  },
};

const CHARACTER_ORDER = ["teacher", "mascot", "studentA", "studentB"] as const;

function requireParsedDocumentJson(value: unknown): ParsedDocumentGameJson {
  if (!value || typeof value !== "object") {
    throw new Error("Generated game JSON must be an object.");
  }

  const candidate = value as Record<string, unknown>;
  for (const field of REQUIRED_FIELDS) {
    if (typeof candidate[field] !== "string" || !candidate[field].trim()) {
      throw new Error(`Generated game JSON is missing "${field}".`);
    }
  }

  return candidate as ParsedDocumentGameJson;
}

function normalizeCharacters(value: unknown): Character[] {
  const candidates = Array.isArray(value) ? value : [];
  const byId = new Map<CharacterId, Partial<Character>>();

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const character = candidate as Record<string, unknown>;
    if (!CHARACTER_ORDER.includes(character.id as CharacterId)) continue;

    byId.set(character.id as CharacterId, character as Partial<Character>);
  }

  return CHARACTER_ORDER.map((id) => {
    const current = byId.get(id);
    const fallback = DEFAULT_CHARACTERS[id];

    return {
      ...fallback,
      name:
        typeof current?.name === "string" && current.name.trim()
          ? current.name
          : fallback.name,
      role: fallback.role,
      avatar: fallback.avatar,
    };
  });
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "generated";
}

function normalizeGameConfig(
  game: GameConfig,
  voiceovers?: TeacherVoiceovers
): GameConfig {
  return {
    ...game,
    characters: normalizeCharacters(game.characters),
    intro: {
      ...game.intro,
      audioUrl: voiceovers?.introAudioUrl ?? game.intro.audioUrl,
    },
    conclusion: {
      ...game.conclusion,
      audioUrl: voiceovers?.conclusionAudioUrl ?? game.conclusion.audioUrl,
    },
  };
}

export function gameConfigFromParsedDocument(
  value: unknown,
  sourceName = "uploaded-notes",
  voiceovers?: TeacherVoiceovers
): GameConfig {
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    "title" in value &&
    "topic" in value &&
    "debate" in value &&
    "conclusion" in value
  ) {
    return normalizeGameConfig(value as GameConfig, voiceovers);
  }

  const json = requireParsedDocumentJson(value);
  const topic = json.topic.trim();
  const sourceSlug = slugify(sourceName.replace(/\.[^.]+$/, ""));
  const topicSlug = slugify(topic);

  return {
    id: `game-${topicSlug}-${sourceSlug}`,
    title: `${topic} Class Trial`,
    topic: {
      name: topic,
      summary: `A class trial generated from ${sourceName}.`,
    },
    characters: [
      {
        id: "teacher",
        name: "Mizue Sensei",
        role: "teacher",
        avatar: "/characters/teacher.png",
      },
      {
        id: "mascot",
        name: "TUTO-SAN",
        role: "mascot",
        avatar: "/characters/mascot.png",
      },
      {
        id: "studentA",
        name: "Mika",
        role: "student",
        avatar: "/characters/studentA.png",
      },
      {
        id: "studentB",
        name: "Ren",
        role: "student",
        avatar: "/characters/studentB.png",
      },
    ],
    intro: {
      id: "intro-generated-001",
      speakerId: "teacher",
      text: json.intro.trim(),
      audioUrl: voiceovers?.introAudioUrl,
    },
    debate: {
      id: "debate-generated-001",
      statements: [
        {
          id: "statement-wrong-1",
          speakerId: "studentA",
          text: json["statement-wrong-1"].trim(),
          type: "wrong",
          correctAnswerId: "answer-correct-1",
        },
        {
          id: "statement-wrong-2",
          speakerId: "studentB",
          text: json["statement-wrong-2"].trim(),
          type: "wrong",
          correctAnswerId: "answer-correct-2",
        },
        {
          id: "statement-correct-1",
          speakerId: "studentA",
          text: json["statement-correct-1"].trim(),
          type: "correct",
          correctAnswerId: null,
        },
        {
          id: "statement-correct-2",
          speakerId: "studentB",
          text: json["statement-correct-2"].trim(),
          type: "correct",
          correctAnswerId: null,
        },
      ],
      answers: [
        {
          id: "answer-correct-1",
          text: json["answer-correct-1"].trim(),
          type: "correct",
          targetsStatementId: "statement-wrong-1",
          explanation: `Use this to correct: "${json["statement-wrong-1"].trim()}"`,
        },
        {
          id: "answer-correct-2",
          text: json["answer-correct-2"].trim(),
          type: "correct",
          targetsStatementId: "statement-wrong-2",
          explanation: `Use this to correct: "${json["statement-wrong-2"].trim()}"`,
        },
        {
          id: "answer-wrong-1",
          text: json["answer-wrong-1"].trim(),
          type: "wrong",
          targetsStatementId: null,
          explanation:
            "This phrase is a fabricated distractor and does not correct a false claim.",
        },
        {
          id: "answer-wrong-2",
          text: json["answer-wrong-2"].trim(),
          type: "wrong",
          targetsStatementId: null,
          explanation:
            "This phrase is a fabricated distractor and does not correct a false claim.",
        },
      ],
    },
    conclusion: {
      id: "conclusion-generated-001",
      speakerId: "teacher",
      text: json.conclusion.trim(),
      audioUrl: voiceovers?.conclusionAudioUrl,
    },
  };
}
