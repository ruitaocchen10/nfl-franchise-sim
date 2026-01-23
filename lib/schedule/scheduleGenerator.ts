/**
 * NFL Schedule Generator
 * Generates preseason (3 games) and regular season (17 games) schedules
 * Assigns realistic dates and time slots (SNF, MNF, TNF, etc.)
 * Based on NFL scheduling formula
 */

import type { Database } from "@/lib/types/database.types";
import {
  getSeasonDates,
  getSundayOfWeek,
  getThursdayOfWeek,
  getMondayOfWeek,
  getSaturdayOfWeek,
  addDays,
} from "@/lib/season/calendarUtils";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
type GameTimeSlot = Database["public"]["Enums"]["game_time_slot"];
type ByeWeekInsert = {
  season_id: string;
  team_id: string;
  bye_week_number: number;
  bye_week_date: string;
};

interface Division {
  name: string;
  teams: Team[];
}

interface Conference {
  name: "AFC" | "NFC";
  divisions: {
    East: Team[];
    West: Team[];
    North: Team[];
    South: Team[];
  };
}

/**
 * Organizes teams by conference and division
 */
function organizeTeams(teams: Team[]): {
  AFC: Conference;
  NFC: Conference;
} {
  const afc: Conference = {
    name: "AFC",
    divisions: { East: [], West: [], North: [], South: [] },
  };
  const nfc: Conference = {
    name: "NFC",
    divisions: { East: [], West: [], North: [], South: [] },
  };

  teams.forEach((team) => {
    if (team.conference === "AFC") {
      afc.divisions[team.division].push(team);
    } else {
      nfc.divisions[team.division].push(team);
    }
  });

  return { AFC: afc, NFC: nfc };
}

/**
 * Shuffles an array (Fisher-Yates shuffle)
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
 * Generate bye week assignments for all teams
 * Bye weeks occur during weeks 6-14, one per team
 */
function generateByeWeeks(
  teams: Team[],
  seasonId: string,
  year: number,
): ByeWeekInsert[] {
  const byeWeeks: ByeWeekInsert[] = [];
  const shuffledTeams = shuffle([...teams]);

  // Distribute teams across bye weeks 6-14 (9 weeks, 32 teams)
  // ~3-4 teams per week
  let weekNumber = 6;
  shuffledTeams.forEach((team, index) => {
    if (index > 0 && index % 4 === 0) {
      weekNumber++;
    }
    if (weekNumber > 14) weekNumber = 14; // Cap at week 14

    const byeDate = getSundayOfWeek(weekNumber, year);

    byeWeeks.push({
      season_id: seasonId,
      team_id: team.id,
      bye_week_number: weekNumber,
      bye_week_date: byeDate.toISOString(),
    });
  });

  return byeWeeks;
}

/**
 * Assigns games to weeks while avoiding same-team matchups and bye weeks
 */
function assignWeeks(
  games: Omit<GameInsert, "week">[],
  byeWeeks: ByeWeekInsert[],
  totalWeeks: number = 18,
): GameInsert[] {
  const gamesWithWeeks: GameInsert[] = [];
  const teamWeekAssignments: Map<string, Set<number>> = new Map();

  // Initialize tracking for each team
  games.forEach((game) => {
    if (!teamWeekAssignments.has(game.home_team_id)) {
      teamWeekAssignments.set(game.home_team_id, new Set());
    }
    if (!teamWeekAssignments.has(game.away_team_id)) {
      teamWeekAssignments.set(game.away_team_id, new Set());
    }
  });

  // Block out bye weeks
  byeWeeks.forEach((bye) => {
    const teamSchedule = teamWeekAssignments.get(bye.team_id);
    if (teamSchedule) {
      teamSchedule.add(bye.bye_week_number);
    }
  });

  // Shuffle games for better distribution
  const shuffledGames = shuffle(games);

  // Assign each game to earliest available week
  shuffledGames.forEach((game) => {
    const homeSchedule = teamWeekAssignments.get(game.home_team_id)!;
    const awaySchedule = teamWeekAssignments.get(game.away_team_id)!;

    // Find first week where both teams are available
    let assignedWeek = 1;
    for (let week = 1; week <= totalWeeks; week++) {
      if (!homeSchedule.has(week) && !awaySchedule.has(week)) {
        assignedWeek = week;
        break;
      }
    }

    // Mark teams as scheduled for this week
    homeSchedule.add(assignedWeek);
    awaySchedule.add(assignedWeek);

    gamesWithWeeks.push({
      ...game,
      week: assignedWeek,
    });
  });

  return gamesWithWeeks;
}

