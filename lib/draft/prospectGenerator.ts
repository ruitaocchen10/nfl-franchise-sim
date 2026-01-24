/**
 * Draft Prospect Generator
 * Generates realistic draft classes with ~350 prospects
 */

// Sample names for generating prospects
const FIRST_NAMES = [
  "Michael", "James", "Robert", "David", "William", "Christopher", "Matthew", "Joshua",
  "Daniel", "Andrew", "Justin", "Ryan", "Brandon", "Tyler", "Kevin", "Marcus", "Anthony",
  "Jalen", "Darius", "Malik", "Isaiah", "Xavier", "Cameron", "Jordan", "Derek", "Travis",
  "Jayden", "Aiden", "Mason", "Ethan", "Noah", "Liam", "Lucas", "Logan", "Jacob", "Caleb",
];

const LAST_NAMES = [
  "Johnson", "Smith", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
  "Martinez", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson",
  "White", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright",
  "Scott", "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Campbell", "Roberts",
];

const COLLEGES = [
  "Alabama", "Ohio State", "Georgia", "Clemson", "LSU", "Oklahoma", "Texas", "USC",
  "Michigan", "Penn State", "Florida", "Notre Dame", "Auburn", "Texas A&M", "Oregon",
  "Florida State", "Miami", "Wisconsin", "Washington", "Stanford", "UCLA", "Nebraska",
  "Tennessee", "Oklahoma State", "Michigan State", "Iowa", "Arkansas", "South Carolina",
  "Mississippi", "Ole Miss", "Virginia Tech", "NC State", "Baylor", "TCU", "Utah",
];

const DRAFT_GRADES = [
  "Elite 1st Round Talent",
  "Top 10 Pick",
  "Late 1st Round",
  "Early 2nd Round",
  "Mid 2-3 Round Pick",
  "Day 2 Prospect",
  "Late Round Sleeper",
  "Priority Free Agent",
  "Developmental Prospect",
];

interface ProspectDistribution {
  position: string;
  count: number;
  minOverall: number;
  maxOverall: number;
}

// Position distribution for draft class
const POSITION_DISTRIBUTION: ProspectDistribution[] = [
  { position: "QB", count: 20, minOverall: 68, maxOverall: 88 },
  { position: "RB", count: 30, minOverall: 70, maxOverall: 90 },
  { position: "WR", count: 50, minOverall: 68, maxOverall: 92 },
  { position: "TE", count: 20, minOverall: 65, maxOverall: 85 },
  { position: "T", count: 25, minOverall: 68, maxOverall: 88 },
  { position: "G", count: 20, minOverall: 67, maxOverall: 85 },
  { position: "C", count: 15, minOverall: 66, maxOverall: 84 },
  { position: "DE", count: 30, minOverall: 70, maxOverall: 90 },
  { position: "DT", count: 25, minOverall: 68, maxOverall: 88 },
  { position: "LB", count: 40, minOverall: 69, maxOverall: 89 },
  { position: "CB", count: 40, minOverall: 70, maxOverall: 91 },
  { position: "S", count: 30, minOverall: 68, maxOverall: 88 },
  { position: "K", count: 5, minOverall: 65, maxOverall: 80 },
  { position: "P", count: 5, minOverall: 65, maxOverall: 80 },
];

/**
 * Generate a random name
 */
function generateName(): { first: string; last: string } {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return { first, last };
}

/**
 * Generate realistic combine stats based on position and attributes
 */
