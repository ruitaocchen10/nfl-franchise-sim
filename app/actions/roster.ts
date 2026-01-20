/**
 * Roster Server Actions
 * Handles fetching and managing team rosters
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface RosterPlayer {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  college: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_pick: number | null;
  height_inches: number | null;
  weight_lbs: number | null;
  attributes: {
    age: number;
    overall_rating: number;
    speed: number;
    strength: number;
    agility: number;
    awareness: number;
    injury_prone: number;
    development_trait: "superstar" | "star" | "normal" | "slow";
    morale: number;
    years_pro: number;
  };
  roster_spot: {
    jersey_number: number | null;
    status: "active" | "injured_reserve" | "practice_squad" | "inactive";
    depth_position: number;
  };
}

export async function getFranchiseRoster(
  franchiseId: string,
): Promise<RosterPlayer[]> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get franchise with team and season info
  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select(
      `
      id,
      team_id,
      current_season_id
    `,
    )
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise || !franchise.current_season_id) {
    console.error("Error fetching franchise:", franchiseError);
    return [];
  }

  // Get roster spots for this team and season
  const { data: rosterSpots, error: rosterError } = await supabase
    .from("roster_spots")
    .select(
      `
      id,
      jersey_number,
      status,
      depth_position,
      player_id,
      players (
        id,
        first_name,
        last_name,
        position,
        college,
        draft_year,
        draft_round,
        draft_pick,
        height_inches,
        weight_lbs
      )
    `,
    )
    .eq("team_id", franchise.team_id)
    .eq("season_id", franchise.current_season_id);

  if (rosterError) {
    console.error("Error fetching roster:", rosterError);
    return [];
  }

  if (!rosterSpots || rosterSpots.length === 0) {
    return [];
  }

  // Get player attributes for all players
  const playerIds = rosterSpots.map((spot) => spot.player_id);
  const { data: attributes, error: attributesError } = await supabase
    .from("player_attributes")
    .select("*")
    .in("player_id", playerIds)
    .eq("season_id", franchise.current_season_id);

  if (attributesError) {
    console.error("Error fetching attributes:", attributesError);
    return [];
  }

  // Create a map of player attributes
  const attributesMap = new Map(
    attributes?.map((attr) => [attr.player_id, attr]) || [],
  );

  // Combine the data
  const roster: RosterPlayer[] = rosterSpots
    .map((spot: any) => {
      const player = spot.players;
      const attrs = attributesMap.get(spot.player_id);

      if (!player || !attrs) {
        return null;
      }

      return {
        id: player.id,
        first_name: player.first_name,
        last_name: player.last_name,
        position: player.position,
        college: player.college,
        draft_year: player.draft_year,
        draft_round: player.draft_round,
        draft_pick: player.draft_pick,
        height_inches: player.height_inches,
        weight_lbs: player.weight_lbs,
        attributes: {
          age: attrs.age,
          overall_rating: attrs.overall_rating,
          speed: attrs.speed,
          strength: attrs.strength,
          agility: attrs.agility,
          awareness: attrs.awareness,
          injury_prone: attrs.injury_prone,
          development_trait: attrs.development_trait,
          morale: attrs.morale,
          years_pro: attrs.years_pro,
        },
        roster_spot: {
          jersey_number: spot.jersey_number,
          status: spot.status,
          depth_position: spot.depth_position,
        },
      };
    })
    .filter((p): p is RosterPlayer => p !== null);

  return roster;
}

export interface DepthChartPlayer extends RosterPlayer {
  roster_spot_id: string;
}

export async function getDepthChart(
  franchiseId: string,
): Promise<DepthChartPlayer[]> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get franchise with team and season info
  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select(
      `
      id,
      team_id,
      current_season_id
    `,
    )
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise || !franchise.current_season_id) {
    console.error("Error fetching franchise:", franchiseError);
    return [];
  }

  // Get roster spots for this team and season, only active players
  const { data: rosterSpots, error: rosterError } = await supabase
    .from("roster_spots")
    .select(
      `
      id,
      jersey_number,
      status,
      depth_position,
      player_id,
      players (
        id,
        first_name,
        last_name,
        position,
        college,
        draft_year,
        draft_round,
        draft_pick,
        height_inches,
        weight_lbs
      )
    `,
    )
    .eq("team_id", franchise.team_id)
    .eq("season_id", franchise.current_season_id)
    .eq("status", "active")
    .order("depth_position", { ascending: true });

  if (rosterError) {
    console.error("Error fetching roster:", rosterError);
    return [];
  }

  if (!rosterSpots || rosterSpots.length === 0) {
    return [];
  }

  // Get player attributes for all players
  const playerIds = rosterSpots.map((spot) => spot.player_id);
  const { data: attributes, error: attributesError } = await supabase
    .from("player_attributes")
    .select("*")
    .in("player_id", playerIds)
    .eq("season_id", franchise.current_season_id);

  if (attributesError) {
    console.error("Error fetching attributes:", attributesError);
    return [];
  }

  // Create a map of player attributes
  const attributesMap = new Map(
    attributes?.map((attr) => [attr.player_id, attr]) || [],
  );

  // Combine the data
  const depthChart: DepthChartPlayer[] = rosterSpots
    .map((spot: any) => {
      const player = spot.players;
      const attrs = attributesMap.get(spot.player_id);

      if (!player || !attrs) {
        return null;
      }

      return {
        id: player.id,
        first_name: player.first_name,
        last_name: player.last_name,
        position: player.position,
        college: player.college,
        draft_year: player.draft_year,
        draft_round: player.draft_round,
        draft_pick: player.draft_pick,
        height_inches: player.height_inches,
        weight_lbs: player.weight_lbs,
        attributes: {
          age: attrs.age,
          overall_rating: attrs.overall_rating,
          speed: attrs.speed,
          strength: attrs.strength,
          agility: attrs.agility,
          awareness: attrs.awareness,
          injury_prone: attrs.injury_prone,
          development_trait: attrs.development_trait,
          morale: attrs.morale,
          years_pro: attrs.years_pro,
        },
        roster_spot: {
          jersey_number: spot.jersey_number,
          status: spot.status,
          depth_position: spot.depth_position,
        },
        roster_spot_id: spot.id,
      };
    })
    .filter((p): p is DepthChartPlayer => p !== null);

  return depthChart;
}

export async function updateDepthPosition(
  franchiseId: string,
  rosterSpotId: string,
  newDepthPosition: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify user owns this franchise
  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .select("id, team_id, current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Verify the roster spot belongs to this franchise's team and season
  const { data: rosterSpot, error: rosterSpotError } = await supabase
    .from("roster_spots")
    .select("id, team_id, season_id")
    .eq("id", rosterSpotId)
    .single();

  if (
    rosterSpotError ||
    !rosterSpot ||
    rosterSpot.team_id !== franchise.team_id ||
    rosterSpot.season_id !== franchise.current_season_id
  ) {
    return { success: false, error: "Invalid roster spot" };
  }

  // Update the depth position
  const { error: updateError } = await supabase
    .from("roster_spots")
    .update({ depth_position: newDepthPosition })
    .eq("id", rosterSpotId);

  if (updateError) {
    console.error("Error updating depth position:", updateError);
    return { success: false, error: "Failed to update depth position" };
  }

  return { success: true };
}
