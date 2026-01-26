/**
 * NFL Schedule Generator
 *
 * Two-Phase Architecture:
 * 1. Matchup Determination - WHO plays WHO (all 272 games)
 * 2. Schedule Assembly - WHEN they play (weeks, dates, times)
 */

import type { Database } from "@/lib/types/database.types";
import {
  getSundayOfWeek,
} from "@/lib/season/calendarUtils";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Team = Database["public"]["Tables"]["teams"]["Row"];
type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
type Standing = Database["public"]["Tables"]["team_standings"]["Row"];

type Division = "East" | "West" | "North" | "South";
type Conference = "AFC" | "NFC";

interface ByeWeekInsert {
  season_id: string;
  team_id: string;
  bye_week_number: number;
  bye_week_date: string;
}

interface Matchup {
  home_team_id: string;
  away_team_id: string;
  season_id: string;
  matchup_type:
    | "divisional"
    | "intra_conference_rotating"
    | "intra_conference_standings"
    | "inter_conference_rotating"
    | "inter_conference_17th";
}

interface OrganizedTeams {
  AFC: {
    East: Team[];
    West: Team[];
    North: Team[];
    South: Team[];
  };
  NFC: {
    East: Team[];
    West: Team[];
    North: Team[];
    South: Team[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LEAGUE_CONFIG = {
  TEAMS_PER_LEAGUE: 32,
  TEAMS_PER_DIVISION: 4,
  GAMES_PER_TEAM: 17,
  WEEKS_IN_SEASON: 18,
  BYE_WEEK_START: 6,
  BYE_WEEKS_COUNT: 8, // Weeks 6-13
  TEAMS_PER_BYE_WEEK: 4,
} as const;

const DIVISION_NAMES: Division[] = ["East", "West", "North", "South"];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Organizes teams by conference and division
 */
function organizeTeams(teams: Team[]): OrganizedTeams {
  const organized: OrganizedTeams = {
    AFC: { East: [], West: [], North: [], South: [] },
    NFC: { East: [], West: [], North: [], South: [] },
  };

  teams.forEach((team) => {
    organized[team.conference][team.division].push(team);
  });

  return organized;
}

/**
 * Get team's division rank from previous season standings
 */
function getDivisionRank(teamId: string, standings?: Standing[]): number {
  if (!standings) return 1;
  const standing = standings.find((s) => s.team_id === teamId);
  return standing?.division_rank || 1;
}

/**
 * Creates a matchup object
 */
function createMatchup(
  homeTeam: Team,
  awayTeam: Team,
  seasonId: string,
  matchupType: Matchup["matchup_type"],
): Matchup {
  return {
    home_team_id: homeTeam.id,
    away_team_id: awayTeam.id,
    season_id: seasonId,
    matchup_type: matchupType,
  };
}

/**
 * Check if a team has a bye in a given week
 */
function isTeamOnBye(
  teamId: string,
  week: number,
  byeWeeks: ByeWeekInsert[]
): boolean {
  return byeWeeks.some(
    (bye) => bye.team_id === teamId && bye.bye_week_number === week
  );
}

/**
 * Get the number of games required for a given week
 */
function getRequiredGamesForWeek(week: number): number {
  // Weeks 6-13 have bye weeks, so only 14 games (28 teams playing)
  return week >= 6 && week <= 13 ? 14 : 16;
}

/**
 * Get matchups available for a specific week
 */
function getAvailableMatchupsForWeek(
  allMatchups: Matchup[],
  week: number,
  byeWeeks: ByeWeekInsert[],
  usedMatchups: Set<string>,
  weekAssignments: Map<number, Matchup[]>
): Matchup[] {
  // Get teams already playing this week
  const teamsPlayingThisWeek = new Set<string>();
  const weekGames = weekAssignments.get(week) || [];
  weekGames.forEach((matchup) => {
    teamsPlayingThisWeek.add(matchup.home_team_id);
    teamsPlayingThisWeek.add(matchup.away_team_id);
  });

  return allMatchups.filter((matchup) => {
    // Create unique ID for this matchup
    const matchupId = `${matchup.home_team_id}-${matchup.away_team_id}`;

    // Check if already used
    if (usedMatchups.has(matchupId)) {
      return false;
    }

    // Check if either team is on bye
    if (
      isTeamOnBye(matchup.home_team_id, week, byeWeeks) ||
      isTeamOnBye(matchup.away_team_id, week, byeWeeks)
    ) {
      return false;
    }

    // Check if either team is already playing this week
    if (
      teamsPlayingThisWeek.has(matchup.home_team_id) ||
      teamsPlayingThisWeek.has(matchup.away_team_id)
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Create unique ID for a matchup
 */
function getMatchupId(matchup: Matchup): string {
  return `${matchup.home_team_id}-${matchup.away_team_id}`;
}

// ============================================================================
// BYE WEEK GENERATION
// ============================================================================

/**
 * Generate bye week assignments
 * Distributes 32 teams across 8 weeks (weeks 6-13)
 * 4 teams per week
 */
function generateByeWeeks(
  teams: Team[],
  seasonId: string,
  year: number,
): ByeWeekInsert[] {
  const byeWeeks: ByeWeekInsert[] = [];
  const shuffledTeams = shuffle([...teams]);

  for (let weekOffset = 0; weekOffset < LEAGUE_CONFIG.BYE_WEEKS_COUNT; weekOffset++) {
    const weekNumber = LEAGUE_CONFIG.BYE_WEEK_START + weekOffset;
    const startIdx = weekOffset * LEAGUE_CONFIG.TEAMS_PER_BYE_WEEK;

    for (let i = 0; i < LEAGUE_CONFIG.TEAMS_PER_BYE_WEEK; i++) {
      const teamIdx = startIdx + i;
      if (teamIdx < shuffledTeams.length) {
        const team = shuffledTeams[teamIdx];
        const byeDate = getSundayOfWeek(weekNumber, year);

        byeWeeks.push({
          season_id: seasonId,
          team_id: team.id,
          bye_week_number: weekNumber,
          bye_week_date: byeDate.toISOString(),
        });
      }
    }
  }

  return byeWeeks;
}

// ============================================================================
// PHASE 1: MATCHUP GENERATION
// ============================================================================

/**
 * 1. Generate divisional matchups (96 games)
 * Each team plays division rivals twice (home and away)
 */
function generateDivisionalMatchups(
  organized: OrganizedTeams,
  seasonId: string,
): Matchup[] {
  const matchups: Matchup[] = [];
  const conferences: Conference[] = ["AFC", "NFC"];

  conferences.forEach((conf) => {
    DIVISION_NAMES.forEach((div) => {
      const division = organized[conf][div];

      // Round-robin: each team plays every other team twice
      for (let i = 0; i < division.length; i++) {
        for (let j = i + 1; j < division.length; j++) {
          // Home and away games
          matchups.push(
            createMatchup(division[i], division[j], seasonId, "divisional")
          );
          matchups.push(
            createMatchup(division[j], division[i], seasonId, "divisional")
          );
        }
      }
    });
  });

  return matchups;
}

/**
 * 2. Generate intra-conference matchups (96 games)
 * Simplified: Each team plays 6 teams from other divisions in their conference
 * 2 teams from each of the 3 other divisions (based on standings when available)
 */
function generateIntraConferenceMatchups(
  organized: OrganizedTeams,
  seasonId: string,
  previousStandings?: Standing[],
): Matchup[] {
  const matchups: Matchup[] = [];
  const conferences: Conference[] = ["AFC", "NFC"];

  conferences.forEach((conf) => {
    // Process each unique division pair
    for (let div1Idx = 0; div1Idx < DIVISION_NAMES.length; div1Idx++) {
      for (let div2Idx = div1Idx + 1; div2Idx < DIVISION_NAMES.length; div2Idx++) {
        const div1Name = DIVISION_NAMES[div1Idx];
        const div2Name = DIVISION_NAMES[div2Idx];
        const div1Teams = organized[conf][div1Name];
        const div2Teams = organized[conf][div2Name];

        // Sort both divisions by standings
        const sortedDiv1 = previousStandings
          ? [...div1Teams].sort(
              (a, b) =>
                getDivisionRank(a.id, previousStandings) -
                getDivisionRank(b.id, previousStandings)
            )
          : div1Teams;

        const sortedDiv2 = previousStandings
          ? [...div2Teams].sort(
              (a, b) =>
                getDivisionRank(a.id, previousStandings) -
                getDivisionRank(b.id, previousStandings)
            )
          : div2Teams;

        // Each team in div1 plays 2 teams from div2
        // Team 0 plays teams 0,1; Team 1 plays teams 1,2; Team 2 plays teams 2,3; Team 3 plays teams 3,0
        sortedDiv1.forEach((team1, idx) => {
          for (let offset = 0; offset < 2; offset++) {
            const opponentIdx = (idx + offset) % 4;
            const team2 = sortedDiv2[opponentIdx];

            if (team2) {
              // Determine home/away based on team IDs
              if (team1.id < team2.id) {
                matchups.push(
                  createMatchup(team1, team2, seasonId, "intra_conference_rotating")
                );
              } else {
                matchups.push(
                  createMatchup(team2, team1, seasonId, "intra_conference_rotating")
                );
              }
            }
          }
        });
      }
    }
  });

  return matchups;
}

/**
 * 3. Generate inter-conference matchups (64 games)
 * Simplified: Each team plays 4 teams from opposite conference
 */
function generateInterConferenceMatchups(
  organized: OrganizedTeams,
  seasonId: string,
  previousStandings?: Standing[],
): Matchup[] {
  const matchups: Matchup[] = [];

  // Process only AFC divisions to avoid duplicates
  DIVISION_NAMES.forEach((afcDiv) => {
    const afcDivision = organized["AFC"][afcDiv];

    // Sort AFC division by standings
    const sortedAFC = previousStandings
      ? [...afcDivision].sort(
          (a, b) =>
            getDivisionRank(a.id, previousStandings) -
            getDivisionRank(b.id, previousStandings)
        )
      : afcDivision;

    // Each AFC team plays 4 NFC teams (one from each NFC division)
    sortedAFC.forEach((afcTeam, afcIdx) => {
      DIVISION_NAMES.forEach((nfcDiv) => {
        const nfcDivision = organized["NFC"][nfcDiv];

        // Sort NFC division by standings
        const sortedNFC = previousStandings
          ? [...nfcDivision].sort(
              (a, b) =>
                getDivisionRank(a.id, previousStandings) -
                getDivisionRank(b.id, previousStandings)
            )
          : nfcDivision;

        // Match by similar standings
        const nfcTeam = sortedNFC[afcIdx];

        if (nfcTeam) {
          // Alternate home/away based on team IDs
          if (afcTeam.id < nfcTeam.id) {
            matchups.push(
              createMatchup(afcTeam, nfcTeam, seasonId, "inter_conference_rotating")
            );
          } else {
            matchups.push(
              createMatchup(nfcTeam, afcTeam, seasonId, "inter_conference_rotating")
            );
          }
        }
      });
    });
  });

  return matchups;
}

/**
 * 4. Generate 17th game matchups (16 games)
 * Simplified: Additional inter-conference game based on standings
 * Each team gets one more inter-conference game with a similar-ranked opponent
 */
function generate17thGameMatchups(
  organized: OrganizedTeams,
  seasonId: string,
  previousStandings?: Standing[],
): Matchup[] {
  const matchups: Matchup[] = [];

  // Get all teams from both conferences and sort by conference rank
  const afcTeams: Team[] = [];
  const nfcTeams: Team[] = [];

  DIVISION_NAMES.forEach((div) => {
    afcTeams.push(...organized["AFC"][div]);
    nfcTeams.push(...organized["NFC"][div]);
  });

  // Sort by conference rank (or just use team order if no standings)
  const sortedAFC = previousStandings
    ? [...afcTeams].sort(
        (a, b) =>
          (previousStandings.find((s) => s.team_id === a.id)
            ?.conference_rank || 99) -
          (previousStandings.find((s) => s.team_id === b.id)
            ?.conference_rank || 99)
      )
    : afcTeams;

  const sortedNFC = previousStandings
    ? [...nfcTeams].sort(
        (a, b) =>
          (previousStandings.find((s) => s.team_id === a.id)
            ?.conference_rank || 99) -
          (previousStandings.find((s) => s.team_id === b.id)
            ?.conference_rank || 99)
      )
    : nfcTeams;

  // Match teams by conference rank (1st vs 1st, 2nd vs 2nd, etc.)
  for (let i = 0; i < 16; i++) {
    const afcTeam = sortedAFC[i];
    const nfcTeam = sortedNFC[i];

    if (afcTeam && nfcTeam) {
      // Alternate home/away based on team IDs
      if (afcTeam.id < nfcTeam.id) {
        matchups.push(
          createMatchup(afcTeam, nfcTeam, seasonId, "inter_conference_17th")
        );
      } else {
        matchups.push(
          createMatchup(nfcTeam, afcTeam, seasonId, "inter_conference_17th")
        );
      }
    }
  }

  return matchups;
}

/**
 * Validate matchups
 */
function validateMatchups(matchups: Matchup[], teams: Team[]): void {
  console.log("\n=== Validation ===");

  // Count total games
  console.log(`Total matchups: ${matchups.length}`);
  console.log(`Expected: 272 games (32 teams × 17 games ÷ 2)`);

  // Count games per team
  const teamGameCounts = new Map<string, number>();
  teams.forEach((team) => teamGameCounts.set(team.id, 0));

  matchups.forEach((matchup) => {
    teamGameCounts.set(
      matchup.home_team_id,
      (teamGameCounts.get(matchup.home_team_id) || 0) + 1
    );
    teamGameCounts.set(
      matchup.away_team_id,
      (teamGameCounts.get(matchup.away_team_id) || 0) + 1
    );
  });

  // Check if all teams have 17 games
  const incorrectTeams = teams.filter(
    (team) => teamGameCounts.get(team.id) !== LEAGUE_CONFIG.GAMES_PER_TEAM
  );

  if (incorrectTeams.length > 0) {
    console.warn(`⚠️  WARNING: ${incorrectTeams.length} teams don't have 17 games`);
    incorrectTeams.forEach((team) => {
      console.warn(
        `   ${team.city} ${team.name}: ${teamGameCounts.get(team.id)} games`
      );
    });
  } else {
    console.log(`✓ All teams have exactly 17 games`);
  }

  // Count by matchup type
  const typeCounts = new Map<string, number>();
  matchups.forEach((m) => {
    typeCounts.set(m.matchup_type, (typeCounts.get(m.matchup_type) || 0) + 1);
  });

  console.log("\nGames by type:");
  typeCounts.forEach((count, type) => {
    console.log(`  ${type}: ${count} games`);
  });
}

// ============================================================================
// PHASE 2: WEEK ASSIGNMENT
// ============================================================================

/**
 * Select 16 divisional games for Week 18
 * Must cover all 32 teams (each team plays exactly once)
 */
function selectWeek18DivisionalGames(
  divisionalMatchups: Matchup[],
  teams: Team[]
): Matchup[] {
  // Goal: Select 16 divisional games that cover all 32 teams
  // Strategy: For each division, select 2 games that cover all 4 teams

  const selected: Matchup[] = [];
  const teamsCovered = new Set<string>();
  const conferences: Conference[] = ["AFC", "NFC"];

  conferences.forEach((conf) => {
    DIVISION_NAMES.forEach((div) => {
      // Get all teams in this division
      const divisionTeams = teams.filter(
        (t) => t.conference === conf && t.division === div
      );

      // Get all divisional matchups for this division
      const divisionMatchups = divisionalMatchups.filter((matchup) => {
        return (
          divisionTeams.some((t) => t.id === matchup.home_team_id) &&
          divisionTeams.some((t) => t.id === matchup.away_team_id)
        );
      });

      // Find 2 games that cover all 4 teams
      let foundPair = false;
      for (let i = 0; i < divisionMatchups.length && !foundPair; i++) {
        for (let j = i + 1; j < divisionMatchups.length && !foundPair; j++) {
          const game1 = divisionMatchups[i];
          const game2 = divisionMatchups[j];

          const teamsInPair = new Set([
            game1.home_team_id,
            game1.away_team_id,
            game2.home_team_id,
            game2.away_team_id,
          ]);

          // Check if these 2 games cover all 4 teams
          if (teamsInPair.size === 4) {
            selected.push(game1, game2);
            teamsInPair.forEach((teamId) => teamsCovered.add(teamId));
            foundPair = true; // Exit loops for this division
          }
        }
      }

      if (!foundPair) {
        throw new Error(
          `Could not find valid Week 18 games for ${conf} ${div}`
        );
      }
    });
  });

  // Validate
  if (selected.length !== 16 || teamsCovered.size !== 32) {
    throw new Error(
      `Week 18 selection failed: ${selected.length} games, ${teamsCovered.size} teams covered`
    );
  }

  return selected;
}

/**
 * Get teams that have bye weeks
 */
function getTeamsWithByes(byeWeeks: ByeWeekInsert[]): Set<string> {
  return new Set(byeWeeks.map((bye) => bye.team_id));
}

/**
 * Calculate flexibility score for a matchup
 * Returns number of weeks this matchup can be placed in
 */
function calculateMatchupFlexibility(
  matchup: Matchup,
  byeWeeks: ByeWeekInsert[],
  startWeek: number,
  endWeek: number
): number {
  let availableWeeks = 0;
  for (let week = startWeek; week <= endWeek; week++) {
    if (
      !isTeamOnBye(matchup.home_team_id, week, byeWeeks) &&
      !isTeamOnBye(matchup.away_team_id, week, byeWeeks)
    ) {
      availableWeeks++;
    }
  }
  return availableWeeks;
}

/**
 * Sort matchups by constraint level (smart heuristics)
 */
function sortMatchupsByConstraint(
  matchups: Matchup[],
  byeWeeks: ByeWeekInsert[],
  teamsWithByes: Set<string>,
  addRandomness: boolean = false
): Matchup[] {
  const sorted = [...matchups].sort((a, b) => {
    // Priority 1: Matchups involving teams with byes
    const aHasBye =
      teamsWithByes.has(a.home_team_id) || teamsWithByes.has(a.away_team_id);
    const bHasBye =
      teamsWithByes.has(b.home_team_id) || teamsWithByes.has(b.away_team_id);

    if (aHasBye && !bHasBye) return -1;
    if (!aHasBye && bHasBye) return 1;

    // Priority 2: Flexibility (fewer available weeks = higher priority)
    const aFlex = calculateMatchupFlexibility(a, byeWeeks, 1, 17);
    const bFlex = calculateMatchupFlexibility(b, byeWeeks, 1, 17);

    if (aFlex !== bFlex) return aFlex - bFlex;

    // Priority 3: Game type diversity
    const typeOrder: Record<Matchup["matchup_type"], number> = {
      divisional: 1,
      intra_conference_rotating: 2,
      intra_conference_standings: 2,
      inter_conference_rotating: 3,
      inter_conference_17th: 4,
    };
    return typeOrder[a.matchup_type] - typeOrder[b.matchup_type];
  });

  // Add randomness if requested (shuffle in small groups)
  if (addRandomness) {
    const groupSize = 5;
    const shuffled: Matchup[] = [];
    for (let i = 0; i < sorted.length; i += groupSize) {
      const group = sorted.slice(i, i + groupSize);
      shuffled.push(...shuffle(group));
    }
    return shuffled;
  }

  return sorted;
}

/**
 * Greedy assignment with shuffling - simpler and faster than backtracking
 */
function greedyAssignment(
  matchups: Matchup[],
  byeWeeks: ByeWeekInsert[],
  startWeek: number,
  endWeek: number,
  maxAttempts: number = 50
): { success: boolean; assignments: Map<number, Matchup[]> } {
  const teamsWithByes = getTeamsWithByes(byeWeeks);

  // Try multiple times with different orderings
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Use smart sorting with increasing randomness
    const addRandomness = attempt > 0;
    const sortedMatchups = sortMatchupsByConstraint(
      matchups,
      byeWeeks,
      teamsWithByes,
      addRandomness
    );

    const result = trySmartGreedyAssignment(
      sortedMatchups,
      byeWeeks,
      startWeek,
      endWeek
    );

    if (result.success) {
      console.log(`✓ Succeeded on attempt ${attempt + 1}`);
      return result;
    }

    if (attempt % 10 === 9) {
      console.log(`  Attempt ${attempt + 1}/${maxAttempts} failed, retrying...`);
    }
  }

  return { success: false, assignments: new Map() };
}

function trySmartGreedyAssignment(
  sortedMatchups: Matchup[],
  byeWeeks: ByeWeekInsert[],
  startWeek: number,
  endWeek: number
): { success: boolean; assignments: Map<number, Matchup[]> } {
  const assignments = new Map<number, Matchup[]>();
  const usedMatchups = new Set<string>();

  // Process weeks in smart order: bye weeks first (most constrained)
  const byeWeekNumbers = [6, 7, 8, 9, 10, 11, 12, 13];
  const regularWeeks = [1, 2, 3, 4, 5, 14, 15, 16, 17];
  const weekOrder = [...byeWeekNumbers, ...regularWeeks];

  for (const week of weekOrder) {
    const requiredGames = getRequiredGamesForWeek(week);
    const weekGames: Matchup[] = [];
    const teamsPlayingThisWeek = new Set<string>();

    // Try to assign games for this week
    for (const matchup of sortedMatchups) {
      const matchupId = getMatchupId(matchup);

      // Skip if already used
      if (usedMatchups.has(matchupId)) {
        continue;
      }

      // Skip if either team is on bye
      if (
        isTeamOnBye(matchup.home_team_id, week, byeWeeks) ||
        isTeamOnBye(matchup.away_team_id, week, byeWeeks)
      ) {
        continue;
      }

      // Skip if either team already playing this week
      if (
        teamsPlayingThisWeek.has(matchup.home_team_id) ||
        teamsPlayingThisWeek.has(matchup.away_team_id)
      ) {
        continue;
      }

      // Add this matchup to the week
      weekGames.push(matchup);
      usedMatchups.add(matchupId);
      teamsPlayingThisWeek.add(matchup.home_team_id);
      teamsPlayingThisWeek.add(matchup.away_team_id);

      // Check if week is full
      if (weekGames.length === requiredGames) {
        break;
      }
    }

    // Check if we filled the week
    if (weekGames.length < requiredGames) {
      return { success: false, assignments: new Map() };
    }

    assignments.set(week, weekGames);
  }

  // Check if all matchups were used
  if (usedMatchups.size !== sortedMatchups.length) {
    return { success: false, assignments: new Map() };
  }

  return { success: true, assignments };
}

/**
 * Convert matchup assignments to GameInsert objects with dates
 */
function convertAssignmentsToGames(
  assignments: Map<number, Matchup[]>,
  week18Games: Matchup[],
  year: number
): GameInsert[] {
  const games: GameInsert[] = [];

  // Process weeks 1-17
  for (const [week, matchups] of assignments.entries()) {
    for (const matchup of matchups) {
      const gameDate = getSundayOfWeek(week, year);

      games.push({
        season_id: matchup.season_id,
        week: week,
        game_date: gameDate.toISOString(),
        game_time_slot: null, // Phase 3 will add time slots
        game_type: "regular",
        home_team_id: matchup.home_team_id,
        away_team_id: matchup.away_team_id,
        simulated: false,
      });
    }
  }

  // Add Week 18
  const week18Date = getSundayOfWeek(18, year);
  for (const matchup of week18Games) {
    games.push({
      season_id: matchup.season_id,
      week: 18,
      game_date: week18Date.toISOString(),
      game_time_slot: null,
      game_type: "regular",
      home_team_id: matchup.home_team_id,
      away_team_id: matchup.away_team_id,
      simulated: false,
    });
  }

  return games;
}

/**
 * Validate the final schedule
 */
function validateSchedule(
  games: GameInsert[],
  byeWeeks: ByeWeekInsert[],
  teams: Team[]
): void {
  console.log("\n=== Schedule Validation ===");

  // Check total games
  const totalGames = games.length;
  console.log(`Total games: ${totalGames} (expected: 272)`);

  if (totalGames !== 272) {
    console.warn(`⚠️  WARNING: Expected 272 games, got ${totalGames}`);
  }

  // Check games per week
  const gamesByWeek = new Map<number, number>();
  games.forEach((g) => {
    gamesByWeek.set(g.week, (gamesByWeek.get(g.week) || 0) + 1);
  });

  console.log("\nGames per week:");
  for (let week = 1; week <= 18; week++) {
    const count = gamesByWeek.get(week) || 0;
    const expected = week >= 6 && week <= 13 ? 14 : 16;
    const status = count === expected ? "✓" : "✗";
    console.log(`  ${status} Week ${week}: ${count} games (expected: ${expected})`);
  }

  // Check each team plays once per week (except bye weeks)
  const teamGamesByWeek = new Map<number, Set<string>>();
  games.forEach((game) => {
    if (!teamGamesByWeek.has(game.week)) {
      teamGamesByWeek.set(game.week, new Set());
    }
    const teamsInWeek = teamGamesByWeek.get(game.week)!;
    teamsInWeek.add(game.home_team_id);
    teamsInWeek.add(game.away_team_id);
  });

  // Check no team plays during bye
  let byeViolations = 0;
  byeWeeks.forEach((bye) => {
    const teamsInByeWeek = teamGamesByWeek.get(bye.bye_week_number);
    if (teamsInByeWeek && teamsInByeWeek.has(bye.team_id)) {
      console.warn(
        `⚠️  Team ${bye.team_id} plays during their bye week (Week ${bye.bye_week_number})`
      );
      byeViolations++;
    }
  });

  if (byeViolations === 0) {
    console.log("✓ No teams play during their bye week");
  }

  console.log("✓ Schedule validation complete");
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================
export function generateRegularSeasonSchedule(
  teams: Team[],
  seasonId: string,
  year: number,
  previousStandings?: Standing[],
) {
  console.log("\n=== NFL Schedule Generator ===");
  console.log(`Season Year: ${year}`);
  console.log(`Teams: ${teams.length}`);

  // Generate bye weeks first
  const byeWeeks = generateByeWeeks(teams, seasonId, year);
  console.log(`✓ Bye weeks: ${byeWeeks.length} assigned`);

  // Organize teams by conference and division
  const organized = organizeTeams(teams);

  console.log("\n=== Phase 1: Matchup Generation (Simplified) ===");

  // 1. Divisional games (96 games) - 6 per team
  const divisionalMatchups = generateDivisionalMatchups(organized, seasonId);
  console.log(`✓ Divisional: ${divisionalMatchups.length} games`);

  // 2. Intra-conference games (96 games) - 6 per team
  const intraConferenceMatchups = generateIntraConferenceMatchups(
    organized,
    seasonId,
    previousStandings
  );
  console.log(`✓ Intra-conference: ${intraConferenceMatchups.length} games`);

  // 3. Inter-conference games (64 games) - 4 per team
  const interConferenceMatchups = generateInterConferenceMatchups(
    organized,
    seasonId,
    previousStandings
  );
  console.log(`✓ Inter-conference: ${interConferenceMatchups.length} games`);

  // 4. 17th game (16 games) - 1 per team
  const game17thMatchups = generate17thGameMatchups(
    organized,
    seasonId,
    previousStandings
  );
  console.log(`✓ 17th game: ${game17thMatchups.length} games`);

  // Combine all matchups
  const allMatchups = [
    ...divisionalMatchups,
    ...intraConferenceMatchups,
    ...interConferenceMatchups,
    ...game17thMatchups,
  ];

  // Validate
  validateMatchups(allMatchups, teams);

  // ============================================================================
  // Phase 2: Assign matchups to weeks
  // ============================================================================

  console.log("\n=== Phase 2: Week Assignment ===");

  // Step 1: Select Week 18 games (must be divisional, cover all 32 teams)
  const week18Games = selectWeek18DivisionalGames(divisionalMatchups, teams);
  console.log(`✓ Week 18: Selected ${week18Games.length} divisional games`);

  // Step 2: Get remaining matchups for weeks 1-17
  const week18Ids = new Set(week18Games.map(getMatchupId));
  const remainingMatchups = allMatchups.filter(
    (m) => !week18Ids.has(getMatchupId(m))
  );

  console.log(`Assigning ${remainingMatchups.length} matchups to weeks 1-17...`);

  // Step 3: Greedy assignment with random restarts
  const result = greedyAssignment(remainingMatchups, byeWeeks, 1, 17);

  if (!result.success) {
    throw new Error("Failed to generate schedule after multiple attempts - please try again");
  }

  console.log("✓ Successfully assigned all matchups to weeks");

  // Step 4: Convert to game objects with dates
  const games = convertAssignmentsToGames(result.assignments, week18Games, year);

  console.log(`✓ Generated ${games.length} games with dates`);

  // Step 5: Validate the final schedule
  validateSchedule(games, byeWeeks, teams);

  return { games, byeWeeks };
}

/**
 * Generate full season schedule (preseason + regular season)
 * Currently only generates regular season matchups
 */
export function generateFullSeasonSchedule(
  teams: Team[],
  seasonId: string,
  year: number,
  previousStandings?: Standing[],
): {
  games: GameInsert[];
  byeWeeks: ByeWeekInsert[];
} {
  // For now, just generate regular season
  // TODO: Add preseason games later
  return generateRegularSeasonSchedule(teams, seasonId, year, previousStandings);
}
