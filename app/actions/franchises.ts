/**
 * Franchise Server Actions
 * Handles franchise creation, retrieval, and management
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

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

  // Create initial season (2024, week 0, preseason)
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .insert([
      {
        franchise_id: franchise.id,
        year: 2024,
        current_week: 0,
        phase: "preseason",
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
  const { data: allTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id");

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
