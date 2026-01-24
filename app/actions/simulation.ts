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
import { processSeasonEnd, shouldProcessSeasonEnd } from "@/lib/season/seasonTransition";
import { processPlayerDecisions, executeAISignings } from "@/lib/ai/freeAgencyAI";
import { AITeamAgent } from "@/lib/ai/teamAgent";
import type { Database } from "@/lib/types/database.types";

type Game = Database["public"]["Tables"]["games"]["Row"];
type PlayerAttributes =
  Database["public"]["Tables"]["player_attributes"]["Row"];
type RosterSpot = Database["public"]["Tables"]["roster_spots"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

/**
 * Event types that can occur during day-by-day simulation
 */
enum SimulationEventType {
  GAME = "GAME",
  AI_FREE_AGENCY = "AI_FREE_AGENCY",
  PHASE_TRANSITION = "PHASE_TRANSITION",
  SEASON_END = "SEASON_END",
}

interface SimulationEvent {
  type: SimulationEventType;
  date: Date;
  metadata?: any;
}

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
 * Now uses day-by-day simulation internally
 */
export async function simulateWeek(
  franchiseId: string,
  week: number,
): Promise<{ success: boolean; error?: string; gamesSimulated?: number; messages?: string[] }> {
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

  // Get season info
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .select("year, simulation_date, season_start_date, phase")
    .eq("id", franchise.current_season_id!)
    .single();

  if (seasonError || !season) {
    return { success: false, error: "Season not found" };
  }

  // Count unsimulated games in this week before simulation
  const { data: gamesBefore } = await supabase
    .from("games")
    .select("id")
    .eq("season_id", franchise.current_season_id!)
    .eq("week", week)
    .eq("simulated", false);

  if (!gamesBefore || gamesBefore.length === 0) {
    return { success: false, error: "No games to simulate this week" };
  }

  // Use day-by-day simulation for 7 days
  // This will automatically simulate games on their scheduled dates
  const result = await advanceByDays(franchiseId, 7);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Count how many games were actually simulated
  const { data: gamesAfter } = await supabase
    .from("games")
    .select("id")
    .eq("season_id", franchise.current_season_id!)
    .eq("week", week)
    .eq("simulated", false);

  const gamesSimulated = gamesBefore.length - (gamesAfter?.length || 0);

  return {
    success: true,
    gamesSimulated,
    messages: result.messages,
  };
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
 * Detect what events should occur on a specific date
 * Returns array of events to be processed for that day
 */
async function getEventsForDate(
  supabase: any,
  currentDate: Date,
  seasonId: string,
  currentPhase: string,
  year: number,
): Promise<SimulationEvent[]> {
  const events: SimulationEvent[] = [];

  // Normalize date to start of day for comparison
  const dateStr = currentDate.toISOString().split("T")[0];

  // 1. Check for games scheduled on this date
  const { data: gamesOnDate } = await supabase
    .from("games")
    .select("id, game_date")
    .eq("season_id", seasonId)
    .gte("game_date", dateStr)
    .lt("game_date", new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000).toISOString())
    .eq("simulated", false);

  if (gamesOnDate && gamesOnDate.length > 0) {
    events.push({
      type: SimulationEventType.GAME,
      date: currentDate,
      metadata: { gameIds: gamesOnDate.map((g: any) => g.id) },
    });
  }

  // 2. Check for phase transition
  const newPhase = getPhaseFromDate(currentDate, year);
  if (newPhase !== currentPhase) {
    // Check if transitioning to offseason (triggers season end)
    if (shouldProcessSeasonEnd(currentPhase, newPhase)) {
      events.push({
        type: SimulationEventType.SEASON_END,
        date: currentDate,
        metadata: { fromPhase: currentPhase, toPhase: newPhase },
      });
    } else {
      events.push({
        type: SimulationEventType.PHASE_TRANSITION,
        date: currentDate,
        metadata: { fromPhase: currentPhase, toPhase: newPhase },
      });
    }
  }

  // 3. Check for AI free agency activity
  // Active during free_agency, draft, and training_camp phases
  // Teams decide independently whether to be active each day
  const activeMarketPhases = ["free_agency", "draft", "training_camp"];
  if (activeMarketPhases.includes(newPhase)) {
    events.push({
      type: SimulationEventType.AI_FREE_AGENCY,
      date: currentDate,
      metadata: { phase: newPhase },
    });
  }

  return events;
}

/**
 * Process a single simulation event
 */
async function processEvent(
  supabase: any,
  event: SimulationEvent,
  franchiseId: string,
  seasonId: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    switch (event.type) {
      case SimulationEventType.GAME:
        // Simulate all games scheduled for this day
        const gameIds = event.metadata?.gameIds || [];
        let gamesSimulated = 0;

        for (const gameId of gameIds) {
          const result = await simulateSingleGame(franchiseId, gameId);
          if (result.success) {
            gamesSimulated++;
          }
        }

        return {
          success: true,
          message: gamesSimulated > 0 ? `Simulated ${gamesSimulated} game(s)` : undefined,
        };

      case SimulationEventType.AI_FREE_AGENCY:
        // Use team agents for autonomous decision-making
        const { data: teams } = await supabase.from("teams").select("id");

        if (!teams) {
          return { success: true };
        }

        const allOffers: any[] = [];

        // Each team makes independent decisions
        for (const team of teams) {
          const agent = await AITeamAgent.load(supabase, team.id, seasonId);

          if (!agent) {
            console.warn(`No AI personality found for team ${team.id}`);
            continue;
          }

          const result = await agent.processDay(event.date, event.metadata?.phase || "free_agency");

          if (result.success && result.offers.length > 0) {
            allOffers.push(...result.offers);
          }
        }

        // Process player decisions and execute signings (existing logic)
        if (allOffers.length > 0) {
          const decisions = await processPlayerDecisions(supabase, allOffers, seasonId);
          const signingResults = await executeAISignings(supabase, decisions, seasonId);

          return {
            success: true,
            message: signingResults.signed > 0
              ? `${signingResults.signed} player(s) signed`
              : undefined,
          };
        }

        return { success: true };

      case SimulationEventType.PHASE_TRANSITION:
        // Phase transition is handled in advanceByDays by updating the season record
        // No additional processing needed here
        return {
          success: true,
          message: `Entered ${event.metadata?.toPhase} phase`,
        };

      case SimulationEventType.SEASON_END:
        // Process season end transition
        const transitionResult = await processSeasonEnd(franchiseId, seasonId);

        if (!transitionResult.success) {
          return {
            success: false,
            error: transitionResult.error || "Failed to process season end",
          };
        }

        return {
          success: true,
          message: `Season ended! ${transitionResult.stats?.playersRetired || 0} players retired, ${transitionResult.stats?.freeAgentsCreated || 0} became free agents.`,
        };

      default:
        return { success: true };
    }
  } catch (error) {
    console.error(`Error processing event ${event.type}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Advance simulation by a specific number of days
 * This is the core day-by-day simulation engine
 */
export async function advanceByDays(
  franchiseId: string,
  numDays: number,
): Promise<{ success: boolean; error?: string; messages?: string[] }> {
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
    .select("year, simulation_date, season_start_date, trade_deadline_passed, phase")
    .eq("id", franchise.current_season_id!)
    .single();

  if (seasonError || !season) {
    return { success: false, error: "Season not found" };
  }

  // Track messages from events
  const messages: string[] = [];
  let currentDate = season.simulation_date
    ? new Date(season.simulation_date)
    : new Date(season.season_start_date || new Date());
  let currentPhase = season.phase;
  let seasonEnded = false;

  // Process each day sequentially
  for (let day = 0; day < numDays; day++) {
    // Advance to next day
    currentDate = addDays(currentDate, 1);

    // Detect events for this date
    const events = await getEventsForDate(
      supabase,
      currentDate,
      franchise.current_season_id!,
      currentPhase,
      season.year,
    );

    // Process each event
    for (const event of events) {
      const result = await processEvent(
        supabase,
        event,
        franchiseId,
        franchise.current_season_id!,
      );

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.message) {
        messages.push(result.message);
      }

      // Check if season ended
      if (event.type === SimulationEventType.SEASON_END) {
        seasonEnded = true;
        break; // Stop processing days if season ended
      }

      // Update current phase if transition occurred
      if (event.type === SimulationEventType.PHASE_TRANSITION) {
        currentPhase = event.metadata?.toPhase || currentPhase;
      }
    }

    // If season ended, stop the day loop
    if (seasonEnded) {
      break;
    }

    // Update season record for this day
    const newWeek = getWeekFromDate(currentDate, season.year);
    const newPhase = getPhaseFromDate(currentDate, season.year);
    const tradeDeadlinePassed =
      season.trade_deadline_passed || hasTradeDeadlinePassed(currentDate, season.year);

    await supabase
      .from("seasons")
      .update({
        simulation_date: currentDate.toISOString(),
        current_week: newWeek,
        phase: newPhase,
        trade_deadline_passed: tradeDeadlinePassed,
      })
      .eq("id", franchise.current_season_id!);
  }

  // Revalidate relevant pages
  revalidatePath(`/franchise/${franchiseId}`);
  revalidatePath(`/franchise/${franchiseId}/schedule`);
  revalidatePath(`/franchise/${franchiseId}/roster`);
  revalidatePath(`/franchise/${franchiseId}/free-agents`);

  return {
    success: true,
    messages: messages.length > 0 ? messages : undefined,
  };
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
 * Now uses day-by-day simulation internally
 */
export async function advanceToNextWeek(
  franchiseId: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
  // Simply delegate to advanceByDays with 7 days
  const result = await advanceByDays(franchiseId, 7);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Combine all messages into a single message
  const message = result.messages && result.messages.length > 0
    ? result.messages.join(". ")
    : undefined;

  return {
    success: true,
    message,
  };
}

/**
 * Advance simulation to a specific phase
 * Now uses day-by-day simulation internally
 */
export async function advanceToPhase(
  franchiseId: string,
  targetPhase: string,
): Promise<{ success: boolean; error?: string; message?: string }> {
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
    .select("year, simulation_date, season_start_date, phase")
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

  // Calculate how many days to advance
  const currentDate = season.simulation_date
    ? new Date(season.simulation_date)
    : new Date(season.season_start_date || new Date());

  const daysToAdvance = Math.ceil(
    (targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysToAdvance <= 0) {
    return { success: false, error: "Target phase is in the past" };
  }

  // Use day-by-day simulation to reach the target
  const result = await advanceByDays(franchiseId, daysToAdvance);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Combine all messages into a single message
  const message = result.messages && result.messages.length > 0
    ? result.messages.join(". ")
    : undefined;

  return {
    success: true,
    message,
  };
}
