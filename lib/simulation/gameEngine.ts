/**
 * Game Simulation Engine
 * Simulates NFL games based on team rosters, player ratings, and depth charts
 */

import type { Database } from "@/lib/types/database.types";

type PlayerAttributes =
  Database["public"]["Tables"]["player_attributes"]["Row"];
type RosterPlayer = {
  id: string;
  position: string;
  attributes: PlayerAttributes;
  depth_position: number;
};

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  roster: RosterPlayer[];
}

interface GameSimulationResult {
  homeScore: number;
  awayScore: number;
  overtime: boolean;
  playerStats: PlayerGameStats[];
  events: GameEvent[];
}

interface PlayerGameStats {
  player_id: string;
  team_id: string;
  // Passing
  pass_attempts: number;
  pass_completions: number;
  pass_yards: number;
  pass_tds: number;
  interceptions: number;
  sacks_taken: number;
  // Rushing
  rush_attempts: number;
  rush_yards: number;
  rush_tds: number;
  fumbles: number;
  fumbles_lost: number;
  // Receiving
  targets: number;
  receptions: number;
  receiving_yards: number;
  receiving_tds: number;
  drops: number;
  // Defense
  tackles: number;
  assists: number;
  sacks: number;
  tackles_for_loss: number;
  forced_fumbles: number;
  fumble_recoveries: number;
  interceptions_defense: number;
  pass_deflections: number;
  defensive_tds: number;
  // Kicking
  field_goals_made: number;
  field_goals_attempted: number;
  longest_field_goal: number;
  extra_points_made: number;
  extra_points_attempted: number;
}

interface GameEvent {
  quarter: number;
  time_remaining: string;
  event_type:
    | "touchdown"
    | "field_goal"
    | "turnover"
    | "injury"
    | "big_play"
    | "safety"
    | "two_point"
    | "game_winning";
  description: string;
  player_id?: string;
  player2_id?: string;
  yards: number;
  scoring_play: boolean;
  points_scored: number;
}

/**
 * Calculate team overall rating based on roster
 */
function calculateTeamRating(
  roster: RosterPlayer[],
  side: "offense" | "defense",
): number {
  const starters = roster.filter((p) => p.depth_position === 1);

  if (side === "offense") {
    const offensivePlayers = starters.filter((p) =>
      ["QB", "RB", "WR", "TE", "T", "G", "C", "OL"].includes(p.position),
    );
    if (offensivePlayers.length === 0) return 70;

    const avgRating =
      offensivePlayers.reduce(
        (sum, p) => sum + p.attributes.overall_rating,
        0,
      ) / offensivePlayers.length;
    return avgRating;
  } else {
    const defensivePlayers = starters.filter((p) =>
      ["DE", "DT", "DL", "LB", "CB", "S", "DB"].includes(p.position),
    );
    if (defensivePlayers.length === 0) return 70;

    const avgRating =
      defensivePlayers.reduce(
        (sum, p) => sum + p.attributes.overall_rating,
        0,
      ) / defensivePlayers.length;
    return avgRating;
  }
}

/**
 * Simulate a single drive
 * Returns points scored and whether it resulted in a turnover
 */
function simulateDrive(
  offense: Team,
  defense: Team,
  fieldPosition: number,
): { points: number; turnover: boolean; yards: number } {
  const offenseRating = calculateTeamRating(offense.roster, "offense");
  const defenseRating = calculateTeamRating(defense.roster, "defense");

  // Rating advantage (higher is better for offense)
  const advantage = offenseRating - defenseRating;

  // Base probabilities
  let tdProbability = 0.25 + advantage * 0.01; // ~25-35% for TD
  let fgProbability = 0.3 + advantage * 0.005; // ~30-35% for FG
  let turnoverProbability = 0.15 - advantage * 0.01; // ~10-20% for turnover

  // Adjust based on field position (closer = higher scoring chance)
  const fieldPositionFactor = fieldPosition / 100;
  tdProbability += fieldPositionFactor * 0.1;
  fgProbability += fieldPositionFactor * 0.05;

  // Clamp probabilities
  tdProbability = Math.max(0.1, Math.min(0.5, tdProbability));
  fgProbability = Math.max(0.2, Math.min(0.5, fgProbability));
  turnoverProbability = Math.max(0.05, Math.min(0.25, turnoverProbability));

  const rand = Math.random();

  // Determine outcome
  if (rand < turnoverProbability) {
    // Turnover (INT or fumble)
    return { points: 0, turnover: true, yards: Math.floor(Math.random() * 30) };
  } else if (rand < turnoverProbability + tdProbability) {
    // Touchdown
    const yards = Math.floor(Math.random() * 60) + 20;
    return { points: 7, turnover: false, yards };
  } else if (rand < turnoverProbability + tdProbability + fgProbability) {
    // Field Goal
    const yards = Math.floor(Math.random() * 40) + 20;
    return { points: 3, turnover: false, yards };
  } else {
    // Punt/no score
    const yards = Math.floor(Math.random() * 40) + 10;
    return { points: 0, turnover: false, yards };
  }
}

