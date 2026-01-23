/**
 * Game Simulation Server Actions
 * Handles simulating games, updating scores, stats, and standings
 * Now includes calendar-based date progression
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { simulateGame } from "@/lib/simulation/gameEngine";
import {
  getWeekFromDate,
  getPhaseFromDate,
  hasTradeDeadlinePassed,
  addDays,
} from "@/lib/season/calendarUtils";
import type { Database } from "@/lib/types/database.types";

type Game = Database["public"]["Tables"]["games"]["Row"];
type PlayerAttributes =
  Database["public"]["Tables"]["player_attributes"]["Row"];
type RosterSpot = Database["public"]["Tables"]["roster_spots"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface SimulationResult {
  success: boolean;
  error?: string;
  game?: Game;
}

/**
 * Simulate a single game
 */
export async function simulateSingleGame(
  franchiseId: string,
  gameId: string,
): Promise<SimulationResult> {
  const supabase = await createClient();

  // Verify user owns this franchise
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select("id, current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Get game details
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select(
      `
      *,
      home_team:teams!games_home_team_id_fkey(*),
      away_team:teams!games_away_team_id_fkey(*)
    `,
    )
    .eq("id", gameId)
    .single();

  if (gameError || !game) {
    return { success: false, error: "Game not found" };
  }

  if (game.simulated) {
    return { success: false, error: "Game already simulated" };
  }

  const homeTeamData = game.home_team as any;
  const awayTeamData = game.away_team as any;

  // Get rosters with player attributes for both teams
  const { data: homeRoster, error: homeRosterError } = await supabase
    .from("roster_spots")
    .select(
      `
      *,
      players!roster_spots_player_id_fkey(id, position),
      player_attributes!inner(*)
    `,
    )
    .eq("season_id", franchise.current_season_id!)
    .eq("team_id", homeTeamData.id)
    .eq("status", "active");

  const { data: awayRoster, error: awayRosterError } = await supabase
    .from("roster_spots")
    .select(
      `
      *,
      players!roster_spots_player_id_fkey(id, position),
      player_attributes!inner(*)
    `,
    )
    .eq("season_id", franchise.current_season_id!)
    .eq("team_id", awayTeamData.id)
    .eq("status", "active");

  if (homeRosterError || awayRosterError || !homeRoster || !awayRoster) {
    return { success: false, error: "Failed to load rosters" };
  }

  // Transform roster data for simulation
  const homeTeam = {
    id: homeTeamData.id,
    name: homeTeamData.name,
    abbreviation: homeTeamData.abbreviation,
    roster: homeRoster.map((spot: any) => ({
      id: spot.player_id,
      position: spot.players.position,
      attributes: Array.isArray(spot.player_attributes)
        ? spot.player_attributes[0]
        : spot.player_attributes,
      depth_position: spot.depth_position,
    })),
  };

  const awayTeam = {
    id: awayTeamData.id,
    name: awayTeamData.name,
    abbreviation: awayTeamData.abbreviation,
    roster: awayRoster.map((spot: any) => ({
      id: spot.player_id,
      position: spot.players.position,
      attributes: Array.isArray(spot.player_attributes)
        ? spot.player_attributes[0]
        : spot.player_attributes,
      depth_position: spot.depth_position,
    })),
  };

  // Run simulation
  const result = simulateGame(homeTeam, awayTeam, game.weather);

  // Update game with results
  const { error: updateGameError } = await supabase
    .from("games")
    .update({
      home_score: result.homeScore,
      away_score: result.awayScore,
      overtime: result.overtime,
      simulated: true,
      simulated_at: new Date().toISOString(),
    })
    .eq("id", gameId);

  if (updateGameError) {
    return { success: false, error: "Failed to update game" };
  }

  // Insert player stats
  const gameStatsToInsert = result.playerStats.map((stats) => ({
    game_id: gameId,
    ...stats,
  }));

  const { error: statsError } = await supabase
    .from("game_stats")
    .insert(gameStatsToInsert);

  if (statsError) {
    console.error("Error inserting game stats:", statsError);
  }

  // Insert game events
  const eventsToInsert = result.events.map((event) => ({
    game_id: gameId,
    ...event,
  }));

  const { error: eventsError } = await supabase
    .from("game_events")
    .insert(eventsToInsert);

  if (eventsError) {
    console.error("Error inserting game events:", eventsError);
  }

  // Update team standings
  await updateStandings(
    supabase,
    franchise.current_season_id!,
    homeTeamData.id,
    awayTeamData.id,
    result.homeScore,
    result.awayScore,
  );

  // Update season stats for all players who played
  await updateSeasonStats(supabase, gameId, gameStatsToInsert);

  // Revalidate relevant pages
  revalidatePath(`/franchise/${franchiseId}`);
  revalidatePath(`/franchise/${franchiseId}/schedule`);

  return {
    success: true,
    game: {
      ...game,
      home_score: result.homeScore,
      away_score: result.awayScore,
      overtime: result.overtime,
      simulated: true,
    },
  };
}

/**
 * Simulate all games in a week
 */
export async function simulateWeek(
  franchiseId: string,
  week: number,
): Promise<{ success: boolean; error?: string; gamesSimulated?: number }> {
  const supabase = await createClient();

  // Verify user owns this franchise
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select("id, current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Get all unsimulated games for this week
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("id")
    .eq("season_id", franchise.current_season_id!)
    .eq("week", week)
    .eq("simulated", false);

  if (gamesError) {
    return { success: false, error: "Failed to load games" };
  }

  if (!games || games.length === 0) {
    return { success: false, error: "No games to simulate this week" };
  }

  // Simulate each game
  let successCount = 0;
  for (const game of games) {
    const result = await simulateSingleGame(franchiseId, game.id);
    if (result.success) {
      successCount++;
    }
  }

  // Get season info to update dates
  const { data: season } = await supabase
    .from("seasons")
    .select("year, simulation_date, season_start_date, trade_deadline_passed")
    .eq("id", franchise.current_season_id!)
    .single();

  if (season) {
    // Calculate new simulation_date (advance by 7 days after simulating the week)
    const currentDate = season.simulation_date
      ? new Date(season.simulation_date)
      : new Date(season.season_start_date || new Date());
    const newDate = addDays(currentDate, 7);

    // Check if trade deadline passed during this week
    const tradeDeadlinePassed =
      season.trade_deadline_passed || hasTradeDeadlinePassed(newDate, season.year);

    // Get new phase based on date
    const newPhase = getPhaseFromDate(newDate, season.year);

    // Update season with new date, week, phase, and trade deadline status
    await supabase
      .from("seasons")
      .update({
        current_week: week,
        simulation_date: newDate.toISOString(),
        phase: newPhase,
        trade_deadline_passed: tradeDeadlinePassed,
      })
      .eq("id", franchise.current_season_id!);
  }

  return { success: true, gamesSimulated: successCount };
}

/**
 * Update team standings after a game
 */
async function updateStandings(
  supabase: any,
  seasonId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number,
) {
  // Determine winner
  const homeWin = homeScore > awayScore;
  const awayWin = awayScore > homeScore;
  const tie = homeScore === awayScore;

  // Update home team
  const { data: homeStanding } = await supabase
    .from("team_standings")
    .select("*")
    .eq("season_id", seasonId)
    .eq("team_id", homeTeamId)
    .single();

  if (homeStanding) {
    await supabase
      .from("team_standings")
      .update({
        wins: homeStanding.wins + (homeWin ? 1 : 0),
        losses: homeStanding.losses + (awayWin ? 1 : 0),
        ties: homeStanding.ties + (tie ? 1 : 0),
        points_for: homeStanding.points_for + homeScore,
        points_against: homeStanding.points_against + awayScore,
      })
      .eq("id", homeStanding.id);
  }

  // Update away team
  const { data: awayStanding } = await supabase
    .from("team_standings")
    .select("*")
    .eq("season_id", seasonId)
    .eq("team_id", awayTeamId)
    .single();

  if (awayStanding) {
    await supabase
      .from("team_standings")
      .update({
        wins: awayStanding.wins + (awayWin ? 1 : 0),
        losses: awayStanding.losses + (homeWin ? 1 : 0),
        ties: awayStanding.ties + (tie ? 1 : 0),
        points_for: awayStanding.points_for + awayScore,
        points_against: awayStanding.points_against + homeScore,
      })
      .eq("id", awayStanding.id);
  }
}

/**
 * Update season stats for players after a game
 */
async function updateSeasonStats(
  supabase: any,
  gameId: string,
  gameStats: any[],
) {
  for (const stat of gameStats) {
    // Check if player has season stats record
    const { data: existing } = await supabase
      .from("season_stats")
      .select("*")
      .eq("player_id", stat.player_id)
      .eq("team_id", stat.team_id)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from("season_stats")
        .update({
          games_played: existing.games_played + 1,
          pass_attempts: existing.pass_attempts + stat.pass_attempts,
          pass_completions: existing.pass_completions + stat.pass_completions,
          pass_yards: existing.pass_yards + stat.pass_yards,
          pass_tds: existing.pass_tds + stat.pass_tds,
          interceptions: existing.interceptions + stat.interceptions,
          sacks_taken: existing.sacks_taken + stat.sacks_taken,
          rush_attempts: existing.rush_attempts + stat.rush_attempts,
          rush_yards: existing.rush_yards + stat.rush_yards,
          rush_tds: existing.rush_tds + stat.rush_tds,
          fumbles: existing.fumbles + stat.fumbles,
          fumbles_lost: existing.fumbles_lost + stat.fumbles_lost,
          targets: existing.targets + stat.targets,
          receptions: existing.receptions + stat.receptions,
          receiving_yards: existing.receiving_yards + stat.receiving_yards,
          receiving_tds: existing.receiving_tds + stat.receiving_tds,
          drops: existing.drops + stat.drops,
          tackles: existing.tackles + stat.tackles,
          assists: existing.assists + stat.assists,
          sacks: existing.sacks + stat.sacks,
          tackles_for_loss: existing.tackles_for_loss + stat.tackles_for_loss,
          forced_fumbles: existing.forced_fumbles + stat.forced_fumbles,
          fumble_recoveries:
            existing.fumble_recoveries + stat.fumble_recoveries,
          interceptions_defense:
            existing.interceptions_defense + stat.interceptions_defense,
          pass_deflections: existing.pass_deflections + stat.pass_deflections,
          defensive_tds: existing.defensive_tds + stat.defensive_tds,
          field_goals_made: existing.field_goals_made + stat.field_goals_made,
          field_goals_attempted:
            existing.field_goals_attempted + stat.field_goals_attempted,
          longest_field_goal: Math.max(
            existing.longest_field_goal,
            stat.longest_field_goal,
          ),
          extra_points_made: existing.extra_points_made + stat.extra_points_made,
          extra_points_attempted:
            existing.extra_points_attempted + stat.extra_points_attempted,
        })
        .eq("id", existing.id);
    } else {
      // Create new season stats record
      // First get the season_id from game_stats through the game
      const { data: game } = await supabase
        .from("games")
        .select("season_id")
        .eq("id", gameId)
        .single();

      if (game) {
        await supabase.from("season_stats").insert({
          player_id: stat.player_id,
          team_id: stat.team_id,
          season_id: game.season_id,
          games_played: 1,
          games_started: 0,
          ...stat,
        });
      }
    }
  }
}

/**
 * Get schedule for a franchise's current season
 */
export async function getSchedule(franchiseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: franchise } = await supabase
    .from("franchises")
    .select("current_season_id, team_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (!franchise || !franchise.current_season_id) {
    return [];
  }

  const { data: games } = await supabase
    .from("games")
    .select(
      `
      *,
      home_team:teams!games_home_team_id_fkey(id, abbreviation, city, name),
      away_team:teams!games_away_team_id_fkey(id, abbreviation, city, name)
    `,
    )
    .eq("season_id", franchise.current_season_id)
    .order("week", { ascending: true });

  return games || [];
}

