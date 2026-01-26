"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui";
import ContractOfferModal from "./ContractOfferModal";

interface FreeAgent {
  id: string;
  player_id: string;
  market_value: number;
  previous_contract_value: number;
  player: {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
    college: string | null;
    height_inches: number | null;
    weight_lbs: number | null;
  };
  player_attributes: {
    age: number;
    overall_rating: number;
    speed: number;
    strength: number;
    agility: number;
    awareness: number;
    development_trait: string;
    years_pro: number;
  } | null;
  previous_team: {
    abbreviation: string;
    city: string;
    name: string;
  };
}

interface FreeAgentsListProps {
  freeAgents: FreeAgent[];
  franchiseId: string;
  capSpace: number;
  salaryCap: number;
}

const POSITIONS = [
  "all",
  "QB",
  "RB",
  "WR",
  "TE",
  "T",
  "G",
  "C",
  "DE",
  "DT",
  "LB",
  "CB",
  "S",
  "K",
  "P",
];

function formatCurrency(amount: number): string {
  return `$${(amount / 1000000).toFixed(1)}M`;
}

function formatHeight(inches: number | null): string {
  if (!inches) return "N/A";
  const feet = Math.floor(inches / 12);
  const remainingInches = inches % 12;
  return `${feet}'${remainingInches}"`;
}

function getRatingColor(overall: number): string {
  if (overall >= 90) return "var(--accent-cyan)"; // Elite
  if (overall >= 80) return "#10b981"; // Great
  if (overall >= 70) return "#eab308"; // Good
  return "var(--text-secondary)"; // Average/Depth
}

