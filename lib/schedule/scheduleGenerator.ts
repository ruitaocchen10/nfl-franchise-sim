/**
 * NFL Schedule Generator
 * Generates a 17-game regular season schedule for all 32 teams
 * Based on NFL scheduling formula
 */

import type { Database } from "@/lib/types/database.types";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type GameInsert = Database["public"]["Tables"]["games"]["Insert"];

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
 * Assigns games to weeks while avoiding same-team matchups in same week
 */
function assignWeeks(
  games: Omit<GameInsert, "week">[],
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
 * Generates all regular season games (256 total)
 * Based on NFL scheduling formula:
 * - 6 games vs division opponents (home and away)
 * - 4 games vs one division in same conference (rotating)
 * - 4 games vs one division in opposite conference (rotating)
 * - 2 games vs same-place finishers in other divisions
 * - 1 extra game
 */
export function generateSchedule(
  teams: Team[],
  seasonId: string,
  year: number = 2024,
): GameInsert[] {
  const { AFC, NFC } = organizeTeams(teams);
  const allGames: Omit<GameInsert, "week">[] = [];

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

  // For each conference
  [AFC, NFC].forEach((conference) => {
    const divisionNames: Array<keyof Conference["divisions"]> = [
      "East",
      "West",
      "North",
      "South",
    ];

    divisionNames.forEach((divisionName, divIndex) => {
      const division = conference.divisions[divisionName];

      // 1. Divisional games (6 games per team: home and away vs each division rival)
      for (let i = 0; i < division.length; i++) {
        for (let j = i + 1; j < division.length; j++) {
          allGames.push(createGame(division[i], division[j]));
          allGames.push(createGame(division[j], division[i]));
        }
      }

      // 2. Rotating intra-conference games (4 games per team)
      // Each division plays one other division in same conference each year
      const otherDivIndex = (divIndex + (year % 3) + 1) % 4;
      const otherDivision = conference.divisions[divisionNames[otherDivIndex]];

      division.forEach((team) => {
        otherDivision.forEach((opponent) => {
          // Alternate home/away based on team IDs for consistency
          if (team.id < opponent.id) {
            allGames.push(createGame(team, opponent));
          } else {
            allGames.push(createGame(opponent, team));
          }
        });
      });

      // 3. Inter-conference games (4 games per team)
      // Each division plays one division from opposite conference (rotating 4-year cycle)
      const oppositeConference = conference.name === "AFC" ? NFC : AFC;
      const interDivIndex = (divIndex + Math.floor(year / 4)) % 4;
      const interDivision =
        oppositeConference.divisions[divisionNames[interDivIndex]];

      division.forEach((team) => {
        interDivision.forEach((opponent) => {
          // Alternate home/away
          if (team.id < opponent.id) {
            allGames.push(createGame(team, opponent));
          } else {
            allGames.push(createGame(opponent, team));
          }
        });
      });
    });
  });

  // 4. Same-place finisher games (2 games per team)
  // Simplified: randomly assign same-conference matchups
  // In real NFL, this is based on previous season standings
  [AFC, NFC].forEach((conference) => {
    const divisionNames: Array<keyof Conference["divisions"]> = [
      "East",
      "West",
      "North",
      "South",
    ];

    divisionNames.forEach((divisionName, divIndex) => {
      const division = conference.divisions[divisionName];

      division.forEach((team, teamIndex) => {
        // Play teams with same division rank from other 2 divisions
        const otherDivIndices = divisionNames
          .map((_, idx) => idx)
          .filter(
            (idx) =>
              idx !== divIndex &&
              idx !== (divIndex + ((year % 3) + 1)) % 4,
          );

        otherDivIndices.forEach((otherIdx) => {
          const otherDivision = conference.divisions[divisionNames[otherIdx]];
          if (otherDivision[teamIndex]) {
            const opponent = otherDivision[teamIndex];
            // Alternate home/away
            if (team.id < opponent.id) {
              allGames.push(createGame(team, opponent));
            } else {
              allGames.push(createGame(opponent, team));
            }
          }
        });
      });
    });
  });

  // 5. Extra 17th game (inter-conference based on standings)
  // Simplified: randomly assign remaining games
  // Note: In actual implementation, we have 17 games per team = 272 total / 2 = 136 games
  // We've created: 6 division + 4 intra-conf + 4 inter-conf + 2 same-place = 16 games per team
  // Need 1 more game per team

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

  for (let i = 0; i < teamsNeedingGames.length; i += 2) {
    if (i + 1 < teamsNeedingGames.length) {
      const team1 = teamsNeedingGames[i];
      const team2 = teamsNeedingGames[i + 1];

      // Prefer inter-conference matchups for 17th game
      if (team1.conference !== team2.conference) {
        allGames.push(createGame(team1, team2));
        teamGameCounts.set(team1.id, (teamGameCounts.get(team1.id) || 0) + 1);
        teamGameCounts.set(team2.id, (teamGameCounts.get(team2.id) || 0) + 1);
      }
    }
  }

  console.log(`Generated ${allGames.length} games`);

  // Assign games to weeks (1-18, with week 18 being final week)
  const scheduledGames = assignWeeks(allGames, 18);

  return scheduledGames;
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
