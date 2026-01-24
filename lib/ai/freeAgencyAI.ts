/**
 * AI Free Agency Logic
 * Handles AI team decision-making for free agent signings
 * Implements weighted evaluation: Money (70%), Team Quality (15%), Role (10%), Location (5%)
 */

import { assessTeamNeeds, teamNeedsPosition, type TeamNeeds } from "./teamNeeds";

interface FreeAgentEvaluation {
  freeAgentId: string;
  playerId: string;
  position: string;
  marketValue: number;
  overallRating: number;
  age: number;
  tier: 1 | 2 | 3 | 4;
}

interface FreeAgentTier {
  tier: 1 | 2 | 3 | 4;
  name: string;
  minOverall: number;
  maxOverall: number;
  signProbability: { [week: number]: number }; // % chance to sign in given week
  offerMultiplier: { [week: number]: number }; // Offer value multiplier by week
}

interface ContractOffer {
  teamId: string;
  playerId: string;
  freeAgentId: string;
  years: number;
  totalValue: number;
  guaranteedMoney: number;
  annualSalary: number;
  evaluationScore: number; // How much team wants this player (0-100)
}

interface PlayerDecision {
  playerId: string;
  freeAgentId: string;
  chosenTeamId: string;
  chosenOffer: ContractOffer;
  decisionScore: number;
  reason: string;
}

type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Free agent tier definitions
 * Determines signing timeline and offer aggressiveness
 * Weeks 1-6: Main FA period
 * Week 7: Post-draft wave
 * Weeks 8-20: Training camp signings (diminishing)
 */
const FREE_AGENT_TIERS: FreeAgentTier[] = [
  {
    tier: 1,
    name: "Elite",
    minOverall: 85,
    maxOverall: 99,
    // Elite players sign early, but some may wait for best offer
    signProbability: {
      1: 0.95, 2: 0.90, 3: 0.70, 4: 0.50, // Main FA
      5: 0.40, 6: 0.30, 7: 0.25, // Late FA, post-draft
      8: 0.15, 10: 0.10, 12: 0.08, 15: 0.05, // Camp
    },
    offerMultiplier: {
      1: 1.25, 2: 1.15, 3: 1.10, 4: 1.05, // Premium early
      5: 1.00, 6: 0.98, 7: 0.95, // Declining
      8: 0.90, 10: 0.85, 15: 0.80, // Bargains late
    },
  },
  {
    tier: 2,
    name: "Quality",
    minOverall: 78,
    maxOverall: 84,
    signProbability: {
      1: 0.70, 2: 0.85, 3: 0.75, 4: 0.60, // Main FA
      5: 0.55, 6: 0.50, 7: 0.60, // Post-draft bump
      8: 0.40, 10: 0.30, 12: 0.25, 15: 0.15, // Camp
    },
    offerMultiplier: {
      1: 1.10, 2: 1.05, 3: 1.00, 4: 0.95,
      5: 0.93, 6: 0.90, 7: 0.88,
      8: 0.85, 10: 0.82, 15: 0.78,
    },
  },
  {
    tier: 3,
    name: "Solid",
    minOverall: 72,
    maxOverall: 77,
    signProbability: {
      1: 0.40, 2: 0.60, 3: 0.70, 4: 0.65, // Main FA
      5: 0.60, 6: 0.65, 7: 0.70, // Peak mid-period
      8: 0.55, 10: 0.45, 12: 0.35, 15: 0.25, // Camp
    },
    offerMultiplier: {
      1: 1.00, 2: 0.95, 3: 0.90, 4: 0.85,
      5: 0.83, 6: 0.80, 7: 0.78,
      8: 0.75, 10: 0.72, 15: 0.70,
    },
  },
  {
    tier: 4,
    name: "Depth",
    minOverall: 65,
    maxOverall: 71,
    signProbability: {
      1: 0.20, 2: 0.35, 3: 0.50, 4: 0.55, // Main FA
      5: 0.60, 6: 0.65, 7: 0.65, // Continue steady
      8: 0.60, 10: 0.55, 12: 0.50, 15: 0.40, 20: 0.30, // Camp
    },
    offerMultiplier: {
      1: 0.95, 2: 0.90, 3: 0.85, 4: 0.80,
      5: 0.78, 6: 0.75, 7: 0.73,
      8: 0.70, 10: 0.68, 15: 0.65, 20: 0.60,
    },
  },
];