/**
 * Generate player stats based on team performance
 */
function generatePlayerStats(
  team: Team,
  totalPoints: number,
  isWinner: boolean,
): PlayerGameStats[] {
  const stats: PlayerGameStats[] = [];

  // Find starters
  const qb = team.roster.find(
    (p) => p.position === "QB" && p.depth_position === 1,
  );
  const rbs = team.roster
    .filter((p) => p.position === "RB" && p.depth_position <= 2)
    .sort((a, b) => a.depth_position - b.depth_position);
  const wrs = team.roster
    .filter((p) => p.position === "WR" && p.depth_position <= 3)
    .sort((a, b) => a.depth_position - b.depth_position);
  const tes = team.roster
    .filter((p) => p.position === "TE" && p.depth_position <= 1)
    .sort((a, b) => a.depth_position - b.depth_position);
  const defensivePlayers = team.roster
    .filter(
      (p) =>
        ["DE", "DT", "DL", "LB", "CB", "S", "DB"].includes(p.position) &&
        p.depth_position === 1,
    )
    .slice(0, 11);
  const kicker = team.roster.find((p) => p.position === "K");

  // QB stats
  if (qb) {
    const qbRating = qb.attributes.overall_rating;
    const basePasses = 30 + Math.floor(Math.random() * 15);
    const completionPct = 0.55 + (qbRating - 75) / 100;
    const completions = Math.floor(basePasses * completionPct);
    const yardsPerComp = 10 + Math.floor(Math.random() * 5);

    stats.push({
      player_id: qb.id,
      team_id: team.id,
      pass_attempts: basePasses,
      pass_completions: completions,
      pass_yards: completions * yardsPerComp,
      pass_tds: Math.floor(totalPoints / 7) + (Math.random() > 0.7 ? 1 : 0),
      interceptions: Math.random() > 0.7 ? 1 : Math.random() > 0.9 ? 2 : 0,
      sacks_taken: Math.floor(Math.random() * 3),
      rush_attempts: 0,
      rush_yards: 0,
      rush_tds: 0,
      fumbles: 0,
      fumbles_lost: 0,
      targets: 0,
      receptions: 0,
      receiving_yards: 0,
      receiving_tds: 0,
      drops: 0,
      tackles: 0,
      assists: 0,
      sacks: 0,
      tackles_for_loss: 0,
      forced_fumbles: 0,
      fumble_recoveries: 0,
      interceptions_defense: 0,
      pass_deflections: 0,
      defensive_tds: 0,
      field_goals_made: 0,
      field_goals_attempted: 0,
      longest_field_goal: 0,
      extra_points_made: 0,
      extra_points_attempted: 0,
    });
  }

  // RB stats
  rbs.forEach((rb, index) => {
    const carries = index === 0 ? 15 + Math.floor(Math.random() * 10) : 5 + Math.floor(Math.random() * 5);
    const yardsPerCarry = 4 + Math.floor(Math.random() * 2);

    stats.push({
      player_id: rb.id,
      team_id: team.id,
      pass_attempts: 0,
      pass_completions: 0,
      pass_yards: 0,
      pass_tds: 0,
      interceptions: 0,
      sacks_taken: 0,
      rush_attempts: carries,
      rush_yards: carries * yardsPerCarry,
      rush_tds: index === 0 && Math.random() > 0.6 ? 1 : 0,
      fumbles: 0,
      fumbles_lost: 0,
      targets: 3 + Math.floor(Math.random() * 3),
      receptions: 2 + Math.floor(Math.random() * 2),
      receiving_yards: (2 + Math.floor(Math.random() * 2)) * 8,
      receiving_tds: 0,
      drops: 0,
      tackles: 0,
      assists: 0,
      sacks: 0,
      tackles_for_loss: 0,
      forced_fumbles: 0,
      fumble_recoveries: 0,
      interceptions_defense: 0,
      pass_deflections: 0,
      defensive_tds: 0,
      field_goals_made: 0,
      field_goals_attempted: 0,
      longest_field_goal: 0,
      extra_points_made: 0,
      extra_points_attempted: 0,
    });
  });

  // WR stats
  wrs.forEach((wr, index) => {
    const targets = index === 0 ? 8 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 3);
    const receptions = Math.floor(targets * 0.6);

    stats.push({
      player_id: wr.id,
      team_id: team.id,
      pass_attempts: 0,
      pass_completions: 0,
      pass_yards: 0,
      pass_tds: 0,
      interceptions: 0,
      sacks_taken: 0,
      rush_attempts: 0,
      rush_yards: 0,
      rush_tds: 0,
      fumbles: 0,
      fumbles_lost: 0,
      targets,
      receptions,
      receiving_yards: receptions * (12 + Math.floor(Math.random() * 6)),
      receiving_tds: index === 0 && Math.random() > 0.7 ? 1 : 0,
      drops: Math.random() > 0.8 ? 1 : 0,
      tackles: 0,
      assists: 0,
      sacks: 0,
      tackles_for_loss: 0,
      forced_fumbles: 0,
      fumble_recoveries: 0,
      interceptions_defense: 0,
      pass_deflections: 0,
      defensive_tds: 0,
      field_goals_made: 0,
      field_goals_attempted: 0,
      longest_field_goal: 0,
      extra_points_made: 0,
      extra_points_attempted: 0,
    });
  });

  // TE stats
  tes.forEach((te) => {
    const targets = 4 + Math.floor(Math.random() * 3);
    const receptions = Math.floor(targets * 0.65);

    stats.push({
      player_id: te.id,
      team_id: team.id,
      pass_attempts: 0,
      pass_completions: 0,
      pass_yards: 0,
      pass_tds: 0,
      interceptions: 0,
      sacks_taken: 0,
      rush_attempts: 0,
      rush_yards: 0,
      rush_tds: 0,
      fumbles: 0,
      fumbles_lost: 0,
      targets,
      receptions,
      receiving_yards: receptions * (10 + Math.floor(Math.random() * 5)),
      receiving_tds: Math.random() > 0.8 ? 1 : 0,
      drops: 0,
      tackles: 0,
      assists: 0,
      sacks: 0,
      tackles_for_loss: 0,
      forced_fumbles: 0,
      fumble_recoveries: 0,
      interceptions_defense: 0,
      pass_deflections: 0,
      defensive_tds: 0,
      field_goals_made: 0,
      field_goals_attempted: 0,
      longest_field_goal: 0,
      extra_points_made: 0,
      extra_points_attempted: 0,
    });
  });

  // Defensive player stats
  defensivePlayers.forEach((player) => {
    const baseTackles = 3 + Math.floor(Math.random() * 5);

    stats.push({
      player_id: player.id,
      team_id: team.id,
      pass_attempts: 0,
      pass_completions: 0,
      pass_yards: 0,
      pass_tds: 0,
      interceptions: 0,
      sacks_taken: 0,
      rush_attempts: 0,
      rush_yards: 0,
      rush_tds: 0,
      fumbles: 0,
      fumbles_lost: 0,
      targets: 0,
      receptions: 0,
      receiving_yards: 0,
      receiving_tds: 0,
      drops: 0,
      tackles: baseTackles,
      assists: Math.floor(Math.random() * 3),
      sacks: Math.random() > 0.85 ? 1 : 0,
      tackles_for_loss: Math.random() > 0.7 ? 1 : 0,
      forced_fumbles: 0,
      fumble_recoveries: 0,
      interceptions_defense: Math.random() > 0.95 ? 1 : 0,
      pass_deflections: Math.random() > 0.7 ? 1 : 0,
      defensive_tds: 0,
      field_goals_made: 0,
      field_goals_attempted: 0,
      longest_field_goal: 0,
      extra_points_made: 0,
      extra_points_attempted: 0,
    });
  });

  // Kicker stats
  if (kicker) {
    const fgAttempts = Math.floor(totalPoints / 3);
    const xpAttempts = Math.floor(totalPoints / 7);

    stats.push({
      player_id: kicker.id,
      team_id: team.id,
      pass_attempts: 0,
      pass_completions: 0,
      pass_yards: 0,
      pass_tds: 0,
      interceptions: 0,
      sacks_taken: 0,
      rush_attempts: 0,
      rush_yards: 0,
      rush_tds: 0,
      fumbles: 0,
      fumbles_lost: 0,
      targets: 0,
      receptions: 0,
      receiving_yards: 0,
      receiving_tds: 0,
      drops: 0,
      tackles: 0,
      assists: 0,
      sacks: 0,
      tackles_for_loss: 0,
      forced_fumbles: 0,
      fumble_recoveries: 0,
      interceptions_defense: 0,
      pass_deflections: 0,
      defensive_tds: 0,
      field_goals_made: fgAttempts,
      field_goals_attempted: fgAttempts,
      longest_field_goal: 35 + Math.floor(Math.random() * 25),
      extra_points_made: xpAttempts,
      extra_points_attempted: xpAttempts,
    });
  }

  return stats;
}

