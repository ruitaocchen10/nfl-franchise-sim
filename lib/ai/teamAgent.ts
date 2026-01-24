/**
 * AI Team Agent
 * Autonomous agent that makes daily decisions for AI-controlled teams
 * Each team has its own personality and makes independent decisions
 */

import { loadTeamPersonality, type TeamPersonality } from "./personalityGenerator";
import { assessTeamNeeds, teamNeedsPosition, type TeamNeeds } from "./teamNeeds";
import { calculateOffseasonWeek } from "@/lib/season/calendarUtils";

export interface ContractOffer {
  teamId: string;
  playerId: string;
  freeAgentId: string;
  years: number;
  totalValue: number;
  guaranteedMoney: number;
  annualSalary: number;
  evaluationScore: number;
}

export interface AgentDecisionResult {
  success: boolean;
  offers: ContractOffer[];
  message?: string;
}

export class AITeamAgent {
  private personality: TeamPersonality;
  private supabase: any;
  private teamId: string;
  private seasonId: string;

  constructor(supabase: any, personality: TeamPersonality) {
    this.supabase = supabase;
    this.personality = personality;
    this.teamId = personality.teamId;
    this.seasonId = personality.seasonId;
  }

  /**
   * Main entry point: Process a day's worth of decisions
   */
  async processDay(currentDate: Date, phase: string): Promise<AgentDecisionResult> {
    // Check if team should be active today
    if (!this.shouldBeActiveToday(currentDate, phase)) {
      return { success: true, offers: [] };
    }

    // Make decisions based on phase
    switch (phase) {
      case "free_agency":
      case "draft":
      case "training_camp":
        return await this.handleFreeAgency(currentDate);

      default:
        return { success: true, offers: [] };
    }
  }

  /**
   * Determine if team should be active today based on personality
   */
  private shouldBeActiveToday(date: Date, phase: string): boolean {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Only active during market phases
    const activeMarketPhases = ["free_agency", "draft", "training_camp"];
    if (!activeMarketPhases.includes(phase)) {
      return false;
    }

    // Personality-based activity patterns
    const aggressiveness = this.personality.aggressiveness;

    // Very aggressive teams (>1.2): Active Mon-Fri
    if (aggressiveness > 1.2) {
      return [1, 2, 3, 4, 5].includes(dayOfWeek);
    }

    // Aggressive teams (>1.05): Active Mon/Wed/Thu/Fri
    if (aggressiveness > 1.05) {
      return [1, 3, 4, 5].includes(dayOfWeek);
    }

    // Conservative teams (<0.9): Active Mon/Thu only
    if (aggressiveness < 0.9) {
      return [1, 4].includes(dayOfWeek);
    }

    // Balanced teams: Mon/Wed/Fri
    return [1, 3, 5].includes(dayOfWeek);
  }

