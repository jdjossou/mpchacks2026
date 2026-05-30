import type { DialogueLine } from "./gameTypes";

/**
 * Hard-coded mechanics tutorial — identical for every AI-generated GameConfig.
 * Delivered by the teacher before the debate starts.
 */
export const tutorialScript: DialogueLine[] = [
  {
    id: "tut-1",
    speakerId: "teacher",
    text: "Welcome to the Class Trial! Two students will debate the topic you just studied.",
  },
  {
    id: "tut-2",
    speakerId: "teacher",
    text: "Some of what they say is WRONG. Your job is to spot the mistakes and shoot them down!",
  },
  {
    id: "tut-3",
    speakerId: "teacher",
    text: "After the debate, statements will scroll across the screen. Select a Truth Bullet from your inventory below...",
  },
  {
    id: "tut-4",
    speakerId: "teacher",
    text: "...then click the wrong statement to fire it! A correct hit eliminates the false claim. A wrong shot costs you points.",
  },
  {
    id: "tut-5",
    speakerId: "teacher",
    text: "Watch out — one bullet is a RED HERRING. It won't help you. Beware of the clock! You have 2 minutes. Good luck!",
  },
];
