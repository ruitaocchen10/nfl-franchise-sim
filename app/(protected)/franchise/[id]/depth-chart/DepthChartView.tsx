"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { DepthChartPlayer } from "@/app/actions/roster";
import { updateDepthPosition } from "@/app/actions/roster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useRouter } from "next/navigation";

interface DepthChartViewProps {
  depthChart: DepthChartPlayer[];
  franchiseId: string;
}

// Position groups to organize the depth chart
const POSITION_GROUPS = [
  { name: "Quarterback", positions: ["QB"] },
  { name: "Running Back", positions: ["RB"] },
  { name: "Wide Receiver", positions: ["WR"] },
  { name: "Tight End", positions: ["TE"] },
  { name: "Offensive Line", positions: ["OL"] },
  { name: "Defensive Line", positions: ["DL"] },
  { name: "Linebacker", positions: ["LB"] },
  { name: "Cornerback", positions: ["CB"] },
  { name: "Safety", positions: ["S"] },
  { name: "Kicker", positions: ["K"] },
  { name: "Punter", positions: ["P"] },
];

export default function DepthChartView({
  depthChart,
  franchiseId,
}: DepthChartViewProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  // Group players by position
  const groupedPlayers = useMemo(() => {
    const groups: Record<string, DepthChartPlayer[]> = {};

    POSITION_GROUPS.forEach((group) => {
      const players = depthChart.filter((p) =>
        group.positions.includes(p.position),
      );
      // Sort by depth_position
      players.sort(
        (a, b) => a.roster_spot.depth_position - b.roster_spot.depth_position,
      );
      if (players.length > 0) {
        groups[group.name] = players;
      }
    });

    return groups;
  }, [depthChart]);

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return "text-blue-600 bg-blue-50";
    if (rating >= 80) return "text-green-600 bg-green-50";
    if (rating >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  // Handle moving a player up or down
  const handleMove = async (
    rosterSpotId: string,
    currentPosition: number,
    direction: "up" | "down",
  ) => {
    setUpdating(rosterSpotId);

    const newPosition =
      direction === "up" ? currentPosition - 1 : currentPosition + 1;

    const result = await updateDepthPosition(
      franchiseId,
      rosterSpotId,
      newPosition,
    );

    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to update depth chart");
    }

    setUpdating(null);
  };

  return (
    <div>
      {Object.keys(groupedPlayers).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No active players found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPlayers).map(([groupName, players]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="text-lg">{groupName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player, index) => {
                    const isFirst = index === 0;
                    const isLast = index === players.length - 1;
                    const depthLabel =
                      index === 0
                        ? "Starter"
                        : index === 1
                          ? "1st Backup"
                          : index === 2
                            ? "2nd Backup"
                            : `${index + 1}th String`;

                    return (
                      <div
                        key={player.roster_spot_id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                          index === 0
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {/* Depth Label */}
                        <div className="w-24 flex-shrink-0">
                          <span
                            className={`text-sm font-semibold ${
                              index === 0
                                ? "text-green-800"
                                : "text-gray-600"
                            }`}
                          >
                            {depthLabel}
                          </span>
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 flex items-center gap-4">
                          {/* Position & Overall */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-800 font-bold text-sm">
                              {player.position}
                            </span>
                            <span
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${getRatingColor(player.attributes.overall_rating)}`}
                            >
                              {player.attributes.overall_rating}
                            </span>
                          </div>

                          {/* Name & Jersey */}
                          <div className="flex-1">
                            <div className="font-bold text-gray-900">
                              {player.first_name} {player.last_name}
                              {player.roster_spot.jersey_number && (
                                <span className="ml-2 text-gray-500 font-normal">
                                  #{player.roster_spot.jersey_number}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Age {player.attributes.age} • {player.attributes.years_pro} yrs exp
                            </div>
                          </div>

                          {/* Key Stats */}
                          <div className="hidden md:flex gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-xs text-gray-500">SPD</div>
                              <div className="font-semibold">
                                {player.attributes.speed}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">STR</div>
                              <div className="font-semibold">
                                {player.attributes.strength}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">AWR</div>
                              <div className="font-semibold">
                                {player.attributes.awareness}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Move Buttons */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() =>
                              handleMove(
                                player.roster_spot_id,
                                player.roster_spot.depth_position,
                                "up",
                              )
                            }
                            disabled={isFirst || updating !== null}
                            className={`p-1 rounded transition-colors ${
                              isFirst || updating !== null
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            title="Move up"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleMove(
                                player.roster_spot_id,
                                player.roster_spot.depth_position,
                                "down",
                              )
                            }
                            disabled={isLast || updating !== null}
                            className={`p-1 rounded transition-colors ${
                              isLast || updating !== null
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                            title="Move down"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Back Button */}
      <div className="mt-8">
        <Link
          href={`/franchise/${franchiseId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          ← Back to Franchise
        </Link>
      </div>
    </div>
  );
}
