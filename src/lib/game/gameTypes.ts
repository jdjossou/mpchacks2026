export type CharacterId = "teacher" | "studentA" | "studentB";

export type CharacterRole = "teacher" | "student";

export type StatementType = "correct" | "wrong";

export type AnswerType = "correct" | "wrong";

export type GameConfig = {
  id: string;
  title: string;
  topic: Topic;
  characters: Character[];
  intro: DialogueLine;
  debate: Debate;
  conclusion: DialogueLine;
};

export type Topic = {
  name: string;
  summary: string;
};

export type Character = {
  id: CharacterId;
  name: string;
  role: CharacterRole;
  avatar: string;
};

export type DialogueLine = {
  id: string;
  speakerId: CharacterId;
  text: string;
  audioUrl?: string;
};

export type Debate = {
  id: string;
  statements: DebateStatement[];
  answers: AnswerBullet[];
};

export type DebateStatement = {
  id: string;
  speakerId: "studentA" | "studentB";
  text: string;
  type: StatementType;
  correctAnswerId: string | null;
};

export type AnswerBullet = {
  id: string;
  text: string;
  type: AnswerType;
  targetsStatementId: string | null;
  explanation: string;
};