/**
 * Franchise Server Actions
 * Handles franchise creation, retrieval, and management
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";
import { generateFullSeasonSchedule } from "@/lib/schedule/scheduleGenerator";

type Team = Database["public"]["Tables"]["teams"]["Row"];

interface CreateFranchiseData {
  teamId: string;
  franchiseName: string;
  difficulty: "easy" | "medium" | "hard";
}

export async function createFranchise(data: CreateFranchiseData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/login?error=You must be logged in to create a franchise");
  }

  // Validate inputs
  if (!data.teamId || !data.franchiseName.trim()) {
    throw new Error("Team and franchise name are required");
  }

  // Create the franchise first (without current_season_id)
  const { data: franchise, error: franchiseError } = await supabase
    .from("franchises")
    .insert({
      user_id: user.id,
      team_id: data.teamId,
      franchise_name: data.franchiseName.trim(),
      difficulty: data.difficulty,
      is_active: true,
    })
    .select()
    .single();

  if (franchiseError) {
    console.error("Franchise creation error:", franchiseError);
    throw new Error("Failed to create franchise: " + franchiseError.message);
  }

  console.log("✅ Franchise created:", franchise.id);

  // Find the template season
  const { data: templateSeason, error: templateError } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_template", true)
    .single();

  if (templateError || !templateSeason) {
    console.error("Template season error:", templateError);
    // Cleanup: delete the franchise if template season is missing
    await supabase.from("franchises").delete().eq("id", franchise.id);
    throw new Error("Template season not found. Please contact support.");
  }

  console.log("✅ Found template season:", templateSeason.id);

  // Create initial season (2026, week 0, offseason)
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .insert([
      {
        franchise_id: franchise.id,
        year: 2026,
        current_week: 0,
        phase: "offseason",
        is_template: false,
      },
    ] as Database["public"]["Tables"]["seasons"]["Insert"][])
    .select()
    .single();

  if (seasonError) {
    console.error("Season creation error:", seasonError);
    // Cleanup: delete the franchise if season creation fails
    await supabase.from("franchises").delete().eq("id", franchise.id);
    throw new Error("Failed to create season: " + seasonError.message);
  }

  console.log("✅ Season created:", season.id);

  // Update franchise with current_season_id
  const { error: updateError } = await supabase
    .from("franchises")
    .update({ current_season_id: season.id })
    .eq("id", franchise.id);

  if (updateError) {
    console.error("Franchise update error:", updateError);
  }

  // Get all 32 teams to initialize standings and finances
  const { data: allTeams, error: teamsError} = await supabase
    .from("teams")
    .select("*");

  if (teamsError || !allTeams) {
    console.error("Teams fetch error:", teamsError);
    throw new Error("Failed to fetch teams");
  }

  // Initialize team_standings for all 32 teams
  const standingsData = allTeams.map((team) => ({
    season_id: season.id,
    team_id: team.id,
    wins: 0,
    losses: 0,
    ties: 0,
    division_rank: 1,
    conference_rank: 1,
    points_for: 0,
    points_against: 0,
  })) as Database["public"]["Tables"]["team_standings"]["Insert"][];

  const { error: standingsError } = await supabase
    .from("team_standings")
    .insert(standingsData);

  if (standingsError) {
    console.error("Standings creation error:", standingsError);
    // Non-critical, continue anyway
  }

  console.log("✅ Team standings created");

  // Initialize team_finances for all 32 teams
  const financesData = allTeams.map((team) => ({
    season_id: season.id,
    team_id: team.id,
    salary_cap: 255000000, // $255M
    cap_space: 255000000, // Start with full cap available
    dead_money: 0,
    rollover_cap: 0,
  }));

  const { error: financesError } = await supabase
    .from("team_finances")
    .insert(financesData);

  if (financesError) {
    console.error("Finances creation error:", financesError);
    // Non-critical, continue anyway
  }

  console.log("✅ Team finances created");

  // ============================================================================
  // COPY ROSTER DATA FROM TEMPLATE SEASON (WITH PAGINATION)
  // ============================================================================

  console.log("📋 Starting roster copy from template...");

  // Step 1: Copy player_attributes from template season
  // Supabase has a 1000 row limit, so we need to paginate
  let templateAttributes: any[] = [];
  let attrPage = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("player_attributes")
      .select("*")
      .eq("season_id", templateSeason.id)
      .range(attrPage * pageSize, (attrPage + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching template player attributes:", error);
      throw new Error("Failed to fetch template player data");
    }

    if (!data || data.length === 0) break;

    templateAttributes = [...templateAttributes, ...data];
    console.log(
      `   Page ${attrPage + 1}: +${data.length} attributes (total: ${templateAttributes.length})`,
    );

    if (data.length < pageSize) break; // Last page
    attrPage++;
  }

  console.log(
    `📋 Found ${templateAttributes.length} player attributes to copy`,
  );

  // Insert player_attributes for the new season
  const newAttributes = templateAttributes.map((attr) => ({
    player_id: attr.player_id,
    season_id: season.id,
    age: attr.age,
    overall_rating: attr.overall_rating,
    speed: attr.speed,
    strength: attr.strength,
    agility: attr.agility,
    awareness: attr.awareness,
    injury_prone: attr.injury_prone,
    development_trait: attr.development_trait,
    morale: attr.morale,
    years_pro: attr.years_pro,
  }));

  const { error: attrInsertError } = await supabase
    .from("player_attributes")
    .insert(newAttributes);

  if (attrInsertError) {
    console.error("Error inserting player attributes:", attrInsertError);
    throw new Error("Failed to copy player attributes");
  }

  console.log("✅ Player attributes copied");

  // Step 2: Copy roster_spots from template season (WITH PAGINATION)
  let templateRoster: any[] = [];
  let rosterPage = 0;

  while (true) {
    const { data, error } = await supabase
      .from("roster_spots")
      .select("*")
      .eq("season_id", templateSeason.id)
      .range(rosterPage * pageSize, (rosterPage + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching template roster:", error);
      throw new Error("Failed to fetch template roster");
    }

    if (!data || data.length === 0) break;

    templateRoster = [...templateRoster, ...data];
    console.log(
      `   Page ${rosterPage + 1}: +${data.length} roster spots (total: ${templateRoster.length})`,
    );

    if (data.length < pageSize) break; // Last page
    rosterPage++;
  }

  console.log(`📋 Found ${templateRoster.length} roster spots to copy`);

  // Insert roster_spots for the new season
  const newRoster = templateRoster.map((spot) => ({
    season_id: season.id,
    team_id: spot.team_id,
    player_id: spot.player_id,
    jersey_number: spot.jersey_number,
    depth_position: spot.depth_position,
    status: spot.status,
  }));

  const { error: rosterInsertError } = await supabase
    .from("roster_spots")
    .insert(newRoster);

  if (rosterInsertError) {
    console.error("Error inserting roster spots:", rosterInsertError);
    throw new Error("Failed to copy roster");
  }

  console.log("✅ Roster spots copied");

  // Step 3: Copy contracts from template season (WITH PAGINATION)
  let templateContracts: any[] = [];
  let contractPage = 0;

  while (true) {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("season_id", templateSeason.id)
      .range(contractPage * pageSize, (contractPage + 1) * pageSize - 1);

    if (error) {
      console.error("Error fetching template contracts:", error);
      throw new Error("Failed to fetch template contracts");
    }

    if (!data || data.length === 0) break;

    templateContracts = [...templateContracts, ...data];
    console.log(
      `   Page ${contractPage + 1}: +${data.length} contracts (total: ${templateContracts.length})`,
    );

    if (data.length < pageSize) break; // Last page
    contractPage++;
  }

  console.log(`📋 Found ${templateContracts.length} contracts to copy`);

  // Insert contracts for the new season
  const newContracts = templateContracts.map((contract) => ({
    season_id: season.id,
    team_id: contract.team_id,
    player_id: contract.player_id,
    total_value: contract.total_value,
    years_remaining: contract.years_remaining,
    annual_salary:
      contract.annual_salary || contract.total_value / contract.years_remaining,
    guaranteed_money: contract.guaranteed_money,
    signing_bonus: contract.signing_bonus,
    cap_hit: contract.cap_hit,
  }));

  const { error: contractsInsertError } = await supabase
    .from("contracts")
    .insert(newContracts);

  if (contractsInsertError) {
    console.error("Error inserting contracts:", contractsInsertError);
    throw new Error("Failed to copy contracts");
  }

  console.log("✅ Contracts copied");

  // ============================================================================
  // RECALCULATE ACCURATE CAP SPACE BASED ON ACTUAL CONTRACTS
  // ============================================================================

  console.log("💰 Recalculating cap space based on actual contracts...");

  // For each team, calculate actual cap space from contracts
  for (const team of allTeams) {
    // Get all contracts for this team in the new season
    const { data: teamContracts, error: contractsError } = await supabase
      .from("contracts")
      .select("cap_hit")
      .eq("season_id", season.id)
      .eq("team_id", team.id);

    if (contractsError) {
      console.error(`Error fetching contracts for ${team.abbreviation}:`, contractsError);
      continue;
    }

    // Sum up all cap hits
    const totalCapHit = teamContracts?.reduce((sum, c) => sum + c.cap_hit, 0) || 0;

    // Calculate actual cap space (no rollover for new franchises)
    const salaryCap = 255000000; // $255M
    const actualCapSpace = salaryCap - totalCapHit;

    // Update team_finances with accurate cap space
    const { error: updateError } = await supabase
      .from("team_finances")
      .update({ cap_space: actualCapSpace })
      .eq("season_id", season.id)
      .eq("team_id", team.id);

    if (updateError) {
      console.error(`Error updating finances for ${team.abbreviation}:`, updateError);
    } else {
      console.log(
        `   ${team.abbreviation}: $${(totalCapHit / 1000000).toFixed(1)}M committed, $${(actualCapSpace / 1000000).toFixed(1)}M available`,
      );
    }
  }

  console.log("✅ Cap space recalculated for all teams");

  // Step 4: Copy free_agents from template season
  console.log("📋 Copying free agents from template...");

  const { data: templateFreeAgents, error: freeAgentsError } = await supabase
    .from("free_agents")
    .select("*")
    .eq("season_id", templateSeason.id);

  if (freeAgentsError) {
    console.error("Error fetching template free agents:", freeAgentsError);
    throw new Error("Failed to fetch template free agents");
  }

  if (templateFreeAgents && templateFreeAgents.length > 0) {
    const newFreeAgents = templateFreeAgents.map((fa) => ({
      season_id: season.id,
      player_id: fa.player_id,
      previous_team_id: fa.previous_team_id,
      previous_contract_value: fa.previous_contract_value,
      market_value: fa.market_value,
      status: fa.status,
      interested_teams: fa.interested_teams || [],
    }));

    const { error: freeAgentsInsertError } = await supabase
      .from("free_agents")
      .insert(newFreeAgents);

    if (freeAgentsInsertError) {
      console.error("Error inserting free agents:", freeAgentsInsertError);
      // Non-critical, continue anyway
    } else {
      console.log(`✅ Copied ${newFreeAgents.length} free agents`);
    }
  } else {
    console.log("   No free agents in template to copy");
  }

  // ============================================================================
  // GENERATE SCHEDULE
  // ============================================================================

  console.log("📅 Generating season schedule...");

  // Fetch 2025 template season standings for realistic matchups
  const { data: templateSeason2025 } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_template", true)
    .eq("year", 2025)
    .single();

  let previousStandings = null;
  if (templateSeason2025) {
    const { data: standings } = await supabase
      .from("team_standings")
      .select("*")
      .eq("season_id", templateSeason2025.id);

    previousStandings = standings;
    console.log(`   📊 Using 2025 standings data (${standings?.length || 0} teams)`);
  } else {
    console.log("   ⚠️  No 2025 template standings found, using default matchups");
  }

  // Generate the schedule for all 32 teams with standings
  const { games: scheduleGames, byeWeeks } = generateFullSeasonSchedule(
    allTeams,
    season.id,
    season.year,
    previousStandings || undefined
  );

  // Insert games in batches to avoid timeout
  const batchSize = 100;
  for (let i = 0; i < scheduleGames.length; i += batchSize) {
    const batch = scheduleGames.slice(i, i + batchSize);
    const { error: gamesError } = await supabase.from("games").insert(batch);

    if (gamesError) {
      console.error("Error inserting games batch:", gamesError);
      throw new Error("Failed to create schedule");
    }

    console.log(
      `   Inserted games ${i + 1}-${Math.min(i + batchSize, scheduleGames.length)} of ${scheduleGames.length}`,
    );
  }

  console.log(`✅ Created ${scheduleGames.length} games`);

  // Insert bye weeks
  if (byeWeeks && byeWeeks.length > 0) {
    const { error: byeError } = await supabase
      .from("team_bye_weeks")
      .insert(byeWeeks);

    if (byeError) {
      console.error("Error inserting bye weeks:", byeError);
      // Non-critical, continue anyway
    } else {
      console.log(`✅ Created ${byeWeeks.length} bye week assignments`);
    }
  }

  console.log("🎉 Franchise setup complete!");

  // Revalidate and redirect
  revalidatePath("/dashboard");
  redirect(`/franchise/${franchise.id}`);
}

export async function getFranchises() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data: franchises, error } = await supabase
    .from("franchises")
    .select(
      `
      *,
      team:teams(*),
      current_season:seasons!franchises_current_season_fkey(*)
    `,
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching franchises:", error);
    return [];
  }

  return franchises || [];
}

export async function getFranchiseById(franchiseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: franchise, error } = await supabase
    .from("franchises")
    .select(
      `
      *,
      team:teams(*),
      current_season:seasons!franchises_current_season_fkey(*)
    `,
    )
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (error || !franchise) {
    console.error("Error fetching franchise:", error);
    redirect("/dashboard");
  }

  return franchise;
}

export async function getAllTeams(): Promise<Team[]> {
  const supabase = await createClient();

  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("conference", { ascending: true })
    .order("division", { ascending: true })
    .order("city", { ascending: true });

  if (error) {
    console.error("Error fetching teams:", error);
    return [];
  }

  return teams || [];
}

export async function deleteFranchise(
  franchiseId: string,
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
    .select("id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (franchiseError || !franchise) {
    return { success: false, error: "Franchise not found" };
  }

  // Hard delete: remove franchise and cascade delete all related data
  const { error: deleteError } = await supabase
    .from("franchises")
    .delete()
    .eq("id", franchiseId);

  if (deleteError) {
    console.error("Error deleting franchise:", deleteError);
    return { success: false, error: "Failed to delete franchise" };
  }

  // Revalidate the dashboard to show updated franchise list
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Get team standings for a franchise's current season
 */