/**
 * Assign dates and time slots to games
 */
function assignDatesAndTimeSlots(
  games: GameInsert[],
  year: number,
  gameType: "preseason" | "regular",
): GameInsert[] {
  if (gameType === "preseason") {
    return assignPreseasonDates(games, year);
  }
  return assignRegularSeasonDates(games, year);
}

/**
 * Assign dates to preseason games
 * 3 weeks of preseason games distributed across Thu/Sat/Sun
 */
function assignPreseasonDates(games: GameInsert[], year: number): GameInsert[] {
  const dates = getSeasonDates(year);
  const gamesWithDates: GameInsert[] = [];

  // Group games by week
  const gamesByWeek = new Map<number, GameInsert[]>();
  games.forEach((game) => {
    if (!gamesByWeek.has(game.week)) {
      gamesByWeek.set(game.week, []);
    }
    gamesByWeek.get(game.week)!.push(game);
  });

  // Preseason week base dates
  const preseasonWeeks = [
    dates.preseasonWeek1,
    dates.preseasonWeek2,
    dates.preseasonWeek3,
  ];

  gamesByWeek.forEach((weekGames, weekNum) => {
    const baseDate = preseasonWeeks[weekNum - 1] || dates.preseasonWeek1;
    const shuffled = shuffle(weekGames);

    shuffled.forEach((game, index) => {
      // Distribute across Thu (index 0-5), Sat (6-15), Sun (16+)
      let gameDate: Date;
      let timeSlot: GameTimeSlot;

      if (index < 6) {
        gameDate = addDays(baseDate, 0); // Thursday
        timeSlot = "tnf";
      } else if (index < 16) {
        gameDate = addDays(baseDate, 2); // Saturday
        timeSlot = "saturday";
      } else {
        gameDate = addDays(baseDate, 3); // Sunday
        timeSlot = "early_window";
      }

      gamesWithDates.push({
        ...game,
        game_date: gameDate.toISOString(),
        game_time_slot: timeSlot,
      });
    });
  });

  return gamesWithDates;
}

/**
 * Assign dates and time slots to regular season games
 * Includes TNF, SNF, MNF, and special games (Thanksgiving, Saturday)
 */
function assignRegularSeasonDates(games: GameInsert[], year: number): GameInsert[] {
  const gamesWithDates: GameInsert[] = [];

  // Group games by week
  const gamesByWeek = new Map<number, GameInsert[]>();
  games.forEach((game) => {
    if (!gamesByWeek.has(game.week)) {
      gamesByWeek.set(game.week, []);
    }
    gamesByWeek.get(game.week)!.push(game);
  });

  gamesByWeek.forEach((weekGames, weekNum) => {
    const shuffled = shuffle(weekGames);
    const baseSunday = getSundayOfWeek(weekNum, year);

    let tnfAssigned = false;
    let snfAssigned = false;
    let mnfCount = 0;
    let satCount = 0;

    shuffled.forEach((game, index) => {
      let gameDate: Date;
      let timeSlot: GameTimeSlot;

      // Week 1: No TNF, starts on Thursday
      if (weekNum === 1 && index === 0) {
        gameDate = getThursdayOfWeek(weekNum, year);
        timeSlot = "tnf";
        tnfAssigned = true;
      }
      // Weeks 2-17: Assign 1 TNF per week
      else if (!tnfAssigned && weekNum >= 2 && weekNum <= 17 && index === 0) {
        gameDate = getThursdayOfWeek(weekNum, year);
        timeSlot = "tnf";
        tnfAssigned = true;
      }
      // Thanksgiving games (Week 13)
      else if (weekNum === 13 && index < 3) {
        gameDate = getThursdayOfWeek(13, year);
        timeSlot = "thanksgiving";
      }
      // Late season Saturday games (Weeks 16-18)
      else if (weekNum >= 16 && satCount < 2) {
        gameDate = getSaturdayOfWeek(weekNum, year);
        timeSlot = "saturday";
        satCount++;
      }
      // Monday Night Football (1-2 games per week)
      else if (mnfCount < 1 || (weekNum === 1 && mnfCount < 2)) {
        gameDate = getMondayOfWeek(weekNum, year);
        timeSlot = "mnf";
        mnfCount++;
      }
      // Sunday Night Football (1 per week)
      else if (!snfAssigned) {
        gameDate = baseSunday;
        timeSlot = "snf";
        snfAssigned = true;
      }
      // Sunday late window (~25% of remaining)
      else if (Math.random() < 0.25) {
        gameDate = baseSunday;
        timeSlot = "late_window";
      }
      // Sunday early window (default)
      else {
        gameDate = baseSunday;
        timeSlot = "early_window";
      }

      gamesWithDates.push({
        ...game,
        game_date: gameDate.toISOString(),
        game_time_slot: timeSlot,
      });
    });
  });

  return gamesWithDates;
}

