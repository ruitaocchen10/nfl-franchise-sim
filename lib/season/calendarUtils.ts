/**
 * Season Calendar Utilities
 * Helper functions for date calculations, phase transitions, and week management
 */

import type { Database } from "@/lib/types/database.types";

type SeasonPhase = Database["public"]["Enums"]["season_phase"];
type GameTimeSlot = Database["public"]["Enums"]["game_time_slot"];

export interface SeasonDates {
  offseasonStart: Date;
  freeAgencyStart: Date;
  draftStart: Date;
  draftEnd: Date;
  trainingCampStart: Date;
  preseasonWeek1: Date;
  preseasonWeek2: Date;
  preseasonWeek3: Date;
  regularSeasonStart: Date;
  tradeDeadline: Date;
  regularSeasonEnd: Date;
  wildCardStart: Date;
  divisionalStart: Date;
  conferenceStart: Date;
  superBowl: Date;
}

/**
 * Generate key dates for a season based on the year
 * NFL schedule follows predictable patterns:
 * - Super Bowl: First Sunday in February
 * - Free Agency: Mid-March
 * - Draft: Late April
 * - Preseason: Early-mid August
 * - Regular Season: Thursday after Labor Day (first Mon in Sept)
 */
export function getSeasonDates(year: number): SeasonDates {
  // Post-Super Bowl offseason starts in mid-February
  const offseasonStart = new Date(year, 1, 12); // Feb 12

  // Free agency begins in mid-March
  const freeAgencyStart = new Date(year, 2, 13); // Mar 13

  // Draft is last week of April (Thu-Sat, 3 days)
  const draftStart = new Date(year, 3, 25); // Apr 25
  const draftEnd = new Date(year, 3, 27); // Apr 27

  // Training camp starts right after draft
  const trainingCampStart = new Date(year, 3, 28); // Apr 28

  // Preseason weeks (early-mid August, 3 weeks)
  const preseasonWeek1 = new Date(year, 7, 8); // Aug 8
  const preseasonWeek2 = new Date(year, 7, 15); // Aug 15
  const preseasonWeek3 = new Date(year, 7, 22); // Aug 22

  // Regular season starts first Thursday in September (after Labor Day)
  const regularSeasonStart = new Date(year, 8, 5); // Sep 5

  // Trade deadline is Tuesday after Week 9 games
  const tradeDeadline = new Date(year, 10, 5); // Nov 5

  // Regular season ends early January (Week 18)
  const regularSeasonEnd = new Date(year + 1, 0, 5); // Jan 5 (next year)

  // Playoffs
  const wildCardStart = new Date(year + 1, 0, 11); // Jan 11
  const divisionalStart = new Date(year + 1, 0, 18); // Jan 18
  const conferenceStart = new Date(year + 1, 0, 26); // Jan 26
  const superBowl = new Date(year + 1, 1, 9); // Feb 9 (next year)

  return {
    offseasonStart,
    freeAgencyStart,
    draftStart,
    draftEnd,
    trainingCampStart,
    preseasonWeek1,
    preseasonWeek2,
    preseasonWeek3,
    regularSeasonStart,
    tradeDeadline,
    regularSeasonEnd,
    wildCardStart,
    divisionalStart,
    conferenceStart,
    superBowl,
  };
}

/**
 * Determine the current season phase based on date
 */
export function getPhaseFromDate(currentDate: Date, year: number): SeasonPhase {
  const dates = getSeasonDates(year);

  if (currentDate < dates.freeAgencyStart) {
    return "offseason";
  } else if (currentDate < dates.draftStart) {
    return "free_agency";
  } else if (currentDate <= dates.draftEnd) {
    return "draft";
  } else if (currentDate < dates.preseasonWeek1) {
    return "training_camp";
  } else if (currentDate < dates.regularSeasonStart) {
    return "preseason";
  } else if (currentDate <= dates.regularSeasonEnd) {
    return "regular_season";
  } else {
    return "postseason";
  }
}

/**
 * Get week number from date during regular season
 * Week 1 starts on first Thursday in September
 * Returns 1-18 for regular season, 19-22 for playoffs
 */
