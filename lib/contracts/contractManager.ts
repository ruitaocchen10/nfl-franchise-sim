/**
 * Contract Manager
 * Handles contract expirations, free agency, and salary cap updates
 */

import type { Database } from "@/lib/types/database.types";

type Contract = Database["public"]["Tables"]["contracts"]["Row"];
type RosterSpot = Database["public"]["Tables"]["roster_spots"]["Row"];

interface ContractExpirationResult {
  contractsExpired: number;
  freeAgentsCreated: number;
  contractsCarriedForward: number;
  expiredPlayerIds: string[];
}

/**
 * Process all contract expirations for a season
 */
export async function processContractExpirations(
  supabase: any,
  currentSeasonId: string,
  nextSeasonId: string,
  retiredPlayerIds: string[] = [],
): Promise<ContractExpirationResult> {
  let contractsExpired = 0;
  let freeAgentsCreated = 0;
  let contractsCarriedForward = 0;
  const expiredPlayerIds: string[] = [];

  // Get all contracts for the current season
  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("*")
    .eq("season_id", currentSeasonId);

  if (contractsError) {
    console.error("Error loading contracts:", contractsError);
    return {
      contractsExpired: 0,
      freeAgentsCreated: 0,
      contractsCarriedForward: 0,
      expiredPlayerIds: [],
    };
  }

  for (const contract of contracts) {
    // Skip retired players
    if (retiredPlayerIds.includes(contract.player_id)) {
      continue;
    }

    const newYearsRemaining = contract.years_remaining - 1;

    if (newYearsRemaining <= 0) {
      // Contract has expired
      contractsExpired++;
      expiredPlayerIds.push(contract.player_id);

      // Create free agent entry
      await supabase.from("free_agents").insert({
        player_id: contract.player_id,
        season_id: nextSeasonId,
        previous_team_id: contract.team_id,
        previous_contract_value: contract.total_value,
        market_value: estimateMarketValue(
          contract.annual_salary,
          contract.player_id,
        ),
        status: "available",
      });

      freeAgentsCreated++;

      // Remove from roster (they'll need to be re-signed)
      await supabase
        .from("roster_spots")
        .delete()
        .eq("season_id", currentSeasonId)
        .eq("player_id", contract.player_id);
    } else {
      // Contract continues into next season
      await supabase.from("contracts").insert({
        player_id: contract.player_id,
        team_id: contract.team_id,
        season_id: nextSeasonId,
        total_value: contract.total_value,
        years_remaining: newYearsRemaining,
        annual_salary: contract.annual_salary,
        guaranteed_money: Math.max(
          0,
          contract.guaranteed_money - contract.annual_salary,
        ),
        signing_bonus: contract.signing_bonus,
        cap_hit: contract.cap_hit,
      });

      contractsCarriedForward++;
    }
  }

  return {
    contractsExpired,
    freeAgentsCreated,
    contractsCarriedForward,
    expiredPlayerIds,
  };
}

/**
 * Estimate market value for a free agent based on previous contract
 * This is a simple heuristic - could be enhanced with player rating, position, etc.
 */
function estimateMarketValue(previousSalary: number, playerId: string): number {
  // Base it on previous salary with some variation
  const inflation = 1.05; // 5% salary inflation
  const randomVariation = 0.9 + Math.random() * 0.2; // 90% to 110% of expected

  return Math.round(previousSalary * inflation * randomVariation);
}

/**
 * Copy roster spots for players still under contract to next season
 */
export async function carryForwardRosterSpots(
  supabase: any,
  currentSeasonId: string,
  nextSeasonId: string,
  expiredPlayerIds: string[],
  retiredPlayerIds: string[],
): Promise<number> {
  let rosterSpotsCarried = 0;

  // Get all active roster spots from current season
  const { data: rosterSpots, error: rosterError } = await supabase
    .from("roster_spots")
    .select("*")
    .eq("season_id", currentSeasonId)
    .eq("status", "active");

  if (rosterError) {
    console.error("Error loading roster spots:", rosterError);
    return 0;
  }

  for (const spot of rosterSpots) {
    // Skip players whose contracts expired or who retired
    if (
      expiredPlayerIds.includes(spot.player_id) ||
      retiredPlayerIds.includes(spot.player_id)
    ) {
      continue;
    }

    // Create roster spot for next season
    await supabase.from("roster_spots").insert({
      season_id: nextSeasonId,
      team_id: spot.team_id,
      player_id: spot.player_id,
      jersey_number: spot.jersey_number,
      status: "active",
      depth_position: spot.depth_position,
    });

    rosterSpotsCarried++;
  }

  return rosterSpotsCarried;
}

/**
 * Update team finances for the new season
 */
export async function updateTeamFinances(
  supabase: any,
  currentSeasonId: string,
  nextSeasonId: string,
): Promise<void> {
  // Get all teams
  const { data: teams } = await supabase.from("teams").select("id");

  if (!teams) return;

  for (const team of teams) {
    // Get current season finances
    const { data: currentFinances } = await supabase
      .from("team_finances")
      .select("*")
      .eq("season_id", currentSeasonId)
      .eq("team_id", team.id)
      .single();

    // Calculate rollover cap (unused cap space, max ~$20M)
    const rolloverCap = currentFinances
      ? Math.min(20000000, currentFinances.cap_space)
      : 0;

    // Get total cap hit for next season's contracts
    const { data: nextSeasonContracts } = await supabase
      .from("contracts")
      .select("cap_hit")
      .eq("season_id", nextSeasonId)
      .eq("team_id", team.id);

    const totalCapHit =
      nextSeasonContracts?.reduce((sum, c) => sum + c.cap_hit, 0) || 0;

    // Standard salary cap (could be made configurable)
    const salaryCap = 255000000; // $255M
    const capSpace = salaryCap + rolloverCap - totalCapHit;

    // Create finances for next season
    await supabase.from("team_finances").insert({
      season_id: nextSeasonId,
      team_id: team.id,
      salary_cap: salaryCap,
      cap_space: capSpace,
      dead_money: 0, // Reset dead money
      rollover_cap: rolloverCap,
    });
  }
}

/**
 * Calculate total salary cap space for a team
 */
export async function calculateTeamCapSpace(
  supabase: any,
  seasonId: string,
  teamId: string,
): Promise<number> {
  const { data: finances } = await supabase
    .from("team_finances")
    .select("cap_space")
    .eq("season_id", seasonId)
    .eq("team_id", teamId)
    .single();

  return finances?.cap_space || 0;
}

/**
 * Check if a team can afford a contract
 */
export async function canAffordContract(
  supabase: any,
  seasonId: string,
  teamId: string,
  contractValue: number,
): Promise<boolean> {
  const capSpace = await calculateTeamCapSpace(supabase, seasonId, teamId);
  return capSpace >= contractValue;
}