/**
 * Generate preseason games (3 games per team = 48 total)
 * Matchups are typically regional/conference-based
 */
function generatePreseasonGames(
  teams: Team[],
  seasonId: string,
): Omit<GameInsert, "week" | "game_date" | "game_time_slot">[] {
  const allGames: Omit<GameInsert, "week" | "game_date" | "game_time_slot">[] = [];
  const { AFC, NFC } = organizeTeams(teams);

  // Helper to create a game
  const createGame = (
    homeTeam: Team,
    awayTeam: Team,
  ): Omit<GameInsert, "week" | "game_date" | "game_time_slot"> => ({
    season_id: seasonId,
    home_team_id: homeTeam.id,
    away_team_id: awayTeam.id,
    game_type: "preseason",
    weather: "clear",
    simulated: false,
  });

  // Generate 3 games per team (48 total games)
  // Simple approach: shuffle teams and pair them up 3 times
  for (let gameNum = 0; gameNum < 3; gameNum++) {
    const shuffledTeams = shuffle([...teams]);

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 < shuffledTeams.length) {
        // Alternate home/away each game
        if (gameNum % 2 === 0) {
          allGames.push(createGame(shuffledTeams[i], shuffledTeams[i + 1]));
        } else {
          allGames.push(createGame(shuffledTeams[i + 1], shuffledTeams[i]));
        }
      }
    }
  }

  return allGames;
}

/**
 * Generates all regular season games (272 total)
 * Based on NFL scheduling formula:
 * - 6 games vs division opponents (home and away)
 * - 4 games vs one division in same conference (rotating)
 * - 4 games vs one division in opposite conference (rotating)
 * - 2 games vs same-place finishers in other divisions
 * - 1 extra game
 */