/**
 * Classify a free agent into a tier based on overall rating
 */
function classifyFreeAgentTier(overallRating: number): 1 | 2 | 3 | 4 {
  for (const tierDef of FREE_AGENT_TIERS) {
    if (
      overallRating >= tierDef.minOverall &&
      overallRating <= tierDef.maxOverall
    ) {
      return tierDef.tier;
    }
  }
  return 4; // Default to lowest tier
}

/**
 * Get tier configuration
 */
function getTierConfig(tier: 1 | 2 | 3 | 4): FreeAgentTier {
  return FREE_AGENT_TIERS.find((t) => t.tier === tier) || FREE_AGENT_TIERS[3];
}

/**
 * Get team's current standing/quality for the season
 */
async function getTeamQuality(
  supabase: any,
  teamId: string,
  seasonId: string,
): Promise<number> {
  const { data: standings } = await supabase
    .from("team_standings")
    .select("wins, losses, ties")
    .eq("team_id", teamId)
    .eq("season_id", seasonId)
    .single();

  if (!standings) return 50; // Default neutral quality

  const totalGames = standings.wins + standings.losses + standings.ties;
  if (totalGames === 0) return 50;

  const winPct = (standings.wins + standings.ties * 0.5) / totalGames;

  // Convert to 0-100 scale
  return Math.round(winPct * 100);
}

/**
 * Calculate contract offer value based on market value and team factors
 */
function calculateOfferValue(
  marketValue: number,
  capSpace: number,
  positionUrgency: number,
  teamQuality: number,
  difficulty: DifficultyLevel = "medium",
  weekMultiplier: number = 1.0,
): { totalValue: number; years: number; guaranteedMoney: number } {
  // Base multiplier on position urgency
  let valueMultiplier = 1.0;

  if (positionUrgency >= 75) {
    // Critical need - overpay
    valueMultiplier = 1.15;
  } else if (positionUrgency >= 50) {
    // High need - pay market rate
    valueMultiplier = 1.05;
  } else if (positionUrgency < 25) {
    // Low need - bargain hunt
    valueMultiplier = 0.9;
  }

  // Difficulty adjustments per requirements
  if (difficulty === "easy") {
    valueMultiplier *= 1.2; // AI more generous
  } else if (difficulty === "hard") {
    valueMultiplier *= 0.9; // AI more stingy
  }

  // Bad teams may need to overpay
  if (teamQuality < 40) {
    valueMultiplier *= 1.1;
  }

  // Apply week multiplier (from tier config)
  valueMultiplier *= weekMultiplier;

  // Calculate total value
  const totalValue = Math.round(marketValue * valueMultiplier);

  // Determine contract length (2-5 years typical)
  let years = 3;
  if (marketValue > 20000000) {
    years = 4; // Star players get longer deals
  } else if (marketValue < 5000000) {
    years = 2; // Cheaper players get shorter deals
  }

  // Guaranteed money (40-70% of total)
  const guaranteedPct = 0.4 + Math.random() * 0.3;
  const guaranteedMoney = Math.round(totalValue * guaranteedPct);

  return {
    totalValue,
    years,
    guaranteedMoney,
  };
}

/**
 * Evaluate a free agent for a specific team
 * Returns evaluation score (0-100) indicating how badly team wants this player
 */
