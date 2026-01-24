/**
 * Player Progression Engine
 * Handles age-based player development, regression, and retirements
 */

import type { Database } from "@/lib/types/database.types";

type PlayerAttributes =
  Database["public"]["Tables"]["player_attributes"]["Row"];
type SeasonStats = Database["public"]["Tables"]["season_stats"]["Row"];
type DevelopmentTrait = "superstar" | "star" | "normal" | "slow";

interface ProgressionResult {
  playerId: string;
  oldOverall: number;
  newOverall: number;
  change: number;
  retired: boolean;
  reason?: string;
}

/**
 * Calculate progression change based on age and development trait
 */
function calculateAgeProgression(
  age: number,
  trait: DevelopmentTrait,
): number {
  // Base progression by age bracket
  let baseChange = 0;

  if (age < 23) {
    // Young players improve rapidly
    const traitBonus = { superstar: 5, star: 4, normal: 3, slow: 2 };
    baseChange = traitBonus[trait];
  } else if (age >= 23 && age <= 26) {
    // Prime development years
    const traitBonus = { superstar: 3, star: 2, normal: 1, slow: 0 };
    baseChange = traitBonus[trait];
  } else if (age >= 27 && age <= 29) {
    // Maintenance years
    const traitBonus = { superstar: 1, star: 0, normal: 0, slow: -1 };
    baseChange = traitBonus[trait];
  } else if (age >= 30 && age <= 32) {
    // Early decline
    const traitBonus = { superstar: 0, star: -1, normal: -1, slow: -2 };
    baseChange = traitBonus[trait];
  } else {
    // Age 33+, steep decline
    const traitBonus = { superstar: -2, star: -3, normal: -4, slow: -5 };
    baseChange = traitBonus[trait];
  }

  return baseChange;
}

/**
 * Calculate performance-based modifiers from season stats
 */
function calculatePerformanceModifier(
  position: string,
  stats: SeasonStats | null,
): number {
  if (!stats || stats.games_played < 8) {
    // Didn't play enough to earn bonus/penalty
    return 0;
  }

  // Position-specific thresholds for "good" and "poor" seasons
  if (position === "QB") {
    const yardsPerGame = stats.pass_yards / stats.games_played;
    const tdIntRatio =
      stats.interceptions > 0 ? stats.pass_tds / stats.interceptions : 999;

    if (yardsPerGame > 275 && tdIntRatio > 2.5) {
      return 1; // Great season
    } else if (yardsPerGame < 200 || tdIntRatio < 1.0) {
      return -1; // Poor season
    }
  } else if (position === "RB") {
    const yardsPerGame = stats.rush_yards / stats.games_played;
    const ypc =
      stats.rush_attempts > 0 ? stats.rush_yards / stats.rush_attempts : 0;

    if (yardsPerGame > 80 && ypc > 4.5) {
      return 1; // Great season
    } else if (yardsPerGame < 40 || ypc < 3.5) {
      return -1; // Poor season
    }
  } else if (position === "WR" || position === "TE") {
    const yardsPerGame = stats.receiving_yards / stats.games_played;
    const catchRate =
      stats.targets > 0 ? stats.receptions / stats.targets : 0;

    if (yardsPerGame > 70 && catchRate > 0.65) {
      return 1; // Great season
    } else if (yardsPerGame < 30 || catchRate < 0.5) {
      return -1; // Poor season
    }
  } else if (
    position === "DE" ||
    position === "DT" ||
    position === "DL" ||
    position === "LB"
  ) {
    const tacklesPerGame = stats.tackles / stats.games_played;
    const totalSacks = stats.sacks;

    if (tacklesPerGame > 6 && totalSacks > 8) {
      return 1; // Great season
    } else if (tacklesPerGame < 3 && totalSacks < 2) {
      return -1; // Poor season
    }
  } else if (position === "CB" || position === "S" || position === "DB") {
    const tacklesPerGame = stats.tackles / stats.games_played;
    const totalInts = stats.interceptions_defense;

    if (tacklesPerGame > 5 && totalInts > 3) {
      return 1; // Great season
    } else if (tacklesPerGame < 2 && totalInts === 0) {
      return -1; // Poor season
    }
  }

  return 0; // Average season
}

/**
 * Determine if a player should retire
 */
export function shouldRetire(
  age: number,
  overall: number,
  injuryProne: number,
): { retire: boolean; reason: string } {
  let retirementChance = 0;

  // Age-based retirement probability
  if (age < 30) {
    retirementChance = 0;
  } else if (age >= 30 && age <= 32) {
    retirementChance = 0.05;
  } else if (age >= 33 && age <= 35) {
    retirementChance = 0.15;
  } else if (age >= 36 && age <= 38) {
    retirementChance = 0.4;
  } else {
    retirementChance = 0.75;
  }

  // Modifiers
  if (injuryProne > 75) {
    retirementChance += 0.1; // Injury-prone players retire earlier
  }

  if (overall < 70) {
    retirementChance += 0.15; // Low-rated players retire earlier
  }

  if (overall > 85 && age < 36) {
    retirementChance -= 0.1; // Star players play longer
  }

  const shouldRetire = Math.random() < retirementChance;

  let reason = "age";
  if (injuryProne > 80 && shouldRetire) {
    reason = "injury";
  } else if (overall < 65 && shouldRetire) {
    reason = "performance";
  }

  return { retire: shouldRetire, reason };
}

/**
 * Apply progression to a single player attribute
 */
function progressAttribute(
  currentValue: number,
  change: number,
  position: string,
  attributeName: string,
): number {
  // Some attributes decline faster with age
  const ageSensitiveAttributes = ["speed", "agility"];
  let adjustedChange = change;

  if (ageSensitiveAttributes.includes(attributeName) && change < 0) {
    // Speed and agility decline faster
    adjustedChange = Math.floor(change * 1.3);
  }

  // Apply change with min/max bounds
  const newValue = Math.max(40, Math.min(99, currentValue + adjustedChange));
  return Math.round(newValue);
}

