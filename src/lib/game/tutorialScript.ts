import type { DialogueLine } from "./gameTypes";

/**
 * Hard-coded mechanics tutorial — identical for every AI-generated GameConfig.
 * Delivered by the mascot before the topic intro and debate start.
 */
export const tutorialScript: DialogueLine[] = [
  {
    id: "tut-0",
    speakerId: "mascot",
    text: "Before we begin — shall I explain how the Class Trial works, or would you like to skip ahead?",
    choices: [
      { label: "Explain the rules", value: "continue" },
      { label: "Skip tutorial", value: "skip" },
    ],
  },
  {
    id: "tut-1",
    speakerId: "mascot",
    text: "Welcome to Clashroom: Crash 'n Learn! Two students will debate the topic you just studied.",
  },
  {
    id: "tut-2",
    speakerId: "mascot",
    text: "Some of what they say is WRONG. Your job is to spot the mistakes and correct them!",
  },
  {
    id: "tut-3",
    speakerId: "mascot",
    text: "You will have flashcards at the bottom of your screen, you can scroll through them using the arrows.",
  },
  {
    id: "tut-4",
    speakerId: "mascot",
    text: "When you spot an incorrect statement, select the appropriate flashcard and drag it to the statement to correct it.",
  },
  {
    id: "tut-5",
    speakerId: "mascot",
    text: "Watch out some of the flashcards are trick answers!",
  },
];
