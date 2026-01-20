"use client";

import { useState } from "react";
import { simulateSingleGame } from "@/app/actions/simulation";
import { useRouter } from "next/navigation";

interface SimulateGameButtonProps {
  franchiseId: string;
  gameId: string;
}

export default function SimulateGameButton({
  franchiseId,
  gameId,
}: SimulateGameButtonProps) {
  const router = useRouter();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const result = await simulateSingleGame(franchiseId, gameId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to simulate game");
      }
    } catch (error) {
      console.error("Error simulating game:", error);
      alert("An error occurred while simulating the game");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <button
      onClick={handleSimulate}
      disabled={isSimulating}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
    >
      {isSimulating ? "Simulating..." : "Simulate Game"}
    </button>
  );
}