/**
 * Calculate new overall rating from individual attributes
 * This is a simplified version - you may want to expand this
 */
function calculateOverall(
  speed: number,
  strength: number,
  agility: number,
  awareness: number,
): number {
  // Simple average for now - could be position-specific weighted average
  const overall = Math.round(
    (speed * 0.3 + strength * 0.2 + agility * 0.25 + awareness * 0.25),
  );
  return Math.max(40, Math.min(99, overall));
}

/**
 * Process progression for a single player
 */
export async function processPlayerProgression(
  supabase: any,
  playerAttributes: PlayerAttributes,
  seasonStats: SeasonStats | null,
  playerPosition: string,
): Promise<ProgressionResult> {
  const age = playerAttributes.age + 1; // Players age by 1 year
  const trait = playerAttributes.development_trait;
  const oldOverall = playerAttributes.overall_rating;

  // Check for retirement
  const retirementCheck = shouldRetire(
    age,
    oldOverall,
    playerAttributes.injury_prone,
  );

  if (retirementCheck.retire) {
    return {
      playerId: playerAttributes.player_id,
      oldOverall,
      newOverall: oldOverall,
      change: 0,
      retired: true,
      reason: retirementCheck.reason,
    };
  }

  // Calculate progression
  const ageProgression = calculateAgeProgression(age, trait);
  const performanceModifier = calculatePerformanceModifier(
    playerPosition,
    seasonStats,
  );
  const moraleModifier =
    playerAttributes.morale >= 80 ? 1 : playerAttributes.morale < 40 ? -1 : 0;

  const totalChange = ageProgression + performanceModifier + moraleModifier;

  // Apply progression to individual attributes
  const newSpeed = progressAttribute(
    playerAttributes.speed,
    totalChange,
    playerPosition,
    "speed",
  );
  const newStrength = progressAttribute(
    playerAttributes.strength,
    totalChange,
    playerPosition,
    "strength",
  );
  const newAgility = progressAttribute(
    playerAttributes.agility,
    totalChange,
    playerPosition,
    "agility",
  );
  const newAwareness = progressAttribute(
    playerAttributes.awareness,
    totalChange,
    playerPosition,
    "awareness",
  );

  // Calculate new overall
  const newOverall = calculateOverall(
    newSpeed,
    newStrength,
    newAgility,
    newAwareness,
  );

  return {
    playerId: playerAttributes.player_id,
    oldOverall,
    newOverall,
    change: newOverall - oldOverall,
    retired: false,
  };
}

/**
 * Process progression for all players in a season
 */
export async function processAllPlayerProgressions(
  supabase: any,
  currentSeasonId: string,
  nextSeasonId: string,
): Promise<{
  progressed: number;
  regressed: number;
  retired: number;
  retiredPlayerIds: string[];
}> {
  let progressedCount = 0;
  let regressedCount = 0;
  let retiredCount = 0;
  const retiredPlayerIds: string[] = [];

  // Get all player attributes for current season
  const { data: playerAttributes, error: attrError } = await supabase
    .from("player_attributes")
    .select(
      `
      *,
      players!inner(id, position)
    `,
    )
    .eq("season_id", currentSeasonId);

  if (attrError) {
    console.error("Error loading player attributes:", attrError);
    return { progressed: 0, regressed: 0, retired: 0, retiredPlayerIds: [] };
  }

  // Get all season stats for performance evaluation
  const { data: seasonStats } = await supabase
    .from("season_stats")
    .select("*")
    .eq("season_id", currentSeasonId);

  const statsMap = new Map(
    seasonStats?.map((s: SeasonStats) => [s.player_id, s]) || [],
  );

  // Process each player
  for (const attr of playerAttributes) {
    const playerData = (attr as any).players;
    const stats = statsMap.get(attr.player_id);

    const result = await processPlayerProgression(
      supabase,
      attr,
      stats || null,
      playerData.position,
    );

    if (result.retired) {
      retiredCount++;
      retiredPlayerIds.push(result.playerId);

      // Insert into retired_players table
      await supabase.from("retired_players").insert({
        player_id: result.playerId,
        retirement_season_id: currentSeasonId,
        retirement_year: new Date().getFullYear(), // TODO: Get from season
        age_at_retirement: attr.age + 1,
        final_overall_rating: result.oldOverall,
        total_seasons_played: attr.years_pro,
        reason: result.reason || "age",
      });
    } else {
      // Create new player_attributes for next season
      await supabase.from("player_attributes").insert({
        player_id: result.playerId,
        season_id: nextSeasonId,
        age: attr.age + 1,
        overall_rating: result.newOverall,
        speed: progressAttribute(
          attr.speed,
          result.change,
          playerData.position,
          "speed",
        ),
        strength: progressAttribute(
          attr.strength,
          result.change,
          playerData.position,
          "strength",
        ),
        agility: progressAttribute(
          attr.agility,
          result.change,
          playerData.position,
          "agility",
        ),
        awareness: progressAttribute(
          attr.awareness,
          result.change,
          playerData.position,
          "awareness",
        ),
        injury_prone: attr.injury_prone,
        development_trait: attr.development_trait,
        morale: 75, // Reset morale to baseline
        years_pro: attr.years_pro + 1,
      });

      if (result.change > 0) {
        progressedCount++;
      } else if (result.change < 0) {
        regressedCount++;
      }
    }
  }

  return {
    progressed: progressedCount,
    regressed: regressedCount,
    retired: retiredCount,
    retiredPlayerIds,
  };
}
