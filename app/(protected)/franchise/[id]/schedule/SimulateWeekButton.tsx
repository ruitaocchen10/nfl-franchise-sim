"use client";

import { useState } from "react";
import { simulateWeek } from "@/app/actions/simulation";
import { useRouter } from "next/navigation";

interface SimulateWeekButtonProps {
  franchiseId: string;
  week: number;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

export default function SimulateWeekButton({
  franchiseId,
  week,
  disabled = false,
  variant = "primary",
}: SimulateWeekButtonProps) {
  const router = useRouter();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const result = await simulateWeek(franchiseId, week);
      if (result.success) {
        alert(`Simulated ${result.gamesSimulated} games for Week ${week}`);
        router.refresh();
      } else {
        alert(result.error || "Failed to simulate week");
      }
    } catch (error) {
      console.error("Error simulating week:", error);
      alert("An error occurred while simulating the week");
    } finally {
      setIsSimulating(false);
    }
  };

  const buttonClasses =
    variant === "primary"
      ? "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      : "px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium";

  return (
    <button
      onClick={handleSimulate}
      disabled={disabled || isSimulating}
      className={buttonClasses}
    >
      {isSimulating ? "Simulating..." : `Simulate Week ${week}`}
    </button>
  );
}