  /**
   * Handle free agency decision-making
   */
  private async handleFreeAgency(date: Date): Promise<AgentDecisionResult> {
    try {
      // 1. Identify potential targets
      const targets = await this.identifyTargets();

      if (targets.length === 0) {
        return { success: true, offers: [] };
      }

      // 2. Generate offers for targets
      const offers = await this.generateOffers(targets, date);

      // 3. Update state
      await this.updateState({ last_activity_date: date.toISOString() });

      return {
        success: true,
        offers,
        message: offers.length > 0 ? `${this.teamId}: Made ${offers.length} offer(s)` : undefined,
      };
    } catch (error) {
      console.error(`Error in team ${this.teamId} free agency:`, error);
      return {
        success: false,
        offers: [],
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Identify free agent targets based on needs, wishlist, and affordability
   */
  private async identifyTargets(): Promise<any[]> {
    // Get team needs
    const needs = await assessTeamNeeds(this.supabase, this.teamId, this.seasonId);

    // Get available free agents
    const { data: freeAgents } = await this.supabase
      .from("free_agents")
      .select(`
        *,
        players!free_agents_player_id_fkey(id, position)
      `)
      .eq("season_id", this.seasonId)
      .eq("status", "available");

    if (!freeAgents) {
      return [];
    }

    // Get player attributes
    const { data: attributes } = await this.supabase
      .from("player_attributes")
      .select("*")
      .eq("season_id", this.seasonId)
      .in(
        "player_id",
        freeAgents.map((fa: any) => fa.player_id),
      );

    const attributesMap = new Map(
      (attributes || []).map((attr: any) => [attr.player_id, attr]),
    );

    // Get current cap space
    const { data: finances } = await this.supabase
      .from("team_finances")
      .select("cap_space")
      .eq("team_id", this.teamId)
      .eq("season_id", this.seasonId)
      .single();

    const availableCapSpace = finances?.cap_space || 0;
    const remainingBudget = this.personality.weeklyBudget - (this.personality.budgetSpent || 0);

    // Filter and score free agents
    const scoredTargets = freeAgents
      .map((fa: any) => {
        const attr = attributesMap.get(fa.player_id);
        const position = fa.players.position;
        const positionNeed = teamNeedsPosition(needs, position);

        // Skip if position not needed
        if (!positionNeed.needed) {
          return null;
        }

        // Skip if can't afford
        const estimatedAnnualCost = fa.market_value / 3;
        if (estimatedAnnualCost > availableCapSpace || fa.market_value > remainingBudget * 3) {
          return null;
        }

        // Calculate target score
        let score = positionNeed.urgency * 0.6; // Base from urgency

        // Player quality bonus
        const overallRating = attr?.overall_rating || 70;
        const qualityScore = (overallRating - 60) * 0.75;
        score += Math.max(0, Math.min(30, qualityScore));

        // Age preference based on risk tolerance
        const age = attr?.age || 25;
        if (this.personality.riskTolerance > 0.6) {
          // High risk tolerance = prefer younger/upside
          if (age < 27) score += 10;
        } else {
          // Low risk tolerance = prefer proven veterans
          if (age >= 27 && age <= 30) score += 10;
          if (age > 31) score -= 5;
        }

        // Wishlist bonus
        if (this.personality.wishlist.includes(fa.player_id)) {
          score += 20;
        }

        return {
          ...fa,
          position,
          overallRating,
          age,
          targetScore: Math.max(0, Math.min(100, score)),
        };
      })
      .filter((target) => target !== null && target.targetScore > 30);

    // Sort by score and return top targets
    scoredTargets.sort((a: any, b: any) => b.targetScore - a.targetScore);

    // Limit number of targets based on aggressiveness
    const maxTargets = Math.ceil(this.personality.aggressiveness * 5);
    return scoredTargets.slice(0, maxTargets);
  }

  /**
   * Generate contract offers for identified targets
   */
  private async generateOffers(targets: any[], date: Date): Promise<ContractOffer[]> {
    const offers: ContractOffer[] = [];

    // Get season year for week calculation
    const { data: season } = await this.supabase
      .from("seasons")
      .select("year")
      .eq("id", this.seasonId)
      .single();

    const offseasonWeek = calculateOffseasonWeek(date, season?.year || 2024);

    // Get current cap space
    const { data: finances } = await this.supabase
      .from("team_finances")
      .select("cap_space")
      .eq("team_id", this.teamId)
      .eq("season_id", this.seasonId)
      .single();

    const capSpace = finances?.cap_space || 0;

    // Get team needs for position urgency
    const needs = await assessTeamNeeds(this.supabase, this.teamId, this.seasonId);

    for (const target of targets) {
      const positionNeed = teamNeedsPosition(needs, target.position);

      // Calculate offer value
      const offerDetails = this.calculateOfferValue(
        target.market_value,
        capSpace,
        positionNeed.urgency,
        offseasonWeek,
      );

      // Check if we can afford annual salary
      if (offerDetails.annualSalary > capSpace) {
        continue;
      }

      offers.push({
        teamId: this.teamId,
        playerId: target.player_id,
        freeAgentId: target.id,
        years: offerDetails.years,
        totalValue: offerDetails.totalValue,
        guaranteedMoney: offerDetails.guaranteedMoney,
        annualSalary: offerDetails.annualSalary,
        evaluationScore: target.targetScore,
      });
    }

    return offers;
  }

  /**
   * Calculate contract offer value based on personality and context
   */
  private calculateOfferValue(
    marketValue: number,
    capSpace: number,
    positionUrgency: number,
    offseasonWeek: number,
  ): {
    totalValue: number;
    years: number;
    guaranteedMoney: number;
    annualSalary: number;
  } {
    let valueMultiplier = this.personality.aggressiveness;

    // Position urgency adjustments
    if (positionUrgency >= 75) {
      valueMultiplier *= 1.15; // Critical need - overpay
    } else if (positionUrgency >= 50) {
      valueMultiplier *= 1.05; // High need - pay market rate
    } else if (positionUrgency < 25) {
      valueMultiplier *= 0.9; // Low need - bargain hunt
    }

    // Strategy adjustments
    if (this.personality.strategy === "win_now") {
      valueMultiplier *= 1.1; // Win-now teams overpay
    } else if (this.personality.strategy === "rebuild") {
      valueMultiplier *= 0.95; // Rebuild teams bargain hunt
    }

    // Week-based pricing (prices drop as FA period progresses)
    if (offseasonWeek <= 2) {
      valueMultiplier *= 1.05; // Early premium
    } else if (offseasonWeek >= 10) {
      valueMultiplier *= 0.85; // Late bargains
    }

    // Calculate total value
    const totalValue = Math.round(marketValue * valueMultiplier);

    // Determine contract length
    let years = 3; // Default
    if (marketValue > 20000000) {
      years = 4; // Star players
    } else if (marketValue < 5000000) {
      years = 2; // Depth players
    }

    // Guaranteed money (varies by risk tolerance)
    const guaranteedPct = 0.4 + this.personality.riskTolerance * 0.3; // 40-70%
    const guaranteedMoney = Math.round(totalValue * guaranteedPct);

    const annualSalary = Math.round(totalValue / years);

    return {
      totalValue,
      years,
      guaranteedMoney,
      annualSalary,
    };
  }

  /**
   * Update team AI state in database
   */
  private async updateState(updates: Partial<any>): Promise<void> {
    await this.supabase
      .from("team_ai_state")
      .update(updates)
      .eq("team_id", this.teamId)
      .eq("season_id", this.seasonId);
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return Math.max(0, this.personality.weeklyBudget - (this.personality.budgetSpent || 0));
  }

  /**
   * Static factory method: Load agent from database
   */
  static async load(
    supabase: any,
    teamId: string,
    seasonId: string,
  ): Promise<AITeamAgent | null> {
    const personality = await loadTeamPersonality(supabase, teamId, seasonId);
    if (!personality) {
      return null;
    }
    return new AITeamAgent(supabase, personality);
  }
}