/**
 * Advance simulation to next week (7 days forward)
 */
export async function advanceToNextWeek(
  franchiseId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user owns this franchise
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select("id, current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Get current season data
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("year, simulation_date, season_start_date, trade_deadline_passed")
    .eq("id", franchise.current_season_id!)
    .single();

  if (seasonError || !season) {
    return { success: false, error: "Season not found" };
  }

  // Calculate new date (advance by 7 days)
  const currentDate = season.simulation_date
    ? new Date(season.simulation_date)
    : new Date(season.season_start_date || new Date());
  const newDate = addDays(currentDate, 7);

  // Check if trade deadline passed
  const tradeDeadlinePassed =
    season.trade_deadline_passed || hasTradeDeadlinePassed(newDate, season.year);

  // Get new phase based on date
  const newPhase = getPhaseFromDate(newDate, season.year);
  const newWeek = getWeekFromDate(newDate, season.year);

  // Update season
  const { error: updateError } = await supabase
    .from("seasons")
    .update({
      simulation_date: newDate.toISOString(),
      phase: newPhase,
      current_week: newWeek,
      trade_deadline_passed: tradeDeadlinePassed,
    })
    .eq("id", franchise.current_season_id!);

  if (updateError) {
    return { success: false, error: "Failed to update season" };
  }

  // Revalidate relevant pages
  revalidatePath(`/franchise/${franchiseId}`);
  revalidatePath(`/franchise/${franchiseId}/schedule`);

  return { success: true };
}

/**
 * Advance simulation to a specific phase
 */
export async function advanceToPhase(
  franchiseId: string,
  targetPhase: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Verify user owns this franchise
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select("id, current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Get current season data
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("year, simulation_date, season_start_date")
    .eq("id", franchise.current_season_id!)
    .single();

  if (seasonError || !season) {
    return { success: false, error: "Season not found" };
  }

  // Get season dates
  const dates = require("@/lib/season/calendarUtils").getSeasonDates(season.year);

  // Determine target date based on phase
  let targetDate: Date;
  switch (targetPhase) {
    case "free_agency":
      targetDate = dates.freeAgencyStart;
      break;
    case "draft":
      targetDate = dates.draftStart;
      break;
    case "training_camp":
      targetDate = dates.trainingCampStart;
      break;
    case "preseason":
      targetDate = dates.preseasonWeek1;
      break;
    case "regular_season":
      targetDate = dates.regularSeasonStart;
      break;
    case "trade_deadline":
      targetDate = dates.tradeDeadline;
      break;
    case "postseason":
      targetDate = dates.wildCardStart;
      break;
    case "offseason":
      targetDate = dates.superBowl;
      targetDate = addDays(targetDate, 3); // Few days after Super Bowl
      break;
    default:
      return { success: false, error: "Invalid target phase" };
  }

  // Get new phase and week
  const newPhase = getPhaseFromDate(targetDate, season.year);
  const newWeek = getWeekFromDate(targetDate, season.year);
  const tradeDeadlinePassed = hasTradeDeadlinePassed(targetDate, season.year);

  // Update season
  const { error: updateError } = await supabase
    .from("seasons")
    .update({
      simulation_date: targetDate.toISOString(),
      phase: newPhase,
      current_week: newWeek,
      trade_deadline_passed: tradeDeadlinePassed,
    })
    .eq("id", franchise.current_season_id!);

  if (updateError) {
    return { success: false, error: "Failed to update season" };
  }

  // Revalidate relevant pages
  revalidatePath(`/franchise/${franchiseId}`);
  revalidatePath(`/franchise/${franchiseId}/schedule`);

  return { success: true };
}
