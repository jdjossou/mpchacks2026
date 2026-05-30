import type { GameConfig } from "./gameTypes";

export const sampleGame: GameConfig = {
  id: "game-virtual-memory-001",
  title: "Virtual Memory Class Trial",
  topic: {
    name: "Virtual Memory",
    summary:
      "Virtual memory gives each process the illusion of a private address space while the system maps virtual addresses to physical memory.",
  },
  characters: [
    {
      id: "teacher",
      name: "Professor Vale",
      role: "teacher",
      avatar: "/characters/teacher.png",
    },
    {
      id: "studentA",
      name: "Mika",
      role: "student",
      avatar: "/characters/student-a.png",
    },
    {
      id: "studentB",
      name: "Ren",
      role: "student",
      avatar: "/characters/student-b.png",
    },
  ],
  intro: {
    id: "intro-001",
    speakerId: "teacher",
    text: "Today, we will review virtual memory. Listen carefully to the debate and catch the claims that do not match your notes.",
  },
  debate: {
    id: "debate-001",
    statements: [
      {
        id: "statement-wrong-1",
        speakerId: "studentA",
        text: "Virtual memory means each process directly owns a separate part of physical RAM.",
        type: "wrong",
        correctAnswerId: "answer-correct-1",
      },
      {
        id: "statement-wrong-2",
        speakerId: "studentB",
        text: "Virtual addresses are the same thing as physical addresses.",
        type: "wrong",
        correctAnswerId: "answer-correct-2",
      },
      {
        id: "statement-correct-1",
        speakerId: "studentA",
        text: "Virtual memory gives each process the illusion of a private address space.",
        type: "correct",
        correctAnswerId: null,
      },
    ],
    answers: [
      {
        id: "answer-correct-1",
        text: "Virtual memory creates the illusion of private memory, but physical RAM is managed and shared by the system.",
        type: "correct",
        targetsStatementId: "statement-wrong-1",
        explanation:
          "The process does not directly own physical RAM. The operating system and hardware map virtual memory to physical memory.",
      },
      {
        id: "answer-correct-2",
        text: "Virtual addresses must be translated into physical addresses before accessing memory.",
        type: "correct",
        targetsStatementId: "statement-wrong-2",
        explanation:
          "Virtual and physical addresses are not the same. Address translation connects the two.",
      },
      {
        id: "answer-wrong-1",
        text: "Virtual memory only exists when a computer has no RAM left.",
        type: "wrong",
        targetsStatementId: null,
        explanation:
          "This is misleading. Virtual memory is a general memory abstraction, not only something used when RAM is full.",
      },
    ],
  },
  conclusion: {
    id: "conclusion-001",
    speakerId: "teacher",
    text: "Great work. You identified the incorrect claims about virtual memory. One extra thing to remember is that virtual memory also helps with isolation, because each process works inside its own virtual address space.",
  },
};