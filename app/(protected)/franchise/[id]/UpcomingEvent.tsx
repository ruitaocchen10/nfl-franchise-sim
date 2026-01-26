"use client";

import {
  advanceToNextWeek,
  advanceToPhase,
  advanceByDays,
} from "@/app/actions/simulation";
import { getSeasonDates } from "@/lib/season/calendarUtils";
import { useState } from "react";
import { Zap } from "lucide-react";

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

  const getPhaseDisplay = () => {
    const phaseMap: Record<string, string> = {
      regular_season: "REGULAR SEASON",
      preseason: "PRESEASON",
      postseason: "POSTSEASON",
      offseason: "OFFSEASON",
      draft: "NFL DRAFT",
      free_agency: "FREE AGENCY",
      training_camp: "TRAINING CAMP",
    };
    return phaseMap[phase] || "SEASON";
  };

  const getEventTitle = () => {
    if (
      phase === "regular_season" ||
      phase === "preseason" ||
      phase === "postseason"
    ) {
      return "Upcoming Event";
    }
    if (phase === "offseason") {
      return "Offseason";
    }
    if (phase === "draft") {
      return "NFL Draft";
    }
    if (phase === "free_agency") {
      return "Free Agency";
    }
    if (phase === "training_camp") {
      return "Training Camp";
    }
    return "Next Event";
  };

  const getNextMajorEvent = () => {
    const dates = getSeasonDates(year);
    const currentDate = simulationDate ? new Date(simulationDate) : new Date();

    // Map phases to their next major event
    const phaseTransitions: Record<
      string,
      { date: Date; name: string; targetPhase: string }
    > = {
      offseason: {
        date: dates.freeAgencyStart,
        name: "Free Agency",
        targetPhase: "free_agency",
      },
      free_agency: {
        date: dates.draftStart,
        name: "NFL Draft",
        targetPhase: "draft",
      },
      draft: {
        date: dates.trainingCampStart,
        name: "Training Camp",
        targetPhase: "training_camp",
      },
      training_camp: {
        date: dates.preseasonWeek1,
        name: "Preseason",
        targetPhase: "preseason",
      },
      regular_season: tradeDeadlinePassed
        ? {
            date: dates.wildCardStart,
            name: "Postseason",
            targetPhase: "postseason",
          }
        : {
            date: dates.tradeDeadline,
            name: "Trade Deadline",
            targetPhase: "trade_deadline",
          },
      postseason: {
        date: dates.superBowl,
        name: "Super Bowl",
        targetPhase: "offseason",
      },
    };

    const transition = phaseTransitions[phase];
    if (!transition) return null;

    const daysUntil = Math.ceil(
      (transition.date.getTime() - currentDate.getTime()) /
        (1000 * 60 * 60 * 24),
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
      setSimulationMessages([
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAdvanceWeek = async () => {
    setIsSimulating(true);
    setSimulationMessages([]);
    try {
      const result = await advanceToNextWeek(franchiseId);
      if (result.success && result.message) {
        setSimulationMessages([result.message]);
      } else if (!result.success && result.error) {
        setSimulationMessages([`Error: ${result.error}`]);
      }
    } catch (error) {
      console.error("Failed to advance week:", error);
      setSimulationMessages([
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleAdvanceToPhase = async (targetPhase: string) => {
    setIsSimulating(true);
    setSimulationMessages([]);
    try {
      const result = await advanceToPhase(franchiseId, targetPhase);
      if (result.success && result.message) {
        setSimulationMessages([result.message]);
      } else if (!result.success && result.error) {
        setSimulationMessages([`Error: ${result.error}`]);
      }
    } catch (error) {
      console.error("Failed to advance to phase:", error);
      setSimulationMessages([
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const isInSeasonPhase = () => {
    return ["preseason", "regular_season", "postseason"].includes(phase);
  };

  const formatCurrentDate = () => {
    const currentDate = simulationDate ? new Date(simulationDate) : new Date();

    const weekday = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const dateMain = currentDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return { weekday: weekday.toUpperCase(), dateMain };
  };

  const renderContent = () => {
    // Show game matchup for in-season phases
    if (isInSeasonPhase() && upcomingGame) {
      const { home_team, away_team } = upcomingGame;
      const record = "(0-0)"; // TODO: Get actual records

      return (
        <div className="cyber-event-card flex items-start gap-4">
          <div className="cyber-event-icon">
            <Zap size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyber-cyan text-sm font-mono font-semibold uppercase tracking-wider">
                NEXT EVENT
              </span>
              <span className="cyber-badge-yellow">TODAY</span>
            </div>
            <h3
              className="text-xl font-bold mb-1"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              {away_team.city} {away_team.name} @ {home_team.city}{" "}
              {home_team.name}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Week {upcomingGame.week} Game
            </p>
          </div>
        </div>
      );
    }

    // Show countdown for off-season phases
    const nextEvent = getNextMajorEvent();
    if (nextEvent) {
      const isToday = nextEvent.daysUntil === 0;
      return (
        <div className="cyber-event-card flex items-start gap-4">
          <div className="cyber-event-icon">
            <Zap size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyber-cyan text-sm font-mono font-semibold uppercase tracking-wider">
                NEXT EVENT
              </span>
              {isToday && <span className="cyber-badge-yellow">TODAY</span>}
            </div>
            <h3
              className="text-3xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              {nextEvent.eventName}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {isToday
                ? "The event begins today"
                : `in ${nextEvent.daysUntil} day${nextEvent.daysUntil !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      );
    }

    // Fallback
    return (
      <div className="text-center py-8">
        <p style={{ color: "var(--text-secondary)" }}>No upcoming events</p>
      </div>
    );
  };

  const renderMessages = () => {
    if (simulationMessages.length === 0) return null;

    return (
      <div
        className="mt-6 mb-4 p-4 rounded-lg border"
        style={{
          background: "hsl(var(--bg-light-hsl) / 0.5)",
          borderColor: "hsl(var(--cyber-cyan) / 0.3)",
          borderLeftWidth: "3px",
        }}
      >
        <p
          className="text-sm font-bold mb-2 font-mono uppercase tracking-wider"
          style={{ color: "hsl(var(--cyber-cyan))" }}
        >
          Simulation Results:
        </p>
        <ul className="space-y-1">
          {simulationMessages.map((msg, idx) => (
            <li
              key={idx}
              className="text-sm"
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
              }}
            >
              • {msg}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const getSimButtons = () => {
    const nextEvent = getNextMajorEvent();

    // Get the appropriate secondary button based on phase
    let secondaryButton = null;
    if (nextEvent) {
      let buttonLabel = "";
      let buttonIcon = null;
      switch (nextEvent.targetPhase) {
        case "free_agency":
          buttonLabel = "To Free Agency";
          break;
        case "draft":
          buttonLabel = "To Draft";
          break;
        case "training_camp":
          buttonLabel = "To Training Camp";
          break;
        case "preseason":
          buttonLabel = "To Preseason";
          break;
        case "regular_season":
          buttonLabel = "To Regular Season";
          break;
        case "trade_deadline":
          buttonLabel = "To Trade Deadline";
          break;
        case "postseason":
          buttonLabel = "To Postseason";
          break;
        case "offseason":
          buttonLabel = "To Offseason";
          break;
      }

      if (buttonLabel) {
        secondaryButton = (
          <button
            key="secondary"
            onClick={() => handleAdvanceToPhase(nextEvent.targetPhase)}
            disabled={isSimulating}
            className="cyber-button cyber-button-accent w-full flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            {isSimulating ? "Simulating..." : buttonLabel}
          </button>
        );
      }
    }

    return (
      <div className="grid grid-cols-3 gap-3 mt-6">
        {/* Primary button: Sim Day */}
        <button
          onClick={handleAdvanceDay}
          disabled={isSimulating}
          className="cyber-button w-full flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {isSimulating ? "..." : "Sim Day"}
        </button>

        {/* Secondary button: Sim Week */}
        <button
          onClick={handleAdvanceWeek}
          disabled={isSimulating}
          className="cyber-button w-full flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
            <polygon
              points="11 3 25 12 11 21 11 3"
              transform="translate(-6 0)"
            />
          </svg>
          {isSimulating ? "..." : "Sim Week"}
        </button>

        {/* Tertiary button: Phase-specific */}
        {secondaryButton || (
          <button
            disabled
            className="cyber-button w-full opacity-30 cursor-not-allowed"
          >
            <Zap size={16} className="mx-auto" />
          </button>
        )}
      </div>
    );
  };

  const { weekday, dateMain } = formatCurrentDate();

  return (
    <div className="cyber-panel p-6 relative">
      {/* Grid background */}
      <div className="cyber-grid" />

      {/* Content (above grid) */}
      <div className="relative z-10">
        {/* Header with badges */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="cyber-badge flex items-center gap-1.5">
              <Zap size={14} />
              {getPhaseDisplay()}
            </span>
            {isInSeasonPhase() && currentWeek > 0 && (
              <span className="cyber-badge cyber-badge-secondary">
                WEEK {currentWeek}
              </span>
            )}
          </div>
          <span
            className="text-xs font-mono tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            {year} SEASON
          </span>
        </div>

        {/* Date display */}
        <div className="cyber-date mb-6">
          <div className="cyber-date-day">{weekday}</div>
          <div className="cyber-date-main">{dateMain}</div>
        </div>

        {/* Event content */}
        {renderContent()}

        {/* Simulation messages */}
        {renderMessages()}

        {/* Action buttons */}
        {getSimButtons()}
      </div>
    </div>
  );
}