export function generateRegularSeasonSchedule(
  teams: Team[],
  seasonId: string,
  year: number = 2024,
): {
  games: GameInsert[];
  byeWeeks: ByeWeekInsert[];
} {
  const { AFC, NFC } = organizeTeams(teams);
  const allGames: Omit<GameInsert, "week">[] = [];

  let divisionalGames = 0;
  let intraConferenceGames = 0;
  let interConferenceGames = 0;
  let samePlaceGames = 0;
  let extraGames = 0;

  // Helper to create a game
  const createGame = (
    homeTeam: Team,
    awayTeam: Team,
  ): Omit<GameInsert, "week"> => ({
    season_id: seasonId,
    home_team_id: homeTeam.id,
    away_team_id: awayTeam.id,
    game_type: "regular",
    weather: "clear",
    simulated: false,
  });

  const divisionNames: Array<keyof Conference["divisions"]> = [
    "East",
    "West",
    "North",
    "South",
  ];

  // 1. DIVISIONAL GAMES (6 games per team)
  // Each team plays every other team in division twice (home and away)
  [AFC, NFC].forEach((conference) => {
    divisionNames.forEach((divisionName) => {
      const division = conference.divisions[divisionName];
      for (let i = 0; i < division.length; i++) {
        for (let j = i + 1; j < division.length; j++) {
          allGames.push(createGame(division[i], division[j]));
          allGames.push(createGame(division[j], division[i]));
          divisionalGames += 2;
        }
      }
    });
  });

  // Track which division pairings we've already processed to avoid duplicates
  const processedPairings = new Set<string>();

  const getPairingKey = (conf1: string, div1: string, conf2: string, div2: string) => {
    const pair1 = `${conf1}-${div1}:${conf2}-${div2}`;
    const pair2 = `${conf2}-${div2}:${conf1}-${div1}`;
    return pair1 < pair2 ? pair1 : pair2;
  };

  // 2. ROTATING INTRA-CONFERENCE GAMES (4 games per team)
  // Each division plays one other division in same conference each year
  [AFC, NFC].forEach((conference) => {
    divisionNames.forEach((divisionName, divIndex) => {
      const division = conference.divisions[divisionName];

      // Determine which division to play this year
      const otherDivIndex = (divIndex + (year % 3) + 1) % 4;
      const otherDivisionName = divisionNames[otherDivIndex];
      const otherDivision = conference.divisions[otherDivisionName];

      // Only create games once per division pairing
      const pairingKey = getPairingKey(
        conference.name, divisionName,
        conference.name, otherDivisionName
      );

      if (!processedPairings.has(pairingKey)) {
        processedPairings.add(pairingKey);

        division.forEach((team) => {
          otherDivision.forEach((opponent) => {
            // Alternate home/away based on team IDs for consistency
            if (team.id < opponent.id) {
              allGames.push(createGame(team, opponent));
            } else {
              allGames.push(createGame(opponent, team));
            }
            intraConferenceGames++;
          });
        });
      }
    });
  });

  // 3. INTER-CONFERENCE GAMES (4 games per team)
  // Each division plays one division from opposite conference (rotating 4-year cycle)
  [AFC, NFC].forEach((conference) => {
    const oppositeConference = conference.name === "AFC" ? NFC : AFC;

    divisionNames.forEach((divisionName, divIndex) => {
      const division = conference.divisions[divisionName];

      // Determine which opposite conference division to play this year
      const interDivIndex = (divIndex + Math.floor(year / 4)) % 4;
      const interDivisionName = divisionNames[interDivIndex];
      const interDivision = oppositeConference.divisions[interDivisionName];

      // Only create games once per division pairing
      const pairingKey = getPairingKey(
        conference.name, divisionName,
        oppositeConference.name, interDivisionName
      );

      if (!processedPairings.has(pairingKey)) {
        processedPairings.add(pairingKey);

        division.forEach((team) => {
          interDivision.forEach((opponent) => {
            // Alternate home/away
            if (team.id < opponent.id) {
              allGames.push(createGame(team, opponent));
            } else {
              allGames.push(createGame(opponent, team));
            }
            interConferenceGames++;
          });
        });
      }
    });
  });

  // 4. SAME-PLACE FINISHER GAMES (2 games per team)
  // Teams play against same-place finishers from the two divisions in their conference
  // that they're not already playing
  [AFC, NFC].forEach((conference) => {
    divisionNames.forEach((divisionName, divIndex) => {
      const division = conference.divisions[divisionName];

      // Find the two divisions NOT being played in rotating matchup
      const rotatingDivIndex = (divIndex + (year % 3) + 1) % 4;
      const otherDivIndices = divisionNames
        .map((_, idx) => idx)
        .filter((idx) => idx !== divIndex && idx !== rotatingDivIndex);

      otherDivIndices.forEach((otherIdx) => {
        const otherDivisionName = divisionNames[otherIdx];
        const otherDivision = conference.divisions[otherDivisionName];

        // Only create games once per division pairing
        const pairingKey = getPairingKey(
          conference.name, divisionName,
          conference.name, otherDivisionName
        );

        if (!processedPairings.has(pairingKey)) {
          processedPairings.add(pairingKey);

          division.forEach((team, teamIndex) => {
            if (otherDivision[teamIndex]) {
              const opponent = otherDivision[teamIndex];
              // Alternate home/away
              if (team.id < opponent.id) {
                allGames.push(createGame(team, opponent));
              } else {
                allGames.push(createGame(opponent, team));
              }
              samePlaceGames++;
            }
          });
        }
      });
    });
  });

  // 5. EXTRA 17TH GAME
  // Count games per team and add 17th game for teams that need it
  const teamGameCounts = new Map<string, number>();
  teams.forEach((team) => {
    teamGameCounts.set(team.id, 0);
  });

  allGames.forEach((game) => {
    teamGameCounts.set(
      game.home_team_id,
      (teamGameCounts.get(game.home_team_id) || 0) + 1,
    );
    teamGameCounts.set(
      game.away_team_id,
      (teamGameCounts.get(game.away_team_id) || 0) + 1,
    );
  });

  // Add 17th game for teams that need it
  const teamsNeedingGames = teams.filter(
    (team) => (teamGameCounts.get(team.id) || 0) < 17,
  );

  // Separate by conference for inter-conference matchups
  const afcNeedingGames = teamsNeedingGames.filter((t) => t.conference === "AFC");
  const nfcNeedingGames = teamsNeedingGames.filter((t) => t.conference === "NFC");

  // Create inter-conference matchups
  const minLength = Math.min(afcNeedingGames.length, nfcNeedingGames.length);
  for (let i = 0; i < minLength; i++) {
    const afcTeam = afcNeedingGames[i];
    const nfcTeam = nfcNeedingGames[i];

    // Alternate home/away
    if (afcTeam.id < nfcTeam.id) {
      allGames.push(createGame(afcTeam, nfcTeam));
    } else {
      allGames.push(createGame(nfcTeam, afcTeam));
    }

    teamGameCounts.set(afcTeam.id, (teamGameCounts.get(afcTeam.id) || 0) + 1);
    teamGameCounts.set(nfcTeam.id, (teamGameCounts.get(nfcTeam.id) || 0) + 1);
    extraGames++;
  }

  // If there are remaining teams (shouldn't happen with even conferences), pair them within conference
  const remainingAFC = afcNeedingGames.slice(minLength);
  const remainingNFC = nfcNeedingGames.slice(minLength);
  const remaining = [...remainingAFC, ...remainingNFC];

  for (let i = 0; i < remaining.length; i += 2) {
    if (i + 1 < remaining.length) {
      const team1 = remaining[i];
      const team2 = remaining[i + 1];

      allGames.push(createGame(team1, team2));
      teamGameCounts.set(team1.id, (teamGameCounts.get(team1.id) || 0) + 1);
      teamGameCounts.set(team2.id, (teamGameCounts.get(team2.id) || 0) + 1);
      extraGames++;
    }
  }

  console.log(`Generated ${allGames.length} regular season games`);
  console.log(`  - Divisional: ${divisionalGames}`);
  console.log(`  - Intra-conference: ${intraConferenceGames}`);
  console.log(`  - Inter-conference: ${interConferenceGames}`);
  console.log(`  - Same-place finisher: ${samePlaceGames}`);
  console.log(`  - Extra 17th game: ${extraGames}`);

  // Validate that each team has exactly 17 games
  const finalGameCounts = new Map<string, number>();
  teams.forEach((team) => {
    finalGameCounts.set(team.id, 0);
  });

  allGames.forEach((game) => {
    finalGameCounts.set(
      game.home_team_id,
      (finalGameCounts.get(game.home_team_id) || 0) + 1,
    );
    finalGameCounts.set(
      game.away_team_id,
      (finalGameCounts.get(game.away_team_id) || 0) + 1,
    );
  });

  // Check for teams with incorrect game counts
  const incorrectTeams = teams.filter(
    (team) => finalGameCounts.get(team.id) !== 17
  );

  if (incorrectTeams.length > 0) {
    console.warn(`⚠️  WARNING: ${incorrectTeams.length} teams don't have 17 games:`);
    incorrectTeams.forEach((team) => {
      console.warn(`   ${team.city} ${team.name}: ${finalGameCounts.get(team.id)} games`);
    });
  } else {
    console.log(`✓ All teams have exactly 17 games`);
  }

  // Generate bye weeks
  const byeWeeks = generateByeWeeks(teams, seasonId, year);

  // Assign games to weeks (1-18), avoiding bye weeks
  const gamesWithWeeks = assignWeeks(allGames, byeWeeks, 18);

  // Assign dates and time slots
  const scheduledGames = assignDatesAndTimeSlots(gamesWithWeeks, year, "regular");

  return { games: scheduledGames, byeWeeks };
}

