"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { RosterPlayer } from "@/app/actions/roster";
import { Card, CardContent } from "@/components/ui";

interface RosterViewProps {
  roster: RosterPlayer[];
  franchiseId: string;
}

const POSITIONS = [
  "All",
  "QB",
  "RB",
  "WR",
  "TE",
  "OL",
  "DL",
  "LB",
  "CB",
  "S",
  "K",
  "P",
];

type SortOption = "overall" | "name" | "age" | "position";

export default function RosterView({ roster, franchiseId }: RosterViewProps) {
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("overall");

  // Filter and sort roster
  const filteredRoster = useMemo(() => {
    let filtered = roster;

    // Filter by position
    if (selectedPosition !== "All") {
      filtered = filtered.filter((p) => p.position === selectedPosition);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "overall":
          return b.attributes.overall_rating - a.attributes.overall_rating;
        case "name":
          return `${a.last_name} ${a.first_name}`.localeCompare(
            `${b.last_name} ${b.first_name}`,
          );
        case "age":
          return a.attributes.age - b.attributes.age;
        case "position":
          return a.position.localeCompare(b.position);
        default:
          return 0;
      }
    });

    return filtered;
  }, [roster, selectedPosition, sortBy]);

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return "text-blue-600 bg-blue-50";
    if (rating >= 80) return "text-green-600 bg-green-50";
    if (rating >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-gray-600 bg-gray-50";
  };

  // Get development trait badge
  const getDevTrait = (trait: string) => {
    const badges = {
      superstar: "bg-purple-100 text-purple-800",
      star: "bg-blue-100 text-blue-800",
      normal: "bg-gray-100 text-gray-800",
      slow: "bg-orange-100 text-orange-800",
    };
    return badges[trait as keyof typeof badges] || badges.normal;
  };

  return (
    <div>
      {/* Filters and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Position Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position
          </label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedPosition === pos
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="sm:w-48">
          <label
            htmlFor="sort"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Sort By
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="overall">Overall Rating</option>
            <option value="name">Name</option>
            <option value="age">Age</option>
            <option value="position">Position</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredRoster.length} of {roster.length} players
      </div>

      {/* Player Grid */}
      {filteredRoster.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No players found for the selected position
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRoster.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {/* Position & Overall */}
                <div className="flex items-start justify-between mb-3">
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
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium capitalize ${getDevTrait(player.attributes.development_trait)}`}
                  >
                    {player.attributes.development_trait}
                  </span>
                </div>

                {/* Player Name */}
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900">
                    {player.first_name} {player.last_name}
                  </h3>
                  {player.roster_spot.jersey_number && (
                    <p className="text-sm text-gray-600">
                      #{player.roster_spot.jersey_number}
                    </p>
                  )}
                </div>

                {/* Player Info */}
                <div className="space-y-1 text-sm text-gray-600 mb-3">
                  <div className="flex justify-between">
                    <span>Age:</span>
                    <span className="font-medium text-gray-900">
                      {player.attributes.age} yrs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exp:</span>
                    <span className="font-medium text-gray-900">
                      {player.attributes.years_pro} yrs
                    </span>
                  </div>
                  {player.height_inches && player.weight_lbs && (
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium text-gray-900">
                        {Math.floor(player.height_inches / 12)}'
                        {player.height_inches % 12}" • {player.weight_lbs} lbs
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Attributes */}
                <div className="grid grid-cols-4 gap-1 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">SPD</div>
                    <div className="text-sm font-semibold">
                      {player.attributes.speed}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">STR</div>
                    <div className="text-sm font-semibold">
                      {player.attributes.strength}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">AGI</div>
                    <div className="text-sm font-semibold">
                      {player.attributes.agility}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">AWR</div>
                    <div className="text-sm font-semibold">
                      {player.attributes.awareness}
                    </div>
                  </div>
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
