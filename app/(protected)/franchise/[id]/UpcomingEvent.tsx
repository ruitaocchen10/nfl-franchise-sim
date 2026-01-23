"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import Link from "next/link";

interface UpcomingEventProps {
  upcomingGame: {
    id: string;
    week: number;
    home_team: {
      id: string;
      city: string;
      name: string;
      abbreviation: string;
    };
    away_team: {
      id: string;
      city: string;
      name: string;
      abbreviation: string;
    };
    is_home_game: boolean;
  } | null;
  franchiseId: string;
  phase: string;
}

export default function UpcomingEvent({
  upcomingGame,
  franchiseId,
  phase,
}: UpcomingEventProps) {
  const getEventTitle = () => {
    if (phase === 'regular_season' || phase === 'preseason') {
      return 'Upcoming Event';
    }
    if (phase === 'offseason') {
      return 'Offseason';
    }
    if (phase === 'draft') {
      return 'NFL Draft';
    }
    if (phase === 'free_agency') {
      return 'Free Agency';
    }
    if (phase === 'postseason') {
      return 'Playoffs';
    }
    return 'Next Event';
  };

  const renderGameInfo = () => {
    if (!upcomingGame) {
      return (
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-secondary)' }}>No upcoming games</p>
        </div>
      );
    }

    const { home_team, away_team, is_home_game, week } = upcomingGame;
    const record = '(0-0)';

    return (
      <div className="text-center">
        <p
          className="text-lg font-bold mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
          }}
        >
          {away_team.city} {away_team.name} {record}
        </p>
        <p
          className="text-md mb-4"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-secondary)',
          }}
        >
          @
        </p>
        <p
          className="text-lg font-bold mb-6"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
          }}
        >
          {home_team.city} {home_team.name} {record}
        </p>
      </div>
    );
  };

  return (
    <Card style={{ background: 'var(--bg-medium)' }}>
      <CardHeader>
        <CardTitle>{getEventTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderGameInfo()}

        {/* Simulation Buttons */}
        {(phase === 'regular_season' || phase === 'preseason') && upcomingGame && (
          <div className="space-y-3 mt-6">
            <Link
              href={`/franchise/${franchiseId}/schedule`}
              className="block w-full py-3 rounded-md text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--bg-darkest)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Simulate Game
            </Link>
            <Link
              href={`/franchise/${franchiseId}/schedule`}
              className="block w-full py-3 rounded-md text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--bg-darkest)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Sim to Trade Deadline
            </Link>
          </div>
        )}

        {phase === 'offseason' && (
          <div className="space-y-3 mt-6">
            <button
              className="block w-full py-3 rounded-md text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--bg-darkest)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Advance to Free Agency
            </button>
          </div>
        )}

        {phase === 'draft' && (
          <div className="space-y-3 mt-6">
            <button
              className="block w-full py-3 rounded-md text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--bg-darkest)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Make Pick
            </button>
            <button
              className="block w-full py-3 rounded-md text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--bg-darkest)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Sim to End of Draft
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
