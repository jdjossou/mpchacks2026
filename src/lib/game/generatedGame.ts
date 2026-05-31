import type { GameConfig } from "./gameTypes";

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

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "generated";
}

export function gameConfigFromParsedDocument(
  value: unknown,
  sourceName = "uploaded-notes"
): GameConfig {
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
    },
  };
}