function evaluateFreeAgentForTeam(
  freeAgent: FreeAgentEvaluation,
  teamNeeds: TeamNeeds,
  teamQuality: number,
  capSpace: number,
): number {
  // Check position need
  const positionNeed = teamNeedsPosition(teamNeeds, freeAgent.position);

  if (!positionNeed.needed) {
    return 0; // Don't pursue players at filled positions
  }

  // Base score from position urgency (0-60)
  let score = positionNeed.urgency * 0.6;

  // Player quality bonus (0-30)
  const qualityScore = (freeAgent.overallRating - 60) * 0.75;
  score += Math.max(0, Math.min(30, qualityScore));

  // Age factor (prefer younger players)
  if (freeAgent.age < 27) {
    score += 10;
  } else if (freeAgent.age > 32) {
    score -= 10;
  }

  // Cap space consideration
  const annualCost = freeAgent.marketValue / 3; // Estimate 3-year deal
  if (annualCost > capSpace * 0.5) {
    score *= 0.5; // Too expensive, reduce interest
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate AI team offers for all free agents
 */
export async function generateAIOffers(
  supabase: any,
  seasonId: string,
  difficulty: DifficultyLevel = "medium",
  maxOffersPerTeam: number = 5,
): Promise<ContractOffer[]> {
  console.log("🤖 Generating AI free agency offers...");

  // Get all AI-controlled teams (exclude user's team)
  const { data: teams } = await supabase.from("teams").select("id");

  if (!teams) {
    console.error("No teams found");
    return [];
  }

  // Get all available free agents
  const { data: freeAgents } = await supabase
    .from("free_agents")
    .select(
      `
      *,
      players!free_agents_player_id_fkey(id, position)
    `,
    )
    .eq("season_id", seasonId)
    .eq("status", "available");

  if (!freeAgents || freeAgents.length === 0) {
    console.log("No free agents available");
    return [];
  }

  // Get player attributes for all free agents
  const { data: attributes } = await supabase
    .from("player_attributes")
    .select("*")
    .eq("season_id", seasonId)
    .in(
      "player_id",
      freeAgents.map((fa: any) => fa.player_id),
    );

  const attributesMap = new Map(
    (attributes || []).map((attr: any) => [attr.player_id, attr]),
  );

  // Convert to evaluation objects
  const freeAgentEvaluations: FreeAgentEvaluation[] = freeAgents.map(
    (fa: any) => {
      const attr = attributesMap.get(fa.player_id);
      const overallRating = attr?.overall_rating || 70;
      return {
        freeAgentId: fa.id,
        playerId: fa.player_id,
        position: fa.players.position,
        marketValue: fa.market_value,
        overallRating,
        age: attr?.age || 25,
        tier: classifyFreeAgentTier(overallRating),
      };
    },
  );

  const allOffers: ContractOffer[] = [];
  let totalOffersGenerated = 0;

  // For each team, evaluate free agents and make offers
  for (const team of teams) {
    // Get team needs
    const teamNeeds = await assessTeamNeeds(supabase, team.id, seasonId);

    // Get team quality
    const teamQuality = await getTeamQuality(supabase, team.id, seasonId);

    // Get cap space
    const { data: finances } = await supabase
      .from("team_finances")
      .select("cap_space")
      .eq("team_id", team.id)
      .eq("season_id", seasonId)
      .single();

    const capSpace = finances?.cap_space || 0;

    if (capSpace < 5000000) {
      // Team broke, skip
      continue;
    }

    // Evaluate all free agents for this team
    const evaluations = freeAgentEvaluations
      .map((fa) => ({
        ...fa,
        evaluationScore: evaluateFreeAgentForTeam(
          fa,
          teamNeeds,
          teamQuality,
          capSpace,
        ),
      }))
      .filter((fa) => fa.evaluationScore > 30) // Only pursue if score > 30
      .sort((a, b) => b.evaluationScore - a.evaluationScore)
      .slice(0, maxOffersPerTeam); // Top N targets

    // Generate offers for top targets
    for (const evaluation of evaluations) {
      const positionNeed = teamNeedsPosition(teamNeeds, evaluation.position);

      const offer = calculateOfferValue(
        evaluation.marketValue,
        capSpace,
        positionNeed.urgency,
        teamQuality,
        difficulty,
      );

      // Check if team can afford annual salary
      if (offer.totalValue / offer.years > capSpace) {
        continue; // Skip if too expensive
      }

      allOffers.push({
        teamId: team.id,
        playerId: evaluation.playerId,
        freeAgentId: evaluation.freeAgentId,
        years: offer.years,
        totalValue: offer.totalValue,
        guaranteedMoney: offer.guaranteedMoney,
        annualSalary: Math.round(offer.totalValue / offer.years),
        evaluationScore: evaluation.evaluationScore,
      });

      totalOffersGenerated++;
    }
  }

  console.log(`   ✅ Generated ${totalOffersGenerated} offers from ${teams.length} teams`);

  return allOffers;
}

/**
 * Player evaluates offers using weighted system
 * Money (70%), Team Quality (15%), Role (10%), Location (5%)
 */
function evaluateOfferForPlayer(
  offer: ContractOffer,
  teamQuality: number,
  marketValue: number,
): number {
  // Money factor (70%) - How does offer compare to market value?
  const moneyRatio = offer.totalValue / marketValue;
  const moneyScore = Math.min(100, moneyRatio * 70); // Cap at 70 points

  // Team quality factor (15%) - Better teams are more attractive
  const qualityScore = (teamQuality / 100) * 15;

  // Role factor (10%) - Higher evaluation score = better role opportunity
  const roleScore = (offer.evaluationScore / 100) * 10;

  // Location factor (5%) - Random preference
  const locationScore = Math.random() * 5;

  const totalScore = moneyScore + qualityScore + roleScore + locationScore;

  return totalScore;
}

/**
 * Process player decisions - each free agent chooses best offer
 */
export async function processPlayerDecisions(
  supabase: any,
  offers: ContractOffer[],
  seasonId: string,
): Promise<PlayerDecision[]> {
  console.log("🎯 Processing player decisions...");

  // Group offers by player
  const offersByPlayer = new Map<string, ContractOffer[]>();

  for (const offer of offers) {
    if (!offersByPlayer.has(offer.playerId)) {
      offersByPlayer.set(offer.playerId, []);
    }
    offersByPlayer.get(offer.playerId)!.push(offer);
  }

  const decisions: PlayerDecision[] = [];

  // For each player with offers, choose the best one
  for (const [playerId, playerOffers] of offersByPlayer) {
    if (playerOffers.length === 0) continue;

    // Get market value for this player
    const { data: freeAgent } = await supabase
      .from("free_agents")
      .select("market_value")
      .eq("player_id", playerId)
      .eq("season_id", seasonId)
      .single();

    const marketValue = freeAgent?.market_value || 5000000;

    // Evaluate each offer
    const evaluatedOffers = await Promise.all(
      playerOffers.map(async (offer) => {
        const teamQuality = await getTeamQuality(
          supabase,
          offer.teamId,
          seasonId,
        );
        const decisionScore = evaluateOfferForPlayer(
          offer,
          teamQuality,
          marketValue,
        );

        return {
          ...offer,
          decisionScore,
          teamQuality,
        };
      }),
    );

    // Choose best offer
    const bestOffer = evaluatedOffers.reduce((best, current) =>
      current.decisionScore > best.decisionScore ? current : best,
    );

    // Determine reason
    let reason = "best overall offer";
    if (bestOffer.totalValue / marketValue > 1.2) {
      reason = "significantly overpaid";
    } else if (bestOffer.teamQuality > 70) {
      reason = "winning team";
    } else if (bestOffer.evaluationScore > 80) {
      reason = "starting role opportunity";
    }

    decisions.push({
      playerId: bestOffer.playerId,
      freeAgentId: bestOffer.freeAgentId,
      chosenTeamId: bestOffer.teamId,
      chosenOffer: bestOffer,
      decisionScore: bestOffer.decisionScore,
      reason,
    });
  }

  console.log(`   ✅ ${decisions.length} players made decisions`);

  return decisions;
}

/**
 * Execute signings - create contracts and update database
 */
export async function executeAISignings(
  supabase: any,
  decisions: PlayerDecision[],
  seasonId: string,
): Promise<{ signed: number; failed: number }> {
  console.log("✍️  Executing AI signings...");

  let signed = 0;
  let failed = 0;

  for (const decision of decisions) {
    const offer = decision.chosenOffer;

    try {
      // Create contract
      const { error: contractError } = await supabase.from("contracts").insert({
        player_id: decision.playerId,
        team_id: decision.chosenTeamId,
        season_id: seasonId,
        total_value: offer.totalValue,
        years_remaining: offer.years,
        annual_salary: offer.annualSalary,
        guaranteed_money: offer.guaranteedMoney,
        signing_bonus: Math.round(offer.guaranteedMoney * 0.5),
        cap_hit: offer.annualSalary,
      });

      if (contractError) {
        console.error(
          `Failed to create contract for player ${decision.playerId}:`,
          contractError,
        );
        failed++;
        continue;
      }

      // Add to roster
      const { error: rosterError } = await supabase
        .from("roster_spots")
        .insert({
          season_id: seasonId,
          team_id: decision.chosenTeamId,
          player_id: decision.playerId,
          status: "active",
          depth_position: 99, // Bottom of depth chart initially
        });

      if (rosterError) {
        console.error(
          `Failed to add player ${decision.playerId} to roster:`,
          rosterError,
        );
        failed++;
        continue;
      }

      // Update free agent status
      await supabase
        .from("free_agents")
        .update({
          status: "signed",
          signed_team_id: decision.chosenTeamId,
          signed_at: new Date().toISOString(),
        })
        .eq("id", decision.freeAgentId);

      // Update team finances
      const { data: finances } = await supabase
        .from("team_finances")
        .select("cap_space")
        .eq("team_id", decision.chosenTeamId)
        .eq("season_id", seasonId)
        .single();

      if (finances) {
        const newCapSpace = finances.cap_space - offer.annualSalary;
        await supabase
          .from("team_finances")
          .update({ cap_space: newCapSpace })
          .eq("team_id", decision.chosenTeamId)
          .eq("season_id", seasonId);
      }

      signed++;
    } catch (error) {
      console.error(`Error signing player ${decision.playerId}:`, error);
      failed++;
    }
  }

  console.log(`   ✅ Signed: ${signed}, Failed: ${failed}`);

  return { signed, failed };
}

/**
 * Main function - Run AI free agency process (legacy batch mode)
 * @deprecated Use runWeeklyAIFreeAgency for phased free agency
 */
export async function runAIFreeAgency(
  supabase: any,
  seasonId: string,
  difficulty: DifficultyLevel = "medium",
): Promise<{
  success: boolean;
  offersGenerated: number;
  playersSigned: number;
  error?: string;
}> {
  try {
    console.log("\n🤖 Starting AI Free Agency Process...\n");

    // Step 1: Generate offers from all AI teams
    const offers = await generateAIOffers(supabase, seasonId, difficulty);

    if (offers.length === 0) {
      return {
        success: true,
        offersGenerated: 0,
        playersSigned: 0,
      };
    }

    // Step 2: Players evaluate and choose offers
    const decisions = await processPlayerDecisions(supabase, offers, seasonId);

    // Step 3: Execute signings
    const results = await executeAISignings(supabase, decisions, seasonId);

    console.log("\n✅ AI Free Agency Complete!\n");

    return {
      success: true,
      offersGenerated: offers.length,
      playersSigned: results.signed,
    };
  } catch (error) {
    console.error("Error in AI free agency:", error);
    return {
      success: false,
      offersGenerated: 0,
      playersSigned: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Run weekly AI free agency process (phased/realistic)
 * Should be called each week during the free_agency phase
 */
export async function runWeeklyAIFreeAgency(
  supabase: any,
  seasonId: string,
  freeAgencyWeek: number, // Which week of free agency (1-4+)
  difficulty: DifficultyLevel = "medium",
): Promise<{
  success: boolean;
  playersSigned: number;
  byTier: { [key: number]: number };
  message: string;
  error?: string;
}> {
  try {
    console.log(`\n🤖 Free Agency Week ${freeAgencyWeek} - AI Signings\n`);

    // Get all available free agents with their attributes
    const { data: freeAgents } = await supabase
      .from("free_agents")
      .select(
        `
        *,
        players!free_agents_player_id_fkey(id, position)
      `,
      )
      .eq("season_id", seasonId)
      .eq("status", "available");

    if (!freeAgents || freeAgents.length === 0) {
      return {
        success: true,
        playersSigned: 0,
        byTier: {},
        message: "No available free agents",
      };
    }

    // Get player attributes
    const { data: attributes } = await supabase
      .from("player_attributes")
      .select("*")
      .eq("season_id", seasonId)
      .in(
        "player_id",
        freeAgents.map((fa: any) => fa.player_id),
      );

    const attributesMap = new Map(
      (attributes || []).map((attr: any) => [attr.player_id, attr]),
    );

    // Classify free agents by tier
    const tieredFreeAgents = freeAgents
      .map((fa: any) => {
        const attr = attributesMap.get(fa.player_id);
        const overallRating = attr?.overall_rating || 70;
        const tier = classifyFreeAgentTier(overallRating);
        const tierConfig = getTierConfig(tier);

        return {
          freeAgentId: fa.id,
          playerId: fa.player_id,
          position: fa.players.position,
          marketValue: fa.market_value,
          overallRating,
          age: attr?.age || 25,
          tier,
          tierConfig,
        };
      })
      .filter((fa) => {
        // Only process players whose tier should sign this week
        const signProb = fa.tierConfig.signProbability[freeAgencyWeek] || 0.3;
        return Math.random() < signProb;
      });

    if (tieredFreeAgents.length === 0) {
      return {
        success: true,
        playersSigned: 0,
        byTier: {},
        message: `Week ${freeAgencyWeek}: No players signed`,
      };
    }

    console.log(
      `   Processing ${tieredFreeAgents.length} free agents for Week ${freeAgencyWeek}`,
    );

    // Sort by tier (elite first) then by overall rating
    tieredFreeAgents.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return b.overallRating - a.overallRating;
    });

    // Generate offers for these players
    const { data: teams } = await supabase.from("teams").select("id");
    if (!teams) {
      return {
        success: false,
        playersSigned: 0,
        byTier: {},
        message: "Failed to load teams",
      };
    }

    const allOffers: ContractOffer[] = [];

    for (const team of teams) {
      const teamNeeds = await assessTeamNeeds(supabase, team.id, seasonId);
      const teamQuality = await getTeamQuality(supabase, team.id, seasonId);

      const { data: finances } = await supabase
        .from("team_finances")
        .select("cap_space")
        .eq("team_id", team.id)
        .eq("season_id", seasonId)
        .single();

      const capSpace = finances?.cap_space || 0;
      if (capSpace < 3000000) continue; // Skip broke teams

      // Diminishing activity - teams pursue fewer targets as weeks progress
      let maxTargets = 5; // Default for early weeks
      if (freeAgencyWeek >= 15) {
        maxTargets = 1; // Very selective late
      } else if (freeAgencyWeek >= 10) {
        maxTargets = 2; // Limited mid-camp
      } else if (freeAgencyWeek >= 7) {
        maxTargets = 3; // Post-draft/early camp
      }

      // Evaluate and make offers for top targets
      const targets = tieredFreeAgents
        .map((fa) => ({
          ...fa,
          evaluationScore: evaluateFreeAgentForTeam(
            fa,
            teamNeeds,
            teamQuality,
            capSpace,
          ),
        }))
        .filter((fa) => fa.evaluationScore > 30)
        .sort((a, b) => b.evaluationScore - a.evaluationScore)
        .slice(0, maxTargets);

      for (const target of targets) {
        const positionNeed = teamNeedsPosition(teamNeeds, target.position);
        const weekMultiplier =
          target.tierConfig.offerMultiplier[freeAgencyWeek] || 1.0;

        const offer = calculateOfferValue(
          target.marketValue,
          capSpace,
          positionNeed.urgency,
          teamQuality,
          difficulty,
          weekMultiplier,
        );

        if (offer.totalValue / offer.years <= capSpace) {
          allOffers.push({
            teamId: team.id,
            playerId: target.playerId,
            freeAgentId: target.freeAgentId,
            years: offer.years,
            totalValue: offer.totalValue,
            guaranteedMoney: offer.guaranteedMoney,
            annualSalary: Math.round(offer.totalValue / offer.years),
            evaluationScore: target.evaluationScore,
          });
        }
      }
    }

    console.log(`   Generated ${allOffers.length} offers`);

    // Players decide
    const decisions = await processPlayerDecisions(
      supabase,
      allOffers,
      seasonId,
    );

    // Execute signings
    const results = await executeAISignings(supabase, decisions, seasonId);

    // Count by tier
    const byTier: { [key: number]: number } = {};
    for (const decision of decisions) {
      const fa = tieredFreeAgents.find(
        (f) => f.playerId === decision.playerId,
      );
      if (fa) {
        byTier[fa.tier] = (byTier[fa.tier] || 0) + 1;
      }
    }

    const message = `Week ${freeAgencyWeek}: ${results.signed} players signed${byTier[1] ? ` (${byTier[1]} elite)` : ""}`;

    console.log(`\n✅ ${message}\n`);

    return {
      success: true,
      playersSigned: results.signed,
      byTier,
      message,
    };
  } catch (error) {
    console.error("Error in weekly AI free agency:", error);
    return {
      success: false,
      playersSigned: 0,
      byTier: {},
      message: "Error during free agency",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
