"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { advanceToNextWeek, advanceToPhase, advanceByDays } from "@/app/actions/simulation";
import { getSeasonDates } from "@/lib/season/calendarUtils";
import { useState } from "react";

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
  simulationDate: string | null;
  currentWeek: number;
  year: number;
  tradeDeadlinePassed: boolean;
}

export default function UpcomingEvent({
  upcomingGame,
  franchiseId,
  phase,
  simulationDate,
  currentWeek,
  year,
  tradeDeadlinePassed,
}: UpcomingEventProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMessages, setSimulationMessages] = useState<string[]>([]);

  const getEventTitle = () => {
    if (phase === 'regular_season' || phase === 'preseason' || phase === 'postseason') {
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
    if (phase === 'training_camp') {
      return 'Training Camp';
    }
    return 'Next Event';
  };

  const getNextMajorEvent = () => {
    const dates = getSeasonDates(year);
    const currentDate = simulationDate ? new Date(simulationDate) : new Date();

    // Map phases to their next major event
    const phaseTransitions: Record<string, { date: Date; name: string; targetPhase: string }> = {
      offseason: { date: dates.freeAgencyStart, name: "Free Agency", targetPhase: "free_agency" },
      free_agency: { date: dates.draftStart, name: "NFL Draft", targetPhase: "draft" },
      draft: { date: dates.trainingCampStart, name: "Training Camp", targetPhase: "training_camp" },
      training_camp: { date: dates.preseasonWeek1, name: "Preseason", targetPhase: "preseason" },
      regular_season: tradeDeadlinePassed
        ? { date: dates.wildCardStart, name: "Postseason", targetPhase: "postseason" }
        : { date: dates.tradeDeadline, name: "Trade Deadline", targetPhase: "trade_deadline" },
      postseason: { date: dates.superBowl, name: "Super Bowl", targetPhase: "offseason" },
    };

    const transition = phaseTransitions[phase];
    if (!transition) return null;

    const daysUntil = Math.ceil(
      (transition.date.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      eventName: transition.name,
      daysUntil: Math.max(0, daysUntil),
      targetPhase: transition.targetPhase,
    };
  };

  const handleAdvanceDay = async () => {
    setIsSimulating(true);
    setSimulationMessages([]);
    try {
      const result = await advanceByDays(franchiseId, 1);
      if (result.success && result.messages) {
        setSimulationMessages(result.messages);
      } else if (!result.success && result.error) {
        setSimulationMessages([`Error: ${result.error}`]);
      }
    } catch (error) {
      console.error("Failed to advance day:", error);
      setSimulationMessages([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAdvanceWeek = async () => {
    setIsSimulating(true);
    setSimulationMessages([]);
    try {
      const result = await advanceToNextWeek(franchiseId);
      if (result.success && result.messages) {
        setSimulationMessages(result.messages);
      } else if (!result.success && result.error) {
        setSimulationMessages([`Error: ${result.error}`]);
      }
    } catch (error) {
      console.error("Failed to advance week:", error);
      setSimulationMessages([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAdvanceToPhase = async (targetPhase: string) => {
    setIsSimulating(true);
    setSimulationMessages([]);
    try {
      const result = await advanceToPhase(franchiseId, targetPhase);
      if (result.success && result.messages) {
        setSimulationMessages(result.messages);
      } else if (!result.success && result.error) {
        setSimulationMessages([`Error: ${result.error}`]);
      }
    } catch (error) {
      console.error("Failed to advance to phase:", error);
      setSimulationMessages([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSimulating(false);
    }
  };

  const isInSeasonPhase = () => {
    return ['preseason', 'regular_season', 'postseason'].includes(phase);
  };

  const formatCurrentDate = () => {
    const currentDate = simulationDate ? new Date(simulationDate) : new Date();

    // Format options for date display
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };

    const formattedDate = currentDate.toLocaleDateString('en-US', dateOptions);

    // Show week number for in-season phases
    if (isInSeasonPhase() && currentWeek > 0) {
      return `Week ${currentWeek} • ${formattedDate}`;
    }

    return formattedDate;
  };

  const renderContent = () => {
    // Show game matchup for in-season phases
    if (isInSeasonPhase() && upcomingGame) {
      const { home_team, away_team } = upcomingGame;
      const record = '(0-0)'; // TODO: Get actual records

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
    }

    // Show countdown for off-season phases
    const nextEvent = getNextMajorEvent();
    if (nextEvent) {
      return (
        <div className="text-center py-8">
          <p
            className="text-2xl font-bold mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--accent-cyan)',
            }}
          >
            {nextEvent.eventName}
          </p>
          <p
            className="text-md"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-secondary)',
            }}
          >
            {nextEvent.daysUntil === 0
              ? 'Today'
              : `in ${nextEvent.daysUntil} day${nextEvent.daysUntil !== 1 ? 's' : ''}`}
          </p>
        </div>
      );
    }

    // Fallback
    return (
      <div className="text-center py-8">
        <p style={{ color: 'var(--text-secondary)' }}>No upcoming events</p>
      </div>
    );
  };

  const renderMessages = () => {
    if (simulationMessages.length === 0) return null;

    return (
      <div className="mt-4 mb-4 p-3 rounded-none" style={{ background: 'var(--bg-light)', borderLeft: '3px solid var(--accent-cyan)' }}>
        <p className="text-sm font-bold mb-2" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-display)' }}>
          Simulation Results:
        </p>
        <ul className="space-y-1">
          {simulationMessages.map((msg, idx) => (
            <li key={idx} className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              • {msg}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const getSimButtons = () => {
    const nextEvent = getNextMajorEvent();
    const buttonStyle = {
      background: 'var(--accent-cyan)',
      color: 'var(--bg-darkest)',
      fontFamily: 'var(--font-display)',
    };

    const disabledButtonStyle = {
      background: 'var(--bg-light)',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-display)',
      cursor: 'not-allowed',
    };

    // Get the appropriate secondary button based on phase
    let secondaryButton = null;
    if (nextEvent) {
      let buttonLabel = '';
      switch (nextEvent.targetPhase) {
        case 'free_agency':
          buttonLabel = 'Sim to Free Agency';
          break;
        case 'draft':
          buttonLabel = 'Sim to Draft Day';
          break;
        case 'training_camp':
          buttonLabel = 'Sim Draft';
          break;
        case 'preseason':
          buttonLabel = 'Sim to Preseason';
          break;
        case 'regular_season':
          buttonLabel = 'Sim to Regular Season';
          break;
        case 'trade_deadline':
          buttonLabel = 'Sim to Trade Deadline';
          break;
        case 'postseason':
          buttonLabel = 'Sim to Postseason';
          break;
        case 'offseason':
          buttonLabel = 'Sim to End Season';
          break;
      }

      if (buttonLabel) {
        secondaryButton = (
          <button
            key="secondary"
            onClick={() => handleAdvanceToPhase(nextEvent.targetPhase)}
            disabled={isSimulating}
            className="block w-full py-3 rounded-none text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg disabled:opacity-50"
            style={isSimulating ? disabledButtonStyle : buttonStyle}
          >
            {isSimulating ? 'Simulating...' : buttonLabel}
          </button>
        );
      }
    }

    return (
      <div className="space-y-3 mt-6">
        {/* Primary button: Sim Day Forward */}
        <button
          onClick={handleAdvanceDay}
          disabled={isSimulating}
          className="block w-full py-3 rounded-none text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg disabled:opacity-50"
          style={isSimulating ? disabledButtonStyle : buttonStyle}
        >
          {isSimulating ? 'Simulating...' : 'Sim Day Forward'}
        </button>

        {/* Secondary button: Sim to Next Week */}
        <button
          onClick={handleAdvanceWeek}
          disabled={isSimulating}
          className="block w-full py-3 rounded-none text-center font-bold uppercase tracking-wider transition-all hover:shadow-lg disabled:opacity-50"
          style={isSimulating ? disabledButtonStyle : buttonStyle}
        >
          {isSimulating ? 'Simulating...' : isInSeasonPhase() ? 'Sim to Next Game' : 'Sim to Next Week'}
        </button>

        {/* Tertiary button: Phase-specific */}
        {secondaryButton}
      </div>
    );
  };

  return (
    <Card style={{ background: 'var(--bg-medium)' }}>
      <CardHeader>
        <CardTitle>{getEventTitle()}</CardTitle>
        <p
          className="text-sm mt-1"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-secondary)',
          }}
        >
          {formatCurrentDate()}
        </p>
      </CardHeader>
      <CardContent>
        {renderContent()}
        {renderMessages()}
        {getSimButtons()}
      </CardContent>
    </Card>
  );
}
