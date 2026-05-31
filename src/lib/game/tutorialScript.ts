import type { DialogueLine } from "./gameTypes";

/**
 * Hard-coded mechanics tutorial — identical for every AI-generated GameConfig.
 * Delivered by the teacher before the debate starts.
 */
export const tutorialScript: DialogueLine[] = [
  {
    id: "tut-0",
    speakerId: "teacher",
    text: "Before we begin — shall I explain how the Class Trial works, or would you like to skip ahead?",
    choices: [
      { label: "Explain the rules", value: "continue" },
      { label: "Skip tutorial", value: "skip" },
    ],
  },
  {
    id: "tut-1",
    speakerId: "teacher",
    text: "Welcome to Clashroom: Crash 'n Learn! Two students will debate the topic you just studied.",
  },
  {
    id: "tut-2",
    speakerId: "teacher",
    text: "Some of what they say is WRONG. Your job is to spot the mistakes and correct them!",
  },
  {
    id: "tut-3",
    speakerId: "teacher",
    text: "You will have flashcards at the bottom of your screen, you can scroll through them using the arrows.",
  },
  {
    id: "tut-4",
    speakerId: "teacher",
    text: "When you spot an incorrect statement, select the appropriate flashcard and drag it to the statement to correct it.",
  },
  {
    id: "tut-5",
    speakerId: "teacher",
    text: "Watch out some of the flashcards are trick answers!",
  },
];