/**
 * Simulate a full game
 */
export function simulateGame(
  homeTeam: Team,
  awayTeam: Team,
  weather: "clear" | "rain" | "snow" | "wind" | "dome" = "clear",
): GameSimulationResult {
  let homeScore = 0;
  let awayScore = 0;
  const events: GameEvent[] = [];

  // Home field advantage (+2-3 points on average)
  const homeAdvantage = 2 + Math.random();

  // Weather effects (reduce scoring in bad weather)
  let weatherFactor = 1.0;
  if (weather === "rain") weatherFactor = 0.9;
  if (weather === "snow") weatherFactor = 0.8;
  if (weather === "wind") weatherFactor = 0.85;

  // Simulate ~12 drives per team (simplified)
  const totalDrives = 24;

  for (let drive = 0; drive < totalDrives; drive++) {
    const isHomePossession = drive % 2 === 0;
    const offense = isHomePossession ? homeTeam : awayTeam;
    const defense = isHomePossession ? awayTeam : homeTeam;

    const result = simulateDrive(offense, defense, 25 + Math.random() * 50);

    // Apply weather and home field factors
    let points = Math.floor(result.points * weatherFactor);
    if (isHomePossession) {
      points = Math.round(points + homeAdvantage / 12); // Distribute advantage across drives
    }

    if (isHomePossession) {
      homeScore += points;
    } else {
      awayScore += points;
    }

    // Generate events for scoring plays
    if (points > 0) {
      const quarter = Math.ceil((drive + 1) / 6);
      const timeRemaining = `${14 - (drive % 6) * 2}:${Math.floor(Math.random() * 60)}`;

      events.push({
        quarter,
        time_remaining: timeRemaining,
        event_type: points >= 6 ? "touchdown" : "field_goal",
        description:
          points >= 6
            ? `${offense.abbreviation} scores touchdown!`
            : `${offense.abbreviation} kicks field goal`,
        yards: result.yards,
        scoring_play: true,
        points_scored: points,
      });
    }
  }

  // Check for overtime
  let overtime = false;
  if (homeScore === awayScore) {
    overtime = true;
    // Simplified OT: 50/50 chance either team scores
    if (Math.random() > 0.5) {
      homeScore += 3;
      events.push({
        quarter: 5,
        time_remaining: "5:00",
        event_type: "field_goal",
        description: `${homeTeam.abbreviation} wins in OT!`,
        yards: 0,
        scoring_play: true,
        points_scored: 3,
      });
    } else {
      awayScore += 3;
      events.push({
        quarter: 5,
        time_remaining: "5:00",
        event_type: "field_goal",
        description: `${awayTeam.abbreviation} wins in OT!`,
        yards: 0,
        scoring_play: true,
        points_scored: 3,
      });
    }
  }

  // Generate player stats
  const homePlayerStats = generatePlayerStats(
    homeTeam,
    homeScore,
    homeScore > awayScore,
  );
  const awayPlayerStats = generatePlayerStats(
    awayTeam,
    awayScore,
    awayScore > homeScore,
  );

  return {
    homeScore,
    awayScore,
    overtime,
    playerStats: [...homePlayerStats, ...awayPlayerStats],
    events,
  };
}
