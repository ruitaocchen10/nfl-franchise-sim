/**
 * TeamSelector Component
 * Displays a grid of all 32 NFL teams for selection during franchise creation
 */

'use client'

import type { Database } from '@/lib/types/database.types'

type Team = Database['public']['Tables']['teams']['Row']

interface TeamSelectorProps {
  teams: Team[]
  selectedTeamId: string | null
  onSelectTeam: (teamId: string) => void
}

export default function TeamSelector({ teams, selectedTeamId, onSelectTeam }: TeamSelectorProps) {
  // Group teams by conference and division
  const conferences = {
    AFC: {
      East: teams.filter(t => t.conference === 'AFC' && t.division === 'East'),
      North: teams.filter(t => t.conference === 'AFC' && t.division === 'North'),
      South: teams.filter(t => t.conference === 'AFC' && t.division === 'South'),
      West: teams.filter(t => t.conference === 'AFC' && t.division === 'West'),
    },
    NFC: {
      East: teams.filter(t => t.conference === 'NFC' && t.division === 'East'),
      North: teams.filter(t => t.conference === 'NFC' && t.division === 'North'),
      South: teams.filter(t => t.conference === 'NFC' && t.division === 'South'),
      West: teams.filter(t => t.conference === 'NFC' && t.division === 'West'),
    },
  }

  return (
    <div className="space-y-8">
      {/* AFC Conference */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">AFC</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(conferences.AFC).map(([division, divisionTeams]) => (
            <div key={division}>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">{division}</h4>
              <div className="space-y-2">
                {divisionTeams.map(team => (
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
        <h3 className="text-xl font-bold text-gray-900 mb-4">NFC</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(conferences.NFC).map(([division, divisionTeams]) => (
            <div key={division}>
              <h4 className="text-sm font-semibold text-gray-600 mb-3">{division}</h4>
              <div className="space-y-2">
                {divisionTeams.map(team => (
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
  )
}

interface TeamCardProps {
  team: Team
  isSelected: boolean
  onSelect: () => void
}

function TeamCard({ team, isSelected, onSelect }: TeamCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full px-4 py-3 rounded-lg border-2 text-left transition-all
        ${isSelected
          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Team color indicator */}
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: team.primary_color }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900">{team.abbreviation}</span>
            <span className="text-sm text-gray-600 truncate">
              {team.city} {team.name}
            </span>
          </div>
        </div>

        {isSelected && (
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  )
}
