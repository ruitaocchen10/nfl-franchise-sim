/**
 * Free Agency Server Actions
 * Handles fetching free agents, making offers, and signing players
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface FreeAgent {
  id: string;
  player_id: string;
  season_id: string;
  previous_team_id: string;
  previous_contract_value: number;
  market_value: number;
  status: string;
  player: {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
    college: string | null;
    draft_year: number | null;
    height_inches: number | null;
    weight_lbs: number | null;
  };
  player_attributes: {
    age: number;
    overall_rating: number;
    speed: number;
    strength: number;
    agility: number;
    awareness: number;
    injury_prone: number;
    development_trait: string;
    morale: number;
    years_pro: number;
  } | null;
  previous_team: {
    abbreviation: string;
    city: string;
    name: string;
  };
}

/**
 * Get all available free agents for a franchise's current season
 */
export async function getFreeAgents(
  franchiseId: string,
  position?: string,
): Promise<{ success: boolean; data?: FreeAgent[]; error?: string }> {
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
    .select("id, current_season_id, user_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Build query for free agents
  let query = supabase
    .from("free_agents")
    .select(
      `
      *,
      player:players!free_agents_player_id_fkey(*),
      previous_team:teams!free_agents_previous_team_id_fkey(abbreviation, city, name)
    `,
    )
    .eq("season_id", franchise.current_season_id!)
    .eq("status", "available");

  const { data: freeAgents, error: freeAgentsError } = await query;

  if (freeAgentsError) {
    console.error("Error fetching free agents:", freeAgentsError);
    return { success: false, error: "Failed to fetch free agents" };
  }

  // Get player attributes for each free agent
  const enrichedFreeAgents = await Promise.all(
    (freeAgents || []).map(async (fa: any) => {
      const { data: attributes } = await supabase
        .from("player_attributes")
        .select("*")
        .eq("player_id", fa.player_id)
        .eq("season_id", franchise.current_season_id!)
        .single();

      return {
        ...fa,
        player_attributes: attributes,
      };
    }),
  );

  // Filter by position if specified
  let filteredAgents = enrichedFreeAgents;
  if (position && position !== "all") {
    filteredAgents = enrichedFreeAgents.filter(
      (fa) => fa.player.position === position,
    );
  }

  return { success: true, data: filteredAgents as FreeAgent[] };
}

/**
 * Get team's current salary cap space
 */
export async function getCapSpace(
  franchiseId: string,
): Promise<{ success: boolean; capSpace?: number; salaryCap?: number; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: franchise } = await supabase
    .from("franchises")
    .select("id, current_season_id, team_id, user_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (!franchise) {
    return { success: false, error: "Franchise not found" };
  }

  const { data: finances } = await supabase
    .from("team_finances")
    .select("cap_space, salary_cap")
    .eq("season_id", franchise.current_season_id!)
    .eq("team_id", franchise.team_id)
    .single();

  if (!finances) {
    return { success: false, error: "Cap space not found" };
  }

  return {
    success: true,
    capSpace: finances.cap_space,
    salaryCap: finances.salary_cap,
  };
}

/**
 * Make a contract offer to a free agent
 */
export async function makeContractOffer(
  franchiseId: string,
  playerId: string,
  years: number,
  totalValue: number,
  guaranteedMoney: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: franchise } = await supabase
    .from("franchises")
    .select("id, current_season_id, team_id, user_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (!franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Check cap space
  const capSpaceResult = await getCapSpace(franchiseId);
  if (!capSpaceResult.success || !capSpaceResult.capSpace) {
    return { success: false, error: "Failed to check cap space" };
  }

  const annualSalary = Math.round(totalValue / years);
  if (annualSalary > capSpaceResult.capSpace) {
    return {
      success: false,
      error: `Insufficient cap space. You have $${(capSpaceResult.capSpace / 1000000).toFixed(1)}M available.`,
    };
  }

  // Validate inputs
  if (years < 1 || years > 7) {
    return { success: false, error: "Contract must be between 1 and 7 years" };
  }

  if (guaranteedMoney > totalValue) {
    return {
      success: false,
      error: "Guaranteed money cannot exceed total value",
    };
  }

  // For now, automatically accept the offer (AI negotiation can be added later)
  // Create the contract
  const { error: contractError } = await supabase.from("contracts").insert({
    player_id: playerId,
    team_id: franchise.team_id,
    season_id: franchise.current_season_id!,
    total_value: totalValue,
    years_remaining: years,
    annual_salary: annualSalary,
    guaranteed_money: guaranteedMoney,
    signing_bonus: Math.round(guaranteedMoney * 0.5), // 50% of guaranteed as signing bonus
    cap_hit: annualSalary,
  });

  if (contractError) {
    console.error("Error creating contract:", contractError);
    return { success: false, error: "Failed to create contract" };
  }

  // Add player to roster
  const { error: rosterError } = await supabase.from("roster_spots").insert({
    season_id: franchise.current_season_id!,
    team_id: franchise.team_id,
    player_id: playerId,
    status: "active",
    depth_position: 99, // Put at bottom of depth chart initially
  });

  if (rosterError) {
    console.error("Error adding to roster:", rosterError);
    return { success: false, error: "Failed to add player to roster" };
  }

  // Update free agent status
  await supabase
    .from("free_agents")
    .update({
      status: "signed",
      signed_team_id: franchise.team_id,
      signed_at: new Date().toISOString(),
    })
    .eq("player_id", playerId)
    .eq("season_id", franchise.current_season_id!);

  // Update team finances
  const newCapSpace = capSpaceResult.capSpace - annualSalary;
  await supabase
    .from("team_finances")
    .update({ cap_space: newCapSpace })
    .eq("season_id", franchise.current_season_id!)
    .eq("team_id", franchise.team_id);

  // Revalidate pages
  revalidatePath(`/franchise/${franchiseId}/free-agents`);
  revalidatePath(`/franchise/${franchiseId}/roster`);

  return { success: true };
}
