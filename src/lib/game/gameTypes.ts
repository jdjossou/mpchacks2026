export type CharacterId = "teacher" | "studentA" | "studentB" | "mascot";

export type CharacterRole = "teacher" | "student" | "mascot";

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

export type DialogueChoice = {
  label: string;
  value: string;
};

export type DialogueLine = {
  id: string;
  speakerId: CharacterId;
  text: string;
  audioUrl?: string;
  /**
   * If present, the line is a branching prompt: the dialogue does NOT advance
   * on click — the player must pick one of these choices to continue.
   */
  choices?: DialogueChoice[];
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