function generateCombineStats(
  position: string,
  speed: number,
  strength: number,
  agility: number,
): {
  fortyTime: number;
  bench: number;
  vertical: number;
  broadJump: number;
  threeCone: number;
} {
  // 40-yard dash (faster = lower time)
  let fortyTime = 4.3 + (99 - speed) * 0.025; // 4.3 to 5.5 range

  // Position adjustments
  if (position === "QB" || position === "WR" || position === "CB") {
    fortyTime -= 0.1; // Faster positions
  } else if (position === "DT" || position === "G" || position === "C") {
    fortyTime += 0.3; // Slower positions
  }

  // Bench press (225 lbs reps)
  let bench = Math.round(5 + (strength / 5));
  if (position === "DL" || position === "OL") {
    bench += 10; // Big guys bench more
  }

  // Vertical jump (inches)
  const vertical = 25 + agility / 3.5;

  // Broad jump (inches)
  const broadJump = Math.round(90 + agility / 2.5);

  // Three-cone drill
  const threeCone = 6.5 + (99 - agility) * 0.03;

  return {
    fortyTime: parseFloat(fortyTime.toFixed(2)),
    bench,
    vertical: parseFloat(vertical.toFixed(1)),
    broadJump,
    threeCone: parseFloat(threeCone.toFixed(2)),
  };
}

/**
 * Determine draft grade and projected round based on overall rating
 */
function getDraftProjection(overall: number): {
  grade: string;
  minRound: number;
  maxRound: number;
} {
  if (overall >= 85) {
    return { grade: DRAFT_GRADES[0], minRound: 1, maxRound: 1 }; // Elite
  } else if (overall >= 82) {
    return { grade: DRAFT_GRADES[1], minRound: 1, maxRound: 1 }; // Top 10
  } else if (overall >= 78) {
    return { grade: DRAFT_GRADES[2], minRound: 1, maxRound: 2 }; // Late 1st
  } else if (overall >= 75) {
    return { grade: DRAFT_GRADES[3], minRound: 2, maxRound: 3 }; // Early 2nd
  } else if (overall >= 72) {
    return { grade: DRAFT_GRADES[4], minRound: 2, maxRound: 4 }; // Mid rounds
  } else if (overall >= 69) {
    return { grade: DRAFT_GRADES[5], minRound: 3, maxRound: 5 }; // Day 2
  } else if (overall >= 67) {
    return { grade: DRAFT_GRADES[6], minRound: 5, maxRound: 7 }; // Late rounds
  } else {
    return { grade: DRAFT_GRADES[7], minRound: 6, maxRound: 7 }; // UDFA
  }
}

/**
 * Add projection noise (creates busts and steals)
 */
function addProjectionNoise(
  trueOverall: number,
  hype: number,
): { minRound: number; maxRound: number } {
  const projection = getDraftProjection(trueOverall);

  // Hype can inflate or deflate projection
  const hypeEffect = (hype - 50) / 100; // -0.5 to +0.5

  let minRound = projection.minRound;
  let maxRound = projection.maxRound;

  if (hypeEffect > 0.2) {
    // Over-hyped (potential bust)
    minRound = Math.max(1, minRound - 1);
    maxRound = Math.max(1, maxRound - 1);
  } else if (hypeEffect < -0.2) {
    // Under-hyped (potential steal)
    minRound = Math.min(7, minRound + 1);
    maxRound = Math.min(7, maxRound + 1);
  }

  return { minRound, maxRound };
}

/**
 * Generate a single draft prospect
 */
