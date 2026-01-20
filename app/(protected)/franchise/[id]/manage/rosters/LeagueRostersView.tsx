"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import type { LeagueRosterPlayer } from "@/app/actions/roster";
import { Card, CardContent } from "@/components/ui";

interface LeagueRostersViewProps {
  initialRoster: LeagueRosterPlayer[];
  franchiseId: string;
  allTeams: Array<{
    id: string;
    abbreviation: string;
    city: string;
    name: string;
    primary_color: string;
    secondary_color: string;
  }>;
  userTeamId: string;
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

export default function LeagueRostersView({
  initialRoster,
  franchiseId,
  allTeams,
  userTeamId
}: LeagueRostersViewProps) {
  const [rosters, setRosters] = useState<LeagueRosterPlayer[]>(initialRoster);
  const [selectedTeam, setSelectedTeam] = useState<string>(userTeamId);
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("overall");
  const [minRating, setMinRating] = useState<number>(0);
  const [maxRating, setMaxRating] = useState<number>(99);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch team roster when team selection changes
  useEffect(() => {
    const fetchTeamRoster = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/rosters/${selectedTeam}?franchiseId=${franchiseId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch roster");
        }
        const data = await response.json();
        setRosters(data.roster);
      } catch (error) {
        console.error("Error fetching team roster:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamRoster();
  }, [selectedTeam, franchiseId]);

  // Filter and sort roster
  const filteredRoster = useMemo(() => {
    let filtered = rosters;

    // Filter by position
    if (selectedPosition !== "All") {
      filtered = filtered.filter((p) => p.position === selectedPosition);
    }

    // Filter by rating
    filtered = filtered.filter(
      (p) =>
        p.attributes.overall_rating >= minRating &&
        p.attributes.overall_rating <= maxRating
    );

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
  }, [rosters, selectedPosition, sortBy, minRating, maxRating]);

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 90) return "bg-blue-600 text-white";
    if (rating >= 80) return "bg-green-600 text-white";
    if (rating >= 70) return "bg-yellow-600 text-white";
    return "bg-gray-600 text-white";
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
      <div className="mb-6 space-y-4">
        {/* Team Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)'
          }}>
            Team
          </label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            disabled={isLoading}
            className="block w-full md:w-64 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-medium)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {allTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.abbreviation} - {team.city} {team.name}
                {team.id === userTeamId ? " ★" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)'
          }}>
            Position
          </label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                onClick={() => setSelectedPosition(pos)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  selectedPosition === pos
                    ? "shadow-lg"
                    : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  background: selectedPosition === pos ? 'var(--accent-cyan)' : 'var(--bg-medium)',
                  color: selectedPosition === pos ? 'var(--bg-darkest)' : 'var(--text-primary)',
                  border: `1px solid ${selectedPosition === pos ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Filter and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Rating Range */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2" style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)'
            }}>
              Rating Range
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="99"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'var(--bg-medium)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>to</span>
              <input
                type="number"
                min="0"
                max="99"
                value={maxRating}
                onChange={(e) => setMaxRating(Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'var(--bg-medium)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="sm:w-48">
            <label
              htmlFor="sort"
              className="block text-sm font-medium mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)'
              }}
            >
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                background: 'var(--bg-medium)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <option value="overall">Overall Rating</option>
              <option value="name">Name</option>
              <option value="age">Age</option>
              <option value="position">Position</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 flex items-center gap-3">
        <div className="text-sm" style={{
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)'
        }}>
          Showing {filteredRoster.length} of {rosters.length} players
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent-cyan)' }}>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            Loading...
          </div>
        )}
      </div>

      {/* Player Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-current border-t-transparent" style={{ color: 'var(--accent-cyan)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading roster...</p>
          </div>
        </div>
      ) : filteredRoster.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
          No players found matching your filters
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRoster.map((player) => (
            <Card
              key={`${player.id}-${player.team.id}`}
              className="hover:shadow-lg transition-all hover:-translate-y-1"
              style={{
                background: 'var(--bg-medium)',
                border: `2px solid ${player.team.id === userTeamId ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
              }}
            >
              <CardContent className="p-4">
                {/* Team Badge */}
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="px-2 py-1 rounded text-xs font-bold shadow-md"
                    style={{
                      backgroundColor: player.team.primary_color,
                      color: 'white',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {player.team.abbreviation}
                    {player.team.id === userTeamId && " ★"}
                  </div>
                  {player.team.id === userTeamId && (
                    <div className="text-xs font-semibold" style={{
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-display)'
                    }}>
                      YOUR TEAM
                    </div>
                  )}
                </div>

                {/* Position & Overall */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm" style={{
                      background: 'var(--bg-light)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {player.position}
                    </span>
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold ${getRatingColor(player.attributes.overall_rating)}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
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
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {player.first_name} {player.last_name}
                  </h3>
                  {player.roster_spot.jersey_number && (
                    <p className="text-sm" style={{
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      #{player.roster_spot.jersey_number}
                    </p>
                  )}
                </div>

                {/* Player Info */}
                <div className="space-y-1 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex justify-between">
                    <span>Age:</span>
                    <span className="font-medium" style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {player.attributes.age} yrs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Exp:</span>
                    <span className="font-medium" style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {player.attributes.years_pro} yrs
                    </span>
                  </div>
                  {player.height_inches && player.weight_lbs && (
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium" style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {Math.floor(player.height_inches / 12)}'
                        {player.height_inches % 12}" • {player.weight_lbs} lbs
                      </span>
                    </div>
                  )}
                </div>

                {/* Key Attributes */}
                <div className="grid grid-cols-4 gap-1 pt-3" style={{
                  borderTop: '1px solid var(--border-default)'
                }}>
                  <div className="text-center">
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>SPD</div>
                    <div className="text-sm font-semibold" style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {player.attributes.speed}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>STR</div>
                    <div className="text-sm font-semibold" style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {player.attributes.strength}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>AGI</div>
                    <div className="text-sm font-semibold" style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {player.attributes.agility}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>AWR</div>
                    <div className="text-sm font-semibold" style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)'
                    }}>
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
          href={`/franchise/${franchiseId}/manage`}
          className="inline-flex items-center text-sm font-semibold hover:text-accent-cyan transition-colors"
          style={{
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)'
          }}
        >
          ← Back to Manage
        </Link>
      </div>
    </div>
  );
}