export default function FreeAgentsList({
  freeAgents,
  franchiseId,
  capSpace,
  salaryCap,
}: FreeAgentsListProps) {
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [sortBy, setSortBy] = useState<"overall" | "age" | "value">("overall");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPlayer, setSelectedPlayer] = useState<FreeAgent | null>(null);

  // Filter by position
  let filteredAgents = freeAgents;
  if (selectedPosition !== "all") {
    filteredAgents = freeAgents.filter(
      (fa) => fa.player.position === selectedPosition,
    );
  }

  // Sort agents
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case "overall":
        aValue = a.player_attributes?.overall_rating || 0;
        bValue = b.player_attributes?.overall_rating || 0;
        break;
      case "age":
        aValue = a.player_attributes?.age || 0;
        bValue = b.player_attributes?.age || 0;
        break;
      case "value":
        aValue = a.market_value;
        bValue = b.market_value;
        break;
      default:
        aValue = a.player_attributes?.overall_rating || 0;
        bValue = b.player_attributes?.overall_rating || 0;
    }

    return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
  });

  const capUsedPercent = ((salaryCap - capSpace) / salaryCap) * 100;

  return (
    <div className="space-y-6">
      {/* Cap Space Card */}
      <Card style={{ background: "var(--bg-medium)" }}>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-2">
            <h3
              className="text-lg font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Salary Cap
            </h3>
            <div className="text-right">
              <p
                className="text-2xl font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--accent-cyan)",
                }}
              >
                {formatCurrency(capSpace)}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                available
              </p>
            </div>
          </div>
          <div className="w-full bg-bg-dark rounded-full h-3 overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${capUsedPercent}%`,
                background: "var(--accent-cyan)",
              }}
            />
          </div>
          <p
            className="text-sm mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {formatCurrency(salaryCap - capSpace)} used of{" "}
            {formatCurrency(salaryCap)}
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Position Filter */}
        <div>
          <label
            className="block text-sm mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-secondary)",
            }}
          >
            Position
          </label>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2 rounded"
            style={{
              background: "var(--bg-medium)",
              color: "var(--text-primary)",
              border: "1px solid var(--bg-light)",
            }}
          >
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos === "all" ? "All Positions" : pos}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label
            className="block text-sm mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-secondary)",
            }}
          >
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded"
            style={{
              background: "var(--bg-medium)",
              color: "var(--text-primary)",
              border: "1px solid var(--bg-light)",
            }}
          >
            <option value="overall">Overall Rating</option>
            <option value="age">Age</option>
            <option value="value">Market Value</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label
            className="block text-sm mb-2"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-secondary)",
            }}
          >
            Order
          </label>
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            className="px-4 py-2 rounded hover:opacity-80 transition-opacity"
            style={{
              background: "var(--bg-medium)",
              color: "var(--text-primary)",
              border: "1px solid var(--bg-light)",
            }}
          >
            {sortOrder === "desc" ? "↓ High to Low" : "↑ Low to High"}
          </button>
        </div>

        {/* Results Count */}
        <div className="ml-auto">
          <p style={{ color: "var(--text-secondary)" }}>
            {sortedAgents.length} free agent
            {sortedAgents.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Free Agents Table */}
      {sortedAgents.length === 0 ? (
        <Card style={{ background: "var(--bg-medium)" }}>
          <CardContent className="p-12 text-center">
            <p style={{ color: "var(--text-secondary)" }}>
              No free agents available{" "}
              {selectedPosition !== "all" && `at ${selectedPosition}`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedAgents.map((fa) => {
            const attrs = fa.player_attributes;
            const canAfford = fa.market_value <= capSpace;

            return (
              <Card
                key={fa.id}
                style={{
                  background: "var(--bg-medium)",
                  border: canAfford
                    ? "1px solid var(--bg-light)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                }}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedPlayer(fa)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Player Info */}
                    <div className="flex items-center gap-6">
                      {/* Overall Rating Badge */}
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                        style={{
                          background: "var(--bg-dark)",
                          color: getRatingColor(attrs?.overall_rating || 0),
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {attrs?.overall_rating || "?"}
                      </div>

                      {/* Name and Details */}
                      <div>
                        <h3
                          className="text-xl font-bold"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {fa.player.first_name} {fa.player.last_name}
                        </h3>
                        <div
                          className="flex items-center gap-3 mt-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span className="font-bold">
                            {fa.player.position}
                          </span>
                          <span>•</span>
                          <span>Age {attrs?.age}</span>
                          <span>•</span>
                          <span>{attrs?.years_pro} yrs exp</span>
                          {fa.player.height_inches && fa.player.weight_lbs && (
                            <>
                              <span>•</span>
                              <span>
                                {formatHeight(fa.player.height_inches)},{" "}
                                {fa.player.weight_lbs} lbs
                              </span>
                            </>
                          )}
                        </div>
                        <div
                          className="mt-1"
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.9rem",
                          }}
                        >
                          Previous: {fa.previous_team.city}{" "}
                          {fa.previous_team.name}
                        </div>
                      </div>
                    </div>

                    {/* Stats and Action */}
                    <div className="flex items-center gap-8">
                      {/* Key Stats */}
                      {attrs && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <div style={{ color: "var(--text-secondary)" }}>
                            SPD:
                          </div>
                          <div style={{ color: "var(--text-primary)" }}>
                            {attrs.speed}
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>
                            STR:
                          </div>
                          <div style={{ color: "var(--text-primary)" }}>
                            {attrs.strength}
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>
                            AGI:
                          </div>
                          <div style={{ color: "var(--text-primary)" }}>
                            {attrs.agility}
                          </div>
                          <div style={{ color: "var(--text-secondary)" }}>
                            AWR:
                          </div>
                          <div style={{ color: "var(--text-primary)" }}>
                            {attrs.awareness}
                          </div>
                        </div>
                      )}

                      {/* Market Value and Button */}
                      <div className="text-right">
                        <p
                          className="text-lg font-bold mb-2"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: canAfford ? "var(--accent-cyan)" : "#ef4444",
                          }}
                        >
                          {formatCurrency(fa.market_value)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayer(fa);
                          }}
                          className="px-4 py-2 rounded font-bold uppercase text-sm transition-all hover:opacity-80"
                          style={{
                            background: canAfford
                              ? "var(--accent-cyan)"
                              : "#6b7280",
                            color: "var(--bg-darkest)",
                            fontFamily: "var(--font-display)",
                          }}
                          disabled={!canAfford}
                        >
                          {canAfford ? "Make Offer" : "Can't Afford"}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contract Offer Modal */}
      {selectedPlayer && (
        <ContractOfferModal
          player={selectedPlayer}
          franchiseId={franchiseId}
          capSpace={capSpace}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
