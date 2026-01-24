/**
 * Season Transition Manager
 * Orchestrates the transition from one season to the next
 * Handles player progression, contract expirations, retirements, and draft class generation
 */

import { createClient } from "@/lib/supabase/server";
import { processAllPlayerProgressions } from "@/lib/progression/playerProgression";
import {
  processContractExpirations,
  carryForwardRosterSpots,
  updateTeamFinances,
} from "@/lib/contracts/contractManager";
import { generateDraftClass } from "@/lib/draft/prospectGenerator";
import { getSeasonDates } from "@/lib/season/calendarUtils";

interface SeasonTransitionResult {
  success: boolean;
  error?: string;
  newSeasonId?: string;
  stats?: {
    playersProgressed: number;
    playersRegressed: number;
    playersRetired: number;
    contractsExpired: number;
    freeAgentsCreated: number;
    prospectsGenerated: number;
    rosterSpotsCarried: number;
  };
}

/**
 * Create a new season record for the franchise
 */
async function createNewSeason(
  supabase: any,
  franchiseId: string,
  currentYear: number,
): Promise<string | null> {
  const nextYear = currentYear + 1;
  const dates = getSeasonDates(nextYear);

  const { data: newSeason, error } = await supabase
    .from("seasons")
    .insert({
      franchise_id: franchiseId,
      year: nextYear,
      current_week: 0,
      phase: "offseason",
      simulation_date: dates.offseasonStart.toISOString(),
      season_start_date: dates.regularSeasonStart.toISOString(),
      trade_deadline_passed: false,
      is_template: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating new season:", error);
    return null;
  }

  return newSeason.id;
}

/**
 * Copy team standings to new season (reset to 0-0)
 */
async function initializeStandings(
  supabase: any,
  newSeasonId: string,
): Promise<void> {
  // Get all teams
  const { data: teams } = await supabase.from("teams").select("id");

  if (!teams) return;

  const standingsToInsert = teams.map((team: any) => ({
    season_id: newSeasonId,
    team_id: team.id,
    wins: 0,
    losses: 0,
    ties: 0,
    division_rank: 1,
    conference_rank: 1,
    points_for: 0,
    points_against: 0,
  }));

  await supabase.from("team_standings").insert(standingsToInsert);
}

/**
 * Generate schedule for the new season
 * This is a placeholder - you'll need to implement full schedule generation
 */
async function generateSchedule(
  supabase: any,
  newSeasonId: string,
): Promise<void> {
  // TODO: Implement full schedule generation
  // For now, this is a placeholder
  // You can use the existing scheduleGenerator.ts logic here
  console.log("Schedule generation not yet implemented for", newSeasonId);
}

/**
 * Main season end processing function
 * This orchestrates all offseason activities
 */
export async function processSeasonEnd(
  franchiseId: string,
  currentSeasonId: string,
): Promise<SeasonTransitionResult> {
  const supabase = await createClient();

  try {
    // Get current season info
    const { data: currentSeason, error: seasonError } = await supabase
      .from("seasons")
      .select("year, franchise_id")
      .eq("id", currentSeasonId)
      .single();

    if (seasonError || !currentSeason) {
      return {
        success: false,
        error: "Current season not found",
      };
    }

    console.log(`Processing season end for ${currentSeason.year}...`);

    // Step 1: Create new season
    console.log("Creating new season...");
    const newSeasonId = await createNewSeason(
      supabase,
      franchiseId,
      currentSeason.year,
    );

    if (!newSeasonId) {
      return {
        success: false,
        error: "Failed to create new season",
      };
    }

    // Step 2: Process player progressions and retirements
    console.log("Processing player progressions...");
    const progressionResults = await processAllPlayerProgressions(
      supabase,
      currentSeasonId,
      newSeasonId,
    );

    // Step 3: Process contract expirations and create free agents
    console.log("Processing contract expirations...");
    const contractResults = await processContractExpirations(
      supabase,
      currentSeasonId,
      newSeasonId,
      progressionResults.retiredPlayerIds,
    );

    // Step 4: Carry forward roster spots for players still under contract
    console.log("Carrying forward roster spots...");
    const rosterSpotsCarried = await carryForwardRosterSpots(
      supabase,
      currentSeasonId,
      newSeasonId,
      contractResults.expiredPlayerIds,
      progressionResults.retiredPlayerIds,
    );

    // Step 5: Update team finances for new season
    console.log("Updating team finances...");
    await updateTeamFinances(supabase, currentSeasonId, newSeasonId);

    // Step 6: Initialize standings for new season
    console.log("Initializing standings...");
    await initializeStandings(supabase, newSeasonId);

    // Step 7: Generate draft class
    console.log("Generating draft class...");
    const prospectsGenerated = await generateDraftClass(supabase, newSeasonId);

    // Step 8: Generate schedule (placeholder for now)
    // await generateSchedule(supabase, newSeasonId);

    // Note: AI Free Agency will run gradually during the free_agency phase
    // via advanceToNextWeek() - not as a batch process here

    // Step 9: Log the progression
    await supabase.from("season_progression_log").insert({
      franchise_id: franchiseId,
      from_season_id: currentSeasonId,
      to_season_id: newSeasonId,
      players_progressed: progressionResults.progressed,
      players_regressed: progressionResults.regressed,
      players_retired: progressionResults.retired,
      contracts_expired: contractResults.contractsExpired,
      free_agents_created: contractResults.freeAgentsCreated,
      prospects_generated: prospectsGenerated,
    });

    // Step 10: Update franchise to point to new season
    await supabase
      .from("franchises")
      .update({
        current_season_id: newSeasonId,
      })
      .eq("id", franchiseId);

    console.log("Season transition complete!");

    return {
      success: true,
      newSeasonId,
      stats: {
        playersProgressed: progressionResults.progressed,
        playersRegressed: progressionResults.regressed,
        playersRetired: progressionResults.retired,
        contractsExpired: contractResults.contractsExpired,
        freeAgentsCreated: contractResults.freeAgentsCreated,
        prospectsGenerated,
        rosterSpotsCarried,
      },
    };
  } catch (error) {
    console.error("Error during season transition:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if it's time to process season end
 */
export function shouldProcessSeasonEnd(
  currentPhase: string,
  newPhase: string,
): boolean {
  // Trigger season end when transitioning INTO offseason
  return newPhase === "offseason" && currentPhase !== "offseason";
}

/**
 * Get season progression summary for display
 */
export async function getSeasonProgressionSummary(
  franchiseId: string,
  seasonId: string,
): Promise<any> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("season_progression_log")
    .select("*")
    .eq("franchise_id", franchiseId)
    .eq("to_season_id", seasonId)
    .single();

  return data;
}
