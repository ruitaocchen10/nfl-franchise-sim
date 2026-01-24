/**
 * Team Needs Assessment
 * Analyzes team rosters to identify position gaps and priorities
 */

interface PositionNeed {
  position: string;
  currentCount: number;
  idealCount: number;
  needScore: number; // 0-100, higher = more urgent
  priority: "critical" | "high" | "medium" | "low";
}

interface TeamNeeds {
  teamId: string;
  positions: PositionNeed[];
  overallNeedScore: number;
  criticalNeeds: string[];
}

// Ideal roster composition by position
const IDEAL_ROSTER_COUNTS: Record<string, number> = {
  QB: 3,
  RB: 4,
  WR: 6,
  TE: 3,
  T: 4,
  G: 4,
  C: 2,
  OL: 2, // Swing tackles/guards
  DE: 4,
  DT: 4,
  DL: 2, // Versatile linemen
  LB: 6,
  CB: 5,
  S: 4,
  DB: 2, // Versatile DBs
  K: 1,
  P: 1,
};

/**
 * Calculate need score for a position (0-100)
 */
function calculateNeedScore(
  currentCount: number,
  idealCount: number,
  avgRating: number,
): number {
  // Factor 1: Count deficit (0-60 points)
  const countDeficit = Math.max(0, idealCount - currentCount);
  const countScore = Math.min(60, (countDeficit / idealCount) * 60);

  // Factor 2: Quality deficit (0-40 points)
  // If average rating is below 75, add urgency
  const qualityScore = avgRating < 75 ? (75 - avgRating) * 1.5 : 0;

  return Math.min(100, countScore + qualityScore);
}

/**
 * Determine priority level from need score
 */
function getPriority(needScore: number): "critical" | "high" | "medium" | "low" {
  if (needScore >= 75) return "critical";
  if (needScore >= 50) return "high";
  if (needScore >= 25) return "medium";
  return "low";
}

/**
 * Assess team needs for a specific season
 */
export async function assessTeamNeeds(
  supabase: any,
  teamId: string,
  seasonId: string,
): Promise<TeamNeeds> {
  // Get current roster with player attributes
  const { data: roster, error: rosterError } = await supabase
    .from("roster_spots")
    .select(
      `
      *,
      players!roster_spots_player_id_fkey(id, position),
      player_attributes!inner(overall_rating)
    `,
    )
    .eq("team_id", teamId)
    .eq("season_id", seasonId)
    .eq("status", "active");

  if (rosterError || !roster) {
    console.error(`Error loading roster for team ${teamId}:`, rosterError);
    return {
      teamId,
      positions: [],
      overallNeedScore: 0,
      criticalNeeds: [],
    };
  }

  // Group by position and calculate stats
  const positionMap = new Map<
    string,
    { count: number; totalRating: number }
  >();

  roster.forEach((spot: any) => {
    const position = spot.players.position;
    const rating = Array.isArray(spot.player_attributes)
      ? spot.player_attributes[0]?.overall_rating || 70
      : spot.player_attributes?.overall_rating || 70;

    if (!positionMap.has(position)) {
      positionMap.set(position, { count: 0, totalRating: 0 });
    }

    const posData = positionMap.get(position)!;
    posData.count++;
    posData.totalRating += rating;
  });

  // Calculate needs for each position
  const positionNeeds: PositionNeed[] = [];
  const criticalNeeds: string[] = [];
  let totalNeedScore = 0;

  for (const [position, idealCount] of Object.entries(IDEAL_ROSTER_COUNTS)) {
    const posData = positionMap.get(position) || { count: 0, totalRating: 0 };
    const currentCount = posData.count;
    const avgRating = currentCount > 0 ? posData.totalRating / currentCount : 65;

    const needScore = calculateNeedScore(currentCount, idealCount, avgRating);
    const priority = getPriority(needScore);

    positionNeeds.push({
      position,
      currentCount,
      idealCount,
      needScore,
      priority,
    });

    if (priority === "critical") {
      criticalNeeds.push(position);
    }

    totalNeedScore += needScore;
  }

  // Sort by need score (highest first)
  positionNeeds.sort((a, b) => b.needScore - a.needScore);

  const overallNeedScore = totalNeedScore / positionNeeds.length;

  return {
    teamId,
    positions: positionNeeds,
    overallNeedScore,
    criticalNeeds,
  };
}

/**
 * Assess needs for all teams in a season
 */
export async function assessAllTeamNeeds(
  supabase: any,
  seasonId: string,
): Promise<Map<string, TeamNeeds>> {
  // Get all teams
  const { data: teams } = await supabase.from("teams").select("id");

  if (!teams) {
    return new Map();
  }

  const needsMap = new Map<string, TeamNeeds>();

  for (const team of teams) {
    const needs = await assessTeamNeeds(supabase, team.id, seasonId);
    needsMap.set(team.id, needs);
  }

  return needsMap;
}

/**
 * Check if a team needs a specific position
 */
export function teamNeedsPosition(
  teamNeeds: TeamNeeds,
  position: string,
): { needed: boolean; urgency: number; priority: string } {
  const posNeed = teamNeeds.positions.find((p) => p.position === position);

  if (!posNeed) {
    return { needed: false, urgency: 0, priority: "low" };
  }

  return {
    needed: posNeed.needScore > 25,
    urgency: posNeed.needScore,
    priority: posNeed.priority,
  };
}
