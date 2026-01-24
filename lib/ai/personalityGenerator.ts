/**
 * Team Personality Generator
 * Generates context-driven AI personalities for teams based on:
 * - Last season performance
 * - Roster composition (age, talent, depth)
 * - Cap space situation
 * - Position needs
 */

import { assessTeamNeeds, type TeamNeeds } from "./teamNeeds";

export type TeamStrategy = "win_now" | "contend" | "rebuild";

export interface TeamPersonality {
  teamId: string;
  seasonId: string;
  strategy: TeamStrategy;
  aggressiveness: number; // 0.5 - 1.5
  riskTolerance: number; // 0.0 - 1.0
  criticalPositions: string[];
  highPriorityPositions: string[];
  mediumPriorityPositions: string[];
  weeklyBudget: number;
  budgetSpent: number;
  wishlist: string[]; // player IDs
  recentSignings: any[];
  lastActivityDate: Date | null;
}

interface TeamContext {
  lastSeasonWins: number;
  lastSeasonLosses: number;
  avgAge: number;
  talentLevel: number; // Average OVR
  capSpace: number;
  needs: TeamNeeds;
}

/**
 * Main function: Generate complete team personality based on context
 */
export async function generateTeamPersonality(
  supabase: any,
  teamId: string,
  seasonId: string,
): Promise<TeamPersonality> {
  // Gather context data
  const context = await gatherTeamContext(supabase, teamId, seasonId);

  // Calculate personality traits
  const strategy = determineStrategy(context);
  const aggressiveness = calculateAggressiveness(context, strategy);
  const riskTolerance = calculateRiskTolerance(context, strategy);
  const priorities = calculatePositionalPriorities(context.needs);
  const weeklyBudget = calculateWeeklyBudget(context.capSpace, strategy, aggressiveness);

  return {
    teamId,
    seasonId,
    strategy,
    aggressiveness,
    riskTolerance,
    criticalPositions: priorities.critical,
    highPriorityPositions: priorities.high,
    mediumPriorityPositions: priorities.medium,
    weeklyBudget,
    budgetSpent: 0,
    wishlist: [],
    recentSignings: [],
    lastActivityDate: null,
  };
}

/**
 * Gather all relevant context data for a team
 */
async function gatherTeamContext(
  supabase: any,
  teamId: string,
  seasonId: string,
): Promise<TeamContext> {
  // Get current season
  const { data: season } = await supabase
    .from("seasons")
    .select("year, franchise_id")
    .eq("id", seasonId)
    .single();

  if (!season) {
    throw new Error(`Season ${seasonId} not found`);
  }

  // Get last season stats (from previous year)
  const lastYear = season.year - 1;
  const { data: lastSeasonStats } = await supabase
    .from("team_standings")
    .select("wins, losses, ties")
    .eq("team_id", teamId)
    .eq("season_id", (
      await supabase
        .from("seasons")
        .select("id")
        .eq("franchise_id", season.franchise_id)
        .eq("year", lastYear)
        .single()
    )?.data?.id)
    .single();

  // Default to .500 record if first season or no data
  const lastSeasonWins = lastSeasonStats?.wins || 8;
  const lastSeasonLosses = lastSeasonStats?.losses || 9;

  // Get current roster
  const { data: roster } = await supabase
    .from("roster_spots")
    .select(`
      player_id,
      players!roster_spots_player_id_fkey(id, position),
      player_attributes!inner(age, overall_rating)
    `)
    .eq("season_id", seasonId)
    .eq("team_id", teamId)
    .eq("status", "active");

  // Calculate roster metrics
  let totalAge = 0;
  let totalOVR = 0;
  const rosterCount = roster?.length || 1;

  roster?.forEach((spot: any) => {
    const attrs = Array.isArray(spot.player_attributes)
      ? spot.player_attributes[0]
      : spot.player_attributes;
    totalAge += attrs?.age || 25;
    totalOVR += attrs?.overall_rating || 70;
  });

  const avgAge = totalAge / rosterCount;
  const talentLevel = totalOVR / rosterCount;

  // Get cap space
  const { data: finances } = await supabase
    .from("team_finances")
    .select("cap_space")
    .eq("team_id", teamId)
    .eq("season_id", seasonId)
    .single();

  const capSpace = finances?.cap_space || 50000000;

  // Get team needs
  const needs = await assessTeamNeeds(supabase, teamId, seasonId);

  return {
    lastSeasonWins,
    lastSeasonLosses,
    avgAge,
    talentLevel,
    capSpace,
    needs,
  };
}

/**
 * Determine team strategy based on performance and roster composition
 */
function determineStrategy(context: TeamContext): TeamStrategy {
  const totalGames = context.lastSeasonWins + context.lastSeasonLosses;
  const winPct = context.lastSeasonWins / totalGames;

  // Strong team with young core -> Contend (sustainable winner)
  if (winPct > 0.6 && context.avgAge < 27 && context.talentLevel > 80) {
    return "contend";
  }

  // Playoff team with aging roster -> Win Now (championship window closing)
  if (winPct > 0.55 && context.avgAge > 28 && context.talentLevel > 78) {
    return "win_now";
  }

  // Bad record OR low talent -> Rebuild
  if (winPct < 0.4 || context.talentLevel < 72) {
    return "rebuild";
  }

  // Borderline cases -> Contend (try to build sustainably)
  return "contend";
}

/**
 * Calculate aggressiveness based on strategy, cap space, and needs
 */
