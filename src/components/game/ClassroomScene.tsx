"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { Character, CharacterId } from "@/lib/game/gameTypes";
import type { Phase } from "./classTrialReducer";

type Props = {
  characters: Character[];
  activeSpeakerId: CharacterId | null;
  phase: Phase;
};

type Placement = {
  left: string;
  bottom: string;
  height: string;
  scale: number;
  yOffset: string;
  zIndex: number;
};

const CAMERA_PAN_SECONDS = 1.45;

// These are the art-tuning knobs for the single wide classroom image. The world
// is wider than the screen; moving it reveals the right teacher side or the left
// debate side while characters stay fixed in world space.
const CAMERA_X = {
  right: "-50%",
  left: "0%",
} as const;

const CHARACTER_STYLE: Record<
  CharacterId,
  { emoji: string; bob: number; shake: number }
> = {
  teacher: { emoji: "👩‍🏫", bob: 2.1, shake: 5.2 },
  studentA: { emoji: "🧑‍💻", bob: 1.7, shake: 3.8 },
  studentB: { emoji: "🧑‍🎓", bob: 1.9, shake: 4.6 },
  mascot: { emoji: "📚", bob: 1.6, shake: 4.1 },
};

const RIGHT_SOLO: Partial<Record<CharacterId, Placement>> = {
  teacher: {
    left: "77%",
    bottom: "-2%",
    height: "clamp(320px, 70vh, 760px)",
    scale: 1.4,
    yOffset: "18vh",
    zIndex: 2,
  },
  mascot: {
    left: "77%",
    bottom: "24%",
    height: "clamp(260px, 50vh, 540px)",
    scale: 1,
    yOffset: "-4vh",
    zIndex: 2,
  },
};

const LEFT_SOLO: Partial<Record<CharacterId, Placement>> = {
  teacher: {
    left: "27%",
    bottom: "-2%",
    height: "clamp(320px, 70vh, 760px)",
    scale: 1.4,
    yOffset: "18vh",
    zIndex: 2,
  },
  studentA: {
    left: "27%",
    bottom: "-1%",
    height: "clamp(320px, 66vh, 720px)",
    scale: 1.3,
    yOffset: "8vh",
    zIndex: 2,
  },
  studentB: {
    left: "27%",
    bottom: "-1%",
    height: "clamp(320px, 66vh, 720px)",
    scale: 1.3,
    yOffset: "8vh",
    zIndex: 2,
  },
};

const STUDENT_PAIR: Record<"studentA" | "studentB", Placement> = {
  studentA: {
    left: "23.5%",
    bottom: "-1%",
    height: "clamp(320px, 68vh, 720px)",
    scale: 1.25,
    yOffset: "7vh",
    zIndex: 2,
  },
  studentB: {
    left: "30.5%",
    bottom: "-1%",
    height: "clamp(320px, 68vh, 720px)",
    scale: 1.25,
    yOffset: "7vh",
    zIndex: 3,
  },
};

export { CAMERA_PAN_SECONDS };

export default function ClassroomScene({
  characters,
  activeSpeakerId,
  phase,
}: Props) {
  const cameraSide = phase === "tutorial" || phase === "intro" ? "right" : "left";
  const visible = getVisibleCharacters(characters, activeSpeakerId, phase);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute top-0 h-full"
        style={{
          width: "200%",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
        initial={false}
        animate={{ x: CAMERA_X[cameraSide] }}
        transition={
          phase === "debateStart"
            ? { duration: CAMERA_PAN_SECONDS, ease: [0.22, 1, 0.36, 1] }
            : { duration: 0 }
        }
      >
        {/* Use an actual image element instead of a CSS background so the browser
            keeps texture sampling cleaner while the camera layer translates. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/backgrounds/classroom.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
          style={{
            objectFit: "fill",
            filter: "contrast(1.06) saturate(1.04)",
            pointerEvents: "none",
          }}
        />

        <AnimatePresence mode="popLayout">
          {visible.map(({ character, placement, withEntrance }) => (
            <WorldCharacter
              key={character.id}
              character={character}
              placement={placement}
              withEntrance={withEntrance}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function getVisibleCharacters(
  characters: Character[],
  activeSpeakerId: CharacterId | null,
  phase: Phase
) {
  const byId = (id: CharacterId) => characters.find((character) => character.id === id);

  if (phase === "debateStart") {
    const teacher = byId("teacher");
    const teacherPlacement = RIGHT_SOLO.teacher;
    const teacherItem =
      teacher && teacherPlacement
        ? [{ character: teacher, placement: teacherPlacement, withEntrance: false }]
        : [];

    const studentItems = (["studentA", "studentB"] as const)
      .map((id) => {
        const character = byId(id);
        return character
          ? { character, placement: STUDENT_PAIR[id], withEntrance: false }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return [...teacherItem, ...studentItems];
  }

  if (!activeSpeakerId) return [];

  const character = byId(activeSpeakerId);
  if (!character) return [];

  const placement =
    phase === "tutorial" || phase === "intro"
      ? RIGHT_SOLO[activeSpeakerId]
      : LEFT_SOLO[activeSpeakerId];

  return placement ? [{ character, placement, withEntrance: true }] : [];
}

function WorldCharacter({
  character,
  placement,
  withEntrance,
}: {
  character: Character;
  placement: Placement;
  withEntrance: boolean;
}) {
  const style = CHARACTER_STYLE[character.id];

  return (
    <motion.div
      className="absolute flex items-end justify-center"
      style={{
        left: placement.left,
        bottom: placement.bottom,
        height: placement.height,
        zIndex: placement.zIndex,
        transformOrigin: "bottom center",
      }}
      initial={withEntrance ? { opacity: 0, y: 48, scale: 0.85 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 36, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      <div
        className="flex h-full items-end justify-center"
        style={{ animation: `character-bob ${style.bob}s ease-in-out infinite` }}
      >
        <div
          className="flex h-full items-end justify-center"
          style={{ animation: `character-shake ${style.shake}s ease-in-out infinite` }}
        >
          {character.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={character.avatar}
              alt={character.name}
              style={{
                height: "100%",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 8px 18px rgb(0 0 0 / 0.45))",
                transform: `translateX(-50%) translateY(${placement.yOffset}) scale(${placement.scale})`,
                transformOrigin: "bottom center",
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                const sibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sibling) sibling.style.display = "flex";
              }}
            />
          ) : null}

          <span
            style={{
              display: character.avatar ? "none" : "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              lineHeight: 1,
              fontSize: "clamp(180px, 46vh, 520px)",
              transform: "translateX(-50%)",
            }}
          >
            {style.emoji}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