export async function getTeamStandings(franchiseId: string, teamId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Get franchise to get current season
  const { data: franchise } = await supabase
    .from("franchises")
    .select("current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (!franchise || !franchise.current_season_id) {
    return null;
  }

  // Get standings
  const { data: standings } = await supabase
    .from("team_standings")
    .select("*")
    .eq("season_id", franchise.current_season_id)
    .eq("team_id", teamId)
    .single();

  return standings;
}

/**
 * Get the next upcoming game for a team
 */
export async function getNextGame(franchiseId: string, teamId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Get franchise to get current season
  const { data: franchise } = await supabase
    .from("franchises")
    .select("current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (!franchise || !franchise.current_season_id) {
    return null;
  }

  // Get next unsimulated game
  const { data: game } = await supabase
    .from("games")
    .select(`
      id,
      week,
      home_team_id,
      away_team_id
    `)
    .eq("season_id", franchise.current_season_id)
    .eq("simulated", false)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("week", { ascending: true })
    .limit(1)
    .single();

  if (!game) {
    return null;
  }

  // Fetch team details separately
  const { data: homeTeam } = await supabase
    .from("teams")
    .select("id, city, name, abbreviation")
    .eq("id", game.home_team_id)
    .single();

  const { data: awayTeam } = await supabase
    .from("teams")
    .select("id, city, name, abbreviation")
    .eq("id", game.away_team_id)
    .single();

  if (!homeTeam || !awayTeam) {
    return null;
  }

  // Return game with full team info
  return {
    id: game.id,
    week: game.week,
    home_team: homeTeam,
    away_team: awayTeam,
    is_home_game: game.home_team_id === teamId,
  };
}