/**
 * Generate complete season schedule: preseason + regular season
 * Returns all games with dates/time slots and bye week assignments
 */
export function generateFullSeasonSchedule(
  teams: Team[],
  seasonId: string,
  year: number = 2024,
): {
  games: GameInsert[];
  byeWeeks: ByeWeekInsert[];
} {
  // Generate preseason games (3 per team = 48 total)
  const preseasonGamesBase = generatePreseasonGames(teams, seasonId);

  // Assign preseason games to weeks 1-3, ensuring each team gets 1 game per week
  const preseasonWithWeeks: GameInsert[] = [];
  const teamWeekCount = new Map<string, Map<number, number>>();

  // Initialize tracking
  teams.forEach((team) => {
    teamWeekCount.set(team.id, new Map([[1, 0], [2, 0], [3, 0]]));
  });

  // Assign each game to the earliest available week for both teams
  preseasonGamesBase.forEach((game) => {
    const homeWeeks = teamWeekCount.get(game.home_team_id)!;
    const awayWeeks = teamWeekCount.get(game.away_team_id)!;

    // Find first week where both teams have 0 games
    let assignedWeek = 1;
    for (let week = 1; week <= 3; week++) {
      if (homeWeeks.get(week) === 0 && awayWeeks.get(week) === 0) {
        assignedWeek = week;
        break;
      }
    }

    // If no perfect match, find first week where at least one team has 0 games
    if (homeWeeks.get(assignedWeek)! > 0 || awayWeeks.get(assignedWeek)! > 0) {
      for (let week = 1; week <= 3; week++) {
        if (homeWeeks.get(week) === 0 || awayWeeks.get(week) === 0) {
          assignedWeek = week;
          break;
        }
      }
    }

    // Mark teams as having a game this week
    homeWeeks.set(assignedWeek, (homeWeeks.get(assignedWeek) || 0) + 1);
    awayWeeks.set(assignedWeek, (awayWeeks.get(assignedWeek) || 0) + 1);

    preseasonWithWeeks.push({
      ...game,
      week: assignedWeek,
    });
  });

  // Assign dates/times to preseason games
  const preseasonGames = assignDatesAndTimeSlots(
    preseasonWithWeeks,
    year,
    "preseason",
  );

  // Generate regular season schedule
  const { games: regularSeasonGames, byeWeeks } = generateRegularSeasonSchedule(
    teams,
    seasonId,
    year,
  );

  // Combine all games
  const allGames = [...preseasonGames, ...regularSeasonGames];

  console.log(
    `Generated full season: ${preseasonGames.length} preseason + ${regularSeasonGames.length} regular season = ${allGames.length} total games`,
  );

  return { games: allGames, byeWeeks };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateFullSeasonSchedule instead
 */
export function generateSchedule(
  teams: Team[],
  seasonId: string,
  year: number = 2024,
): GameInsert[] {
  const { games } = generateFullSeasonSchedule(teams, seasonId, year);
  return games;
}

/**
 * Get weather type based on week and random chance
 * Later games in season have higher chance of bad weather
 */
export function getWeatherForGame(
  week: number,
  homeTeamCity: string,
): "clear" | "rain" | "snow" | "wind" | "dome" {
  // Dome teams (simplified list)
  const domeTeams = [
    "Atlanta",
    "New Orleans",
    "Las Vegas",
    "Los Angeles", // Rams, but also Chargers play in dome now
    "Detroit",
    "Minneapolis",
    "Phoenix",
  ];

  if (domeTeams.some((city) => homeTeamCity.includes(city))) {
    return "dome";
  }

  // Weather probability increases in late season (weeks 13-18)
  const rand = Math.random();

  if (week >= 13) {
    if (rand < 0.15) return "snow";
    if (rand < 0.35) return "rain";
    if (rand < 0.5) return "wind";
  } else if (week >= 8) {
    if (rand < 0.05) return "snow";
    if (rand < 0.2) return "rain";
    if (rand < 0.3) return "wind";
  } else {
    if (rand < 0.1) return "rain";
    if (rand < 0.15) return "wind";
  }

  return "clear";
}