export function getWeekFromDate(currentDate: Date, year: number): number {
  const dates = getSeasonDates(year);

  if (currentDate < dates.regularSeasonStart) {
    return 0; // Preseason/offseason
  }

  if (currentDate <= dates.regularSeasonEnd) {
    // Regular season: calculate weeks from season start
    const daysSinceStart = Math.floor(
      (currentDate.getTime() - dates.regularSeasonStart.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return Math.min(Math.floor(daysSinceStart / 7) + 1, 18);
  }

  // Playoffs
  if (currentDate < dates.divisionalStart) return 19; // Wild Card
  if (currentDate < dates.conferenceStart) return 20; // Divisional
  if (currentDate < dates.superBowl) return 21; // Conference
  if (currentDate <= dates.superBowl) return 22; // Super Bowl

  return 0; // Next offseason
}

/**
 * Get the Sunday date for a given week number
 */
export function getSundayOfWeek(weekNumber: number, year: number): Date {
  const dates = getSeasonDates(year);

  if (weekNumber === 0) {
    return dates.offseasonStart;
  }

  if (weekNumber <= 18) {
    // Regular season weeks
    const daysToAdd = (weekNumber - 1) * 7 + 3; // +3 to get to Sunday from Thursday
    return new Date(dates.regularSeasonStart.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  // Playoff weeks
  switch (weekNumber) {
    case 19:
      return dates.wildCardStart;
    case 20:
      return dates.divisionalStart;
    case 21:
      return dates.conferenceStart;
    case 22:
      return dates.superBowl;
    default:
      return dates.regularSeasonStart;
  }
}

/**
 * Get the display name for a time slot
 */
export function getTimeSlotDisplay(slot: GameTimeSlot | null): string {
  if (!slot) return "";

  const slotNames: Record<GameTimeSlot, string> = {
    early_window: "1:00 PM ET",
    late_window: "4:00 PM ET",
    snf: "Sunday Night Football",
    mnf: "Monday Night Football",
    tnf: "Thursday Night Football",
    saturday: "Saturday",
    thanksgiving: "Thanksgiving",
  };

  return slotNames[slot];
}

/**
 * Get the abbreviated display name for a time slot
 */
export function getTimeSlotBadge(slot: GameTimeSlot | null): string {
  if (!slot) return "";

  const badges: Record<GameTimeSlot, string> = {
    early_window: "Early",
    late_window: "Late",
    snf: "SNF",
    mnf: "MNF",
    tnf: "TNF",
    saturday: "SAT",
    thanksgiving: "TDAY",
  };

  return badges[slot];
}

/**
 * Format date for display in schedule
 * Examples: "Sunday, September 15", "Thursday, November 28"
 */
export function formatGameDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format date with year for season display
 * Example: "September 15, 2024"
 */
export function formatSeasonDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Check if a team has a bye week on a given date
 */
export function isTeamByeWeek(
  teamId: string,
  date: Date,
  byeWeeks: Array<{ team_id: string; bye_week_date: string }>,
): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return byeWeeks.some(
    (bye) =>
      bye.team_id === teamId &&
      new Date(bye.bye_week_date).toISOString().split("T")[0] === dateStr,
  );
}

/**
 * Get date for a specific day offset from a base date
 * Useful for scheduling games within a week
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get the Thursday of a given week (for TNF scheduling)
 */
export function getThursdayOfWeek(weekNumber: number, year: number): Date {
  const sunday = getSundayOfWeek(weekNumber, year);
  return addDays(sunday, -3); // Thursday is 3 days before Sunday
}

/**
 * Get the Monday of a given week (for MNF scheduling)
 */
export function getMondayOfWeek(weekNumber: number, year: number): Date {
  const sunday = getSundayOfWeek(weekNumber, year);
  return addDays(sunday, 1); // Monday is 1 day after Sunday
}

/**
 * Get the Saturday of a given week (for late-season Saturday games)
 */
export function getSaturdayOfWeek(weekNumber: number, year: number): Date {
  const sunday = getSundayOfWeek(weekNumber, year);
  return addDays(sunday, -1); // Saturday is 1 day before Sunday
}

/**
 * Check if the trade deadline has passed for a given date
 */
export function hasTradeDeadlinePassed(currentDate: Date, year: number): boolean {
  const dates = getSeasonDates(year);
  return currentDate >= dates.tradeDeadline;
}

/**
 * Format a phase name for display
 */
export function formatPhaseDisplay(phase: SeasonPhase): string {
  const phaseNames: Record<SeasonPhase, string> = {
    offseason: "Offseason",
    free_agency: "Free Agency",
    draft: "Draft",
    training_camp: "Training Camp",
    preseason: "Preseason",
    regular_season: "Regular Season",
    postseason: "Postseason",
  };

  return phaseNames[phase];
}
