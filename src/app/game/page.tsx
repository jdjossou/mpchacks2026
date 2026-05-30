import { sampleGame } from "@/lib/game/sampleGame";
import ComputerFrame from "@/components/game/ComputerFrame";
import ClassTrial    from "@/components/game/ClassTrial";

export const metadata = {
  title: "Class Trial — EduTrial",
};

/**
 * Server component — just supplies the data and the presentational frame.
 * All interactivity lives in the 'use client' ClassTrial component.
 */
export default function GamePage() {
  return (
    <ComputerFrame>
      <ClassTrial game={sampleGame} />
    </ComputerFrame>
  );
}
