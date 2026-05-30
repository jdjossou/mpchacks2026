import ComputerFrame from "@/components/game/ComputerFrame";
import GameFromSession from "@/components/game/GameFromSession";

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
      <GameFromSession />
    </ComputerFrame>
  );
}
