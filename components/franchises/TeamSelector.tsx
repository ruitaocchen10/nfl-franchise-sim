/**
 * TeamSelector Component
 * Displays a grid of all 32 NFL teams for selection during franchise creation
 */

"use client";

import type { Database } from "@/lib/types/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
}

export default function TeamSelector({
  teams,
  selectedTeamId,
  onSelectTeam,
}: TeamSelectorProps) {
  // Group teams by conference and division
  const conferences = {
    AFC: {
      East: teams.filter(
        (t) => t.conference === "AFC" && t.division === "East",
      ),
      North: teams.filter(
        (t) => t.conference === "AFC" && t.division === "North",
      ),
      South: teams.filter(
        (t) => t.conference === "AFC" && t.division === "South",
      ),
      West: teams.filter(
        (t) => t.conference === "AFC" && t.division === "West",
      ),
    },
    NFC: {
      East: teams.filter(
        (t) => t.conference === "NFC" && t.division === "East",
      ),
      North: teams.filter(
        (t) => t.conference === "NFC" && t.division === "North",
      ),
      South: teams.filter(
        (t) => t.conference === "NFC" && t.division === "South",
      ),
      West: teams.filter(
        (t) => t.conference === "NFC" && t.division === "West",
      ),
    },
  };

  return (
    <div className="space-y-8">
      {/* AFC Conference */}
      <div>
        <h3 className="text-xl font-bold mb-4 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>AFC</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(conferences.AFC).map(([division, divisionTeams]) => (
            <div key={division}>
              <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)' }}>
                {division}
              </h4>
              <div className="space-y-2">
                {divisionTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isSelected={selectedTeamId === team.id}
                    onSelect={() => onSelectTeam(team.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NFC Conference */}
      <div>
        <h3 className="text-xl font-bold mb-4 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>NFC</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(conferences.NFC).map(([division, divisionTeams]) => (
            <div key={division}>
              <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-tertiary)' }}>
                {division}
              </h4>
              <div className="space-y-2">
                {divisionTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    isSelected={selectedTeamId === team.id}
                    onSelect={() => onSelectTeam(team.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TeamCardProps {
  team: Team;
  isSelected: boolean;
  onSelect: () => void;
}

function TeamCard({ team, isSelected, onSelect }: TeamCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full px-4 py-3 rounded-lg border-2 text-left transition-all hover:-translate-y-0.5
        ${
          isSelected
            ? "ring-2"
            : "hover:border-border-bright"
        }
      `}
      style={{
        background: isSelected ? 'var(--bg-light)' : 'var(--bg-medium)',
        borderColor: isSelected ? 'var(--accent-red)' : 'var(--border-default)',
        boxShadow: isSelected ? '0 0 20px rgba(255, 41, 67, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
        ...(isSelected ? { '--tw-ring-color': 'rgba(255, 41, 67, 0.3)' } as any : {})
      }}
    >
      <div className="flex items-center gap-3">
        {/* Team color indicator */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 shadow-md"
          style={{ backgroundColor: team.primary_color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {team.abbreviation}
            </span>
            <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
              {team.city} {team.name}
            </span>
          </div>
        </div>

        {isSelected && (
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ color: 'var(--accent-red)' }}
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
}
