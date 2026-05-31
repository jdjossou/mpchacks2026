"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  type Variants,
} from "framer-motion";

import type { AnswerBullet } from "@/lib/game/gameTypes";
import BulletCard from "./BulletCard";

interface Props {
  bullets: AnswerBullet[];
  usedBullets: Record<string, true>;
  /** Drag of the centre card began — marks it active so the statement lights up. */
  onDragStartBullet: (bulletId: string) => void;
  /** Centre card dropped on empty space — clear the active bullet. */
  onDragCancel: () => void;
  /** Centre card dropped on a statement — fire it. */
  onFire: (statementId: string, bulletId: string) => void;
}

// Resting slot for a card given its offset from the centre (−1 / 0 / +1).
function slotFor(offset: number) {
  if (offset === 0) return { x: 0, y: -8, scale: 1, opacity: 1, zIndex: 3 };
  const side = offset < 0 ? -1 : 1;
  return { x: 200 * side, y: 10, scale: 0.8, opacity: 0.5, zIndex: 1 };
}

// Enter/exit for cards that stream in/out when the deck has more than 3 bullets.
// `custom` is the navigation direction (+1 = moved right, −1 = moved left).
const swapVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 430 : -430, y: 10, scale: 0.6, opacity: 0 }),
  exit: (dir: number) => ({
    x: dir > 0 ? -430 : 430,
    y: 8,
    scale: 0.6,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
};

// Shortest signed distance from `i` to `centerIndex` on a ring of size `n`.
function relOffset(i: number, centerIndex: number, n: number) {
  let d = i - centerIndex;
  if (d > n / 2) d -= n;
  else if (d < -n / 2) d += n;
  return d;
}

/**
 * The player's Truth Bullet inventory, shown during the solving phase as a
 * 3-card carousel. The middle card sits over the side cards and is the only one
 * you can pick up: drag it onto a statement to fire. Browse the deck with the
 * arrow buttons, the ◀ ▶ keys, or by clicking a side card. Spent bullets drop
 * out of the rotation.
 */
export default function BulletInventory({
  bullets,
  usedBullets,
  onDragStartBullet,
  onDragCancel,
  onFire,
}: Props) {
  // Only live (unspent) bullets stay in the carousel.
  const deck = bullets.filter((b) => !usedBullets[b.id]);
  const n = deck.length;

  const [centerIndex, setCenterIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // The deck shrinks as bullets are spent, so derive a safe centre by wrapping
  // rather than storing a clamped value (avoids a setState-in-effect cascade).
  const safeCenter = n > 0 ? centerIndex % n : 0;

  const go = useCallback(
    (delta: 1 | -1) => {
      if (n <= 1) return;
      setDir(delta);
      setCenterIndex((prev) => (prev + delta + n) % n);
    },
    [n]
  );

  // Keyboard navigation (active for as long as the inventory is mounted = solving).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isDragging) return;
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, isDragging]);

  const handleDragEnd = useCallback(
    (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo,
      bulletId: string
    ) => {
      setIsDragging(false);
      const pe = event as PointerEvent;
      const x = typeof pe.clientX === "number" ? pe.clientX : info.point.x;
      const y = typeof pe.clientY === "number" ? pe.clientY : info.point.y;

      const drop = document
        .elementsFromPoint(x, y)
        .find(
          (el): el is HTMLElement =>
            el instanceof HTMLElement && !!el.dataset.statementDropId
        );

      if (drop) onFire(drop.dataset.statementDropId!, bulletId);
      else onDragCancel();
    },
    [onFire, onDragCancel]
  );

  if (n === 0) {
    return (
      <div className="mx-5 mb-4 h-[7rem] flex items-center justify-center text-sm text-[#9fe9ff]/50 italic">
        No Truth Bullets left.
      </div>
    );
  }

  // The (up to) three cards currently on stage.
  const visible = deck
    .map((bullet, i) => ({ bullet, offset: relOffset(i, safeCenter, n) }))
    .filter((c) => Math.abs(c.offset) <= 1);

  return (
    <div className="mx-5 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[0.8rem] font-black tracking-widest text-[#9fe9ff] uppercase">
          Truth Bullets
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-[#57c7ff]/50 to-transparent" />
        <span className="text-xs text-[#9fe9ff]/60 italic">
          Drag a bullet onto the statement — ◀ ▶ to browse
        </span>
      </div>

      {/* Carousel row: arrow · stage · arrow */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous bullet"
          onClick={() => go(-1)}
          disabled={n <= 1}
          className="aero-button shrink-0 flex items-center justify-center w-11 h-11 text-2xl leading-none font-black disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        <div className="relative flex-1 h-[9.5rem]">
          <AnimatePresence custom={dir} initial={false}>
            {visible.map(({ bullet, offset }) => {
              const isCenter = offset === 0;
              const card = (
                <BulletCard bullet={bullet} slot={isCenter ? "center" : "side"} />
              );

              return (
                <motion.div
                  key={bullet.id}
                  custom={dir}
                  variants={swapVariants}
                  initial="enter"
                  animate={{
                    ...slotFor(offset),
                    transition: { type: "spring", stiffness: 320, damping: 30 },
                  }}
                  exit="exit"
                  className="absolute inset-0 m-auto w-[20rem] h-[6.5rem]"
                  style={{ pointerEvents: "auto" }}
                >
                  {isCenter ? (
                    // Only the centre card can be picked up.
                    <motion.div
                      drag
                      dragSnapToOrigin
                      dragElastic={0.18}
                      whileDrag={{ scale: 1.06, zIndex: 50 }}
                      onDragStart={() => {
                        setIsDragging(true);
                        onDragStartBullet(bullet.id);
                      }}
                      onDragEnd={(e, info) => handleDragEnd(e, info, bullet.id)}
                      className="w-full h-full cursor-grab active:cursor-grabbing"
                    >
                      {card}
                    </motion.div>
                  ) : (
                    // Side cards rotate to the middle on click.
                    <button
                      type="button"
                      onClick={() => go(offset < 0 ? -1 : 1)}
                      className="w-full h-full"
                      aria-label={`Bring "${bullet.text}" to the middle`}
                    >
                      {card}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Next bullet"
          onClick={() => go(1)}
          disabled={n <= 1}
          className="aero-button shrink-0 flex items-center justify-center w-11 h-11 text-2xl leading-none font-black disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}
