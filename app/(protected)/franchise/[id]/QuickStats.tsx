"use client";

import { Card, CardContent } from "@/components/ui";

interface QuickStatsProps {
  phase: 'offseason' | 'free_agency' | 'draft' | 'training_camp' | 'preseason' | 'regular_season' | 'postseason';
  teamData: {
    overallRating: number;
  };
  standingsData: {
    wins: number;
    losses: number;
    ties: number;
    division_rank: number;
    points_for: number;
    points_against: number;
  } | null;
  rosterSize: number;
}

export default function QuickStats({
  phase,
  teamData,
  standingsData,
  rosterSize,
}: QuickStatsProps) {
  const getStatsForPhase = () => {
    switch (phase) {
      case 'regular_season':
        return [
          {
            label: 'Overall Rating',
            value: teamData.overallRating.toString(),
          },
          {
            label: 'Wins',
            value: standingsData?.wins.toString() || '0',
          },
          {
            label: 'Losses',
            value: standingsData?.losses.toString() || '0',
          },
          {
            label: 'Division Ranking',
            value: standingsData?.division_rank.toString() || '-',
          },
        ];

      case 'preseason':
        return [
          {
            label: 'Overall Rating',
            value: teamData.overallRating.toString(),
          },
          {
            label: 'Preseason Record',
            value: standingsData ? `${standingsData.wins}-${standingsData.losses}` : '0-0',
          },
          {
            label: 'Roster Size',
            value: rosterSize.toString(),
          },
          {
            label: 'Training Camp',
            value: 'In Progress',
          },
        ];

      case 'postseason':
        return [
          {
            label: 'Playoff Seed',
            value: standingsData?.division_rank.toString() || '-',
          },
          {
            label: 'Wins',
            value: standingsData?.wins.toString() || '0',
          },
          {
            label: 'Losses',
            value: standingsData?.losses.toString() || '0',
          },
          {
            label: 'Points For',
            value: standingsData?.points_for.toString() || '0',
          },
        ];

      case 'offseason':
        return [
          {
            label: 'Overall Rating',
            value: teamData.overallRating.toString(),
          },
          {
            label: 'Draft Position',
            value: 'TBD',
          },
          {
            label: 'Roster Size',
            value: rosterSize.toString(),
          },
          {
            label: 'Last Season',
            value: standingsData ? `${standingsData.wins}-${standingsData.losses}` : '0-0',
          },
        ];

      case 'draft':
        return [
          {
            label: 'Current Pick',
            value: '1st Round',
          },
          {
            label: 'Picks Remaining',
            value: '7',
          },
          {
            label: 'Roster Size',
            value: rosterSize.toString(),
          },
          {
            label: 'Team Needs',
            value: 'Multiple',
          },
        ];

      case 'free_agency':
        return [
          {
            label: 'Cap Space',
            value: '$50M',
          },
          {
            label: 'FA Signed',
            value: '0',
          },
          {
            label: 'Roster Size',
            value: rosterSize.toString(),
          },
          {
            label: 'Target Rating',
            value: teamData.overallRating.toString(),
          },
        ];

      case 'training_camp':
        return [
          {
            label: 'Overall Rating',
            value: teamData.overallRating.toString(),
          },
          {
            label: 'Camp Day',
            value: '15/30',
          },
          {
            label: 'Roster Size',
            value: rosterSize.toString(),
          },
          {
            label: 'Injuries',
            value: '0',
          },
        ];

      default:
        return [
          {
            label: 'Overall Rating',
            value: teamData.overallRating.toString(),
          },
          {
            label: 'Wins',
            value: '0',
          },
          {
            label: 'Losses',
            value: '0',
          },
          {
            label: 'Status',
            value: 'Active',
          },
        ];
    }
  };

  const stats = getStatsForPhase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border-t-0"
          style={{
            backgroundImage: 'linear-gradient(135deg, var(--bg-medium) 0%, var(--bg-dark) 100%)',
          }}
        >
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <p
                className="text-[10px] uppercase tracking-widest font-bold mb-3"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-secondary)',
                  opacity: 0.7,
                }}
              >
                {stat.label}
              </p>
              <p
                className="text-4xl font-extrabold tracking-tight leading-none"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: stat.label === 'Wins' || stat.label === 'Overall Rating'
                    ? 'var(--accent-cyan)'
                    : 'var(--text-primary)',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                }}
              >
                {stat.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