function generateProspect(
  position: string,
  minOverall: number,
  maxOverall: number,
): any {
  const name = generateName();
  const college = COLLEGES[Math.floor(Math.random() * COLLEGES.length)];
  const age = 21 + Math.floor(Math.random() * 3); // 21-23

  // Generate true attributes (hidden)
  const trueOverall = Math.round(
    minOverall + Math.random() * (maxOverall - minOverall),
  );

  // Potential is usually higher than current overall
  const truePotential = Math.min(99, trueOverall + Math.round(Math.random() * 10));

  // Generate individual attributes around the overall
  const variation = 8;
  const trueSpeed = Math.max(60, Math.min(99, trueOverall + (Math.random() * variation * 2 - variation)));
  const trueStrength = Math.max(60, Math.min(99, trueOverall + (Math.random() * variation * 2 - variation)));
  const trueAgility = Math.max(60, Math.min(99, trueOverall + (Math.random() * variation * 2 - variation)));
  const trueAwareness = Math.max(60, Math.min(99, trueOverall + (Math.random() * variation * 2 - variation)));

  // Generate hype (media attention)
  const hype = Math.round(30 + Math.random() * 70);

  // Generate height/weight based on position
  let height = 70; // Base height in inches
  let weight = 200;

  if (["QB", "WR", "CB", "S"].includes(position)) {
    height = 70 + Math.floor(Math.random() * 6); // 5'10" to 6'4"
    weight = 180 + Math.floor(Math.random() * 40); // 180-220 lbs
  } else if (["RB", "LB", "TE"].includes(position)) {
    height = 71 + Math.floor(Math.random() * 5); // 5'11" to 6'4"
    weight = 220 + Math.floor(Math.random() * 40); // 220-260 lbs
  } else if (["DT", "DE", "T", "G", "C"].includes(position)) {
    height = 74 + Math.floor(Math.random() * 6); // 6'2" to 6'8"
    weight = 280 + Math.floor(Math.random() * 60); // 280-340 lbs
  } else if (["K", "P"].includes(position)) {
    height = 70 + Math.floor(Math.random() * 4); // 5'10" to 6'2"
    weight = 180 + Math.floor(Math.random() * 40); // 180-220 lbs
  }

  // Generate combine stats
  const combineStats = generateCombineStats(
    position,
    trueSpeed,
    trueStrength,
    trueAgility,
  );

  // Get draft projection
  const baseProjection = getDraftProjection(trueOverall);
  const projection = addProjectionNoise(trueOverall, hype);

  return {
    first_name: name.first,
    last_name: name.last,
    position,
    college,
    age,
    height_inches: height,
    weight_lbs: weight,
    true_overall: Math.round(trueOverall),
    true_potential: truePotential,
    true_speed: Math.round(trueSpeed),
    true_strength: Math.round(trueStrength),
    true_agility: Math.round(trueAgility),
    true_awareness: Math.round(trueAwareness),
    true_injury_prone: Math.round(30 + Math.random() * 40), // 30-70 range
    combine_40_time: combineStats.fortyTime,
    combine_bench: combineStats.bench,
    combine_vertical: combineStats.vertical,
    combine_broad_jump: combineStats.broadJump,
    combine_three_cone: combineStats.threeCone,
    draft_grade: baseProjection.grade,
    projected_round_min: projection.minRound,
    projected_round_max: projection.maxRound,
    hype,
  };
}

/**
 * Generate a full draft class of ~350 prospects
 */
export async function generateDraftClass(
  supabase: any,
  seasonId: string,
): Promise<number> {
  const prospects: any[] = [];

  // Generate prospects for each position
  for (const positionGroup of POSITION_DISTRIBUTION) {
    for (let i = 0; i < positionGroup.count; i++) {
      const prospect = generateProspect(
        positionGroup.position,
        positionGroup.minOverall,
        positionGroup.maxOverall,
      );
      prospects.push({
        ...prospect,
        season_id: seasonId,
      });
    }
  }

  // Insert all prospects into database
  const { error } = await supabase.from("draft_prospects").insert(prospects);

  if (error) {
    console.error("Error generating draft prospects:", error);
    return 0;
  }

  return prospects.length;
}

/**
 * Get top prospects for a position
 */
export async function getTopProspects(
  supabase: any,
  seasonId: string,
  position?: string,
  limit: number = 50,
): Promise<any[]> {
  let query = supabase
    .from("draft_prospects")
    .select("*")
    .eq("season_id", seasonId)
    .order("projected_round_min", { ascending: true })
    .limit(limit);

  if (position) {
    query = query.eq("position", position);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching prospects:", error);
    return [];
  }

  return data || [];
}