function calculateAggressiveness(
  context: TeamContext,
  strategy: TeamStrategy,
): number {
  let score = 1.0; // Base: 1.0 = average

  // Cap space influence: More money = more aggressive
  if (context.capSpace > 80000000) {
    score += 0.2;
  } else if (context.capSpace > 60000000) {
    score += 0.1;
  } else if (context.capSpace < 30000000) {
    score -= 0.15;
  }

  // Strategy influence
  if (strategy === "win_now") {
    score += 0.3; // Win-now teams overpay for missing pieces
  } else if (strategy === "rebuild") {
    score -= 0.2; // Rebuild teams bargain hunt
  }

  // Recent success breeds confidence
  const winPct = context.lastSeasonWins / (context.lastSeasonWins + context.lastSeasonLosses);
  if (winPct > 0.65) {
    score += 0.1;
  }

  // Critical needs = desperation = more aggressive
  const criticalNeeds = Object.values(context.needs).filter(
    (need) => need.urgency > 80,
  ).length;
  score += criticalNeeds * 0.05;

  // Clamp to valid range
  return Math.max(0.5, Math.min(1.5, score));
}

/**
 * Calculate risk tolerance based on team situation
 */
function calculateRiskTolerance(
  context: TeamContext,
  strategy: TeamStrategy,
): number {
  let score = 0.5; // Base: 0.5 = balanced

  // Young teams can afford risk
  if (context.avgAge < 26) {
    score += 0.3;
  } else if (context.avgAge > 29) {
    score -= 0.2; // Aging teams want proven players
  }

  // Win-now teams want guaranteed production (less risk)
  if (strategy === "win_now") {
    score -= 0.2;
  }

  // Rebuild teams should take chances on upside
  if (strategy === "rebuild") {
    score += 0.2;
  }

  // Desperate situations = more willing to gamble
  const winPct = context.lastSeasonWins / (context.lastSeasonWins + context.lastSeasonLosses);
  if (winPct < 0.3) {
    score += 0.15;
  }

  // High talent teams can be more conservative
  if (context.talentLevel > 82) {
    score -= 0.1;
  }

  // Clamp to valid range
  return Math.max(0.2, Math.min(0.9, score));
}

/**
 * Calculate positional priorities based on team needs
 */
function calculatePositionalPriorities(needs: TeamNeeds): {
  critical: string[];
  high: string[];
  medium: string[];
} {
  const needsArray = Object.entries(needs).map(([position, data]) => ({
    position,
    urgency: data.urgency,
  }));

  // Sort by urgency
  needsArray.sort((a, b) => b.urgency - a.urgency);

  return {
    critical: needsArray.filter((n) => n.urgency > 75).map((n) => n.position),
    high: needsArray
      .filter((n) => n.urgency > 50 && n.urgency <= 75)
      .map((n) => n.position),
    medium: needsArray
      .filter((n) => n.urgency > 25 && n.urgency <= 50)
      .map((n) => n.position),
  };
}

/**
 * Calculate weekly budget allocation
 */
function calculateWeeklyBudget(
  capSpace: number,
  strategy: TeamStrategy,
  aggressiveness: number,
): number {
  // Base: Spread cap space over ~20 weeks of FA period
  let weeklyAmount = capSpace / 20;

  // Strategy adjustments
  if (strategy === "win_now") {
    weeklyAmount *= 1.5; // Spend faster
  } else if (strategy === "rebuild") {
    weeklyAmount *= 0.7; // Spend slower, wait for bargains
  }

  // Aggressiveness adjustments
  weeklyAmount *= aggressiveness;

  return Math.round(weeklyAmount);
}

/**
 * Save generated personality to database
 */
export async function saveTeamPersonality(
  supabase: any,
  personality: TeamPersonality,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("team_ai_state").insert({
    team_id: personality.teamId,
    season_id: personality.seasonId,
    strategy: personality.strategy,
    aggressiveness: personality.aggressiveness,
    risk_tolerance: personality.riskTolerance,
    critical_positions: personality.criticalPositions,
    high_priority_positions: personality.highPriorityPositions,
    medium_priority_positions: personality.mediumPriorityPositions,
    weekly_budget: personality.weeklyBudget,
    budget_spent: personality.budgetSpent,
    wishlist: personality.wishlist,
    recent_signings: personality.recentSignings,
    last_activity_date: personality.lastActivityDate,
  });

  if (error) {
    console.error("Error saving team personality:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Load team personality from database
 */
export async function loadTeamPersonality(
  supabase: any,
  teamId: string,
  seasonId: string,
): Promise<TeamPersonality | null> {
  const { data, error } = await supabase
    .from("team_ai_state")
    .select("*")
    .eq("team_id", teamId)
    .eq("season_id", seasonId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    teamId: data.team_id,
    seasonId: data.season_id,
    strategy: data.strategy,
    aggressiveness: parseFloat(data.aggressiveness),
    riskTolerance: parseFloat(data.risk_tolerance),
    criticalPositions: data.critical_positions || [],
    highPriorityPositions: data.high_priority_positions || [],
    mediumPriorityPositions: data.medium_priority_positions || [],
    weeklyBudget: data.weekly_budget,
    budgetSpent: data.budget_spent,
    wishlist: data.wishlist || [],
    recentSignings: data.recent_signings || [],
    lastActivityDate: data.last_activity_date ? new Date(data.last_activity_date) : null,
  };
}