/**
 * Calculate team overall rating based on roster
 */
export async function getTeamOverallRating(franchiseId: string, teamId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return 0;
  }

  // Get franchise to get current season
  const { data: franchise } = await supabase
    .from("franchises")
    .select("current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (!franchise || !franchise.current_season_id) {
    return 0;
  }

  // Get all player IDs on the roster
  const { data: rosterSpots } = await supabase
    .from("roster_spots")
    .select("player_id")
    .eq("season_id", franchise.current_season_id)
    .eq("team_id", teamId)
    .eq("status", "active");

  if (!rosterSpots || rosterSpots.length === 0) {
    return 0;
  }

  const playerIds = rosterSpots.map((spot) => spot.player_id);

  // Get player attributes
  const { data: attributes } = await supabase
    .from("player_attributes")
    .select("overall_rating")
    .eq("season_id", franchise.current_season_id)
    .in("player_id", playerIds);

  if (!attributes || attributes.length === 0) {
    return 0;
  }

  // Calculate average
  const sum = attributes.reduce((acc, attr) => acc + attr.overall_rating, 0);
  const average = Math.round(sum / attributes.length);

  return average;
}

/**
 * Get roster size for a team
 */
export async function getRosterSize(franchiseId: string, teamId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return 0;
  }

  // Get franchise to get current season
  const { data: franchise } = await supabase
    .from("franchises")
    .select("current_season_id")
    .eq("id", franchiseId)
    .eq("user_id", user.id)
    .single();

  if (!franchise || !franchise.current_season_id) {
    return 0;
  }

  // Count active roster spots
  const { count } = await supabase
    .from("roster_spots")
    .select("*", { count: "exact", head: true })
    .eq("season_id", franchise.current_season_id)
    .eq("team_id", teamId)
    .eq("status", "active");

  return count || 0;
}
