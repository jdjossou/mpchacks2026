"use client";

import type { AnswerBullet } from "@/lib/game/gameTypes";
import BulletChip from "./BulletChip";

interface Props {
  bullets: AnswerBullet[];
  selectedBulletId: string | null;
  usedBullets: Record<string, true>;
  onSelect: (bulletId: string) => void;
}

/**
 * The player's Truth Bullet inventory — shown during the solving phase.
 */
export default function BulletInventory({
  bullets,
  selectedBulletId,
  usedBullets,
  onSelect,
}: Props) {
  return (
    <div className="mx-5 mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[0.8rem] font-black tracking-widest text-[#9fe9ff] uppercase">
          Truth Bullets
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-[#57c7ff]/50 to-transparent" />
        <span className="text-xs text-[#9fe9ff]/60 italic">
          Select a bullet, then click a statement
        </span>
      </div>

      {/* Bullet chips */}
      <div className="grid grid-cols-3 gap-2.5">
        {bullets.map((b) => (
          <BulletChip
            key={b.id}
            bullet={b}
            isSelected={selectedBulletId === b.id}
            isUsed={!!usedBullets[b.id]}
            onClick={() => onSelect(b.id)}
          />
        ))}
      </div>
    </div>
  );
}
