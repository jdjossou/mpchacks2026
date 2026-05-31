import type { GameConfig } from "./gameTypes";

const COMMON_CHARACTERS: GameConfig["characters"] = [
  {
    id: "teacher",
    name: "Professor Vale",
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
];

export const PREMADE_LEVELS: GameConfig[] = [
  {
    id: "game-virtual-memory-001",
    title: "Virtual Memory Class Trial",
    topic: {
      name: "Virtual Memory",
      summary:
        "Virtual memory gives each process the illusion of a private address space while the system maps virtual addresses to physical memory.",
    },
    characters: COMMON_CHARACTERS,
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
  },
  {
    id: "game-photosynthesis-002",
    title: "Photosynthesis Class Trial",
    topic: {
      name: "Photosynthesis",
      summary:
        "Plants convert light energy, carbon dioxide, and water into chemical energy (glucose) and oxygen within chloroplasts.",
    },
    characters: COMMON_CHARACTERS,
    intro: {
      id: "intro-002",
      speakerId: "teacher",
      text: "Today, we will review Photosynthesis. Listen carefully to the debate and shoot down the false claims about how plants produce food.",
    },
    debate: {
      id: "debate-002",
      statements: [
        {
          id: "statement-wrong-1",
          speakerId: "studentA",
          text: "Plants absorb oxygen and release carbon dioxide to perform photosynthesis.",
          type: "wrong",
          correctAnswerId: "answer-correct-1",
        },
        {
          id: "statement-wrong-2",
          speakerId: "studentB",
          text: "Photosynthesis occurs inside the mitochondria of plant cells.",
          type: "wrong",
          correctAnswerId: "answer-correct-2",
        },
        {
          id: "statement-correct-1",
          speakerId: "studentA",
          text: "Chlorophyll in chloroplasts absorbs red and blue light, while reflecting green light.",
          type: "correct",
          correctAnswerId: null,
        },
        {
          id: "statement-correct-2",
          speakerId: "studentB",
          text: "Light-dependent reactions split water molecules to generate oxygen as a byproduct.",
          type: "correct",
          correctAnswerId: null,
        },
      ],
      answers: [
        {
          id: "answer-correct-1",
          text: "Photosynthesis consumes carbon dioxide and water to release oxygen and build glucose.",
          type: "correct",
          targetsStatementId: "statement-wrong-1",
          explanation:
            "Plants take in carbon dioxide and release oxygen during photosynthesis. Respiration does the opposite.",
        },
        {
          id: "answer-correct-2",
          text: "Photosynthesis takes place in the chloroplasts, while the mitochondria are used for cellular respiration.",
          type: "correct",
          targetsStatementId: "statement-wrong-2",
          explanation:
            "Chloroplasts contain chlorophyll which captures solar energy to drive photosynthesis.",
        },
        {
          id: "answer-wrong-1",
          text: "Plants only undergo photosynthesis when they are kept in complete darkness.",
          type: "wrong",
          targetsStatementId: null,
          explanation:
            "Photosynthesis requires light energy to initiate the light-dependent reactions.",
        },
        {
          id: "answer-wrong-2",
          text: "Glucose is absorbed directly from the soil through the plant's roots.",
          type: "wrong",
          targetsStatementId: null,
          explanation:
            "Plants manufacture their own glucose through photosynthesis; roots absorb water and inorganic nutrients.",
        },
      ],
    },
    conclusion: {
      id: "conclusion-002",
      speakerId: "teacher",
      text: "Excellent. You successfully corrected the errors. Remember, photosynthesis is the primary source of organic energy for almost all life on Earth.",
    },
  },
  {
    id: "game-gravity-003",
    title: "Gravity & Motion Class Trial",
    topic: {
      name: "Newtonian Physics",
      summary:
        "Classical mechanics describes the motion of macroscopic objects under forces, governed by Newton's three laws of motion.",
    },
    characters: COMMON_CHARACTERS,
    intro: {
      id: "intro-003",
      speakerId: "teacher",
      text: "Let's test our understanding of gravity and motion. Spot the mistakes in the students' arguments about forces!",
    },
    debate: {
      id: "debate-003",
      statements: [
        {
          id: "statement-wrong-1",
          speakerId: "studentA",
          text: "An object in motion will naturally slow down and stop even if zero external forces act on it.",
          type: "wrong",
          correctAnswerId: "answer-correct-1",
        },
        {
          id: "statement-wrong-2",
          speakerId: "studentB",
          text: "In a vacuum, heavier objects accelerate faster than lighter ones due to gravity.",
          type: "wrong",
          correctAnswerId: "answer-correct-2",
        },
        {
          id: "statement-correct-1",
          speakerId: "studentA",
          text: "Newton's third law states that force is always mutual—every action has an equal and opposite reaction.",
          type: "correct",
          correctAnswerId: null,
        },
        {
          id: "statement-correct-2",
          speakerId: "studentB",
          text: "Force is equal to the change in momentum over time, commonly expressed as mass times acceleration.",
          type: "correct",
          correctAnswerId: null,
        },
      ],
      answers: [
        {
          id: "answer-correct-1",
          text: "According to Newton's first law, an object in motion stays in motion at a constant velocity unless acted upon by a net external force.",
          type: "correct",
          targetsStatementId: "statement-wrong-1",
          explanation:
            "Friction and air resistance are the external forces that slow objects down on Earth; without them, motion continues indefinitely.",
        },
        {
          id: "answer-correct-2",
          text: "In a vacuum, all objects fall with the exact same gravitational acceleration (g), independent of their mass.",
          type: "correct",
          targetsStatementId: "statement-wrong-2",
          explanation:
            "The gravitational force is proportional to mass, but acceleration is force divided by mass, so the mass cancels out.",
        },
        {
          id: "answer-wrong-1",
          text: "Gravity is a strong force that ceases to exist once you enter Earth's upper orbit.",
          type: "wrong",
          targetsStatementId: null,
          explanation:
            "Gravity is still present in orbit (about 90% of surface gravity on the ISS); astronauts float because they are in continuous free fall.",
        },
        {
          id: "answer-wrong-2",
          text: "Action and reaction forces cancel each other out, making acceleration impossible.",
          type: "wrong",
          targetsStatementId: null,
          explanation:
            "Action and reaction forces act on different objects, so they do not cancel out for a single object's force balance.",
        },
      ],
    },
    conclusion: {
      id: "conclusion-003",
      speakerId: "teacher",
      text: "Superb! You set the laws of motion straight. Keep in mind that forces always occur in pairs and accelerate masses according to F = ma.",
    },
  },
];
