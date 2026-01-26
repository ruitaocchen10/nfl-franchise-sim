/**
 * 2025 NFL Standings Seeding Script
 *
 * Instructions:
 * 1. Fill in the standings data below with actual 2025 NFL final standings
 * 2. Run: npx tsx scripts/seed_2025_standings.ts
 * 3. This will populate the 2025 template season with standings data
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

interface StandingsData {
  team_abbr: string;
  wins: number;
  losses: number;
  ties: number;
  division_rank: number; // 1-4 (1st place, 2nd place, etc.)
  conference_rank: number; // 1-16
  points_for: number;
  points_against: number;
}

// ============================================================================
// 2025 NFL STANDINGS - FILL IN THE DATA BELOW
// ============================================================================

const STANDINGS_2025: StandingsData[] = [
  // AFC EAST
  {
    team_abbr: "BUF",
    wins: 12,
    losses: 5,
    ties: 0,
    division_rank: 2,
    conference_rank: 6,
    points_for: 481,
    points_against: 365,
  },
  {
    team_abbr: "MIA",
    wins: 7,
    losses: 10,
    ties: 0,
    division_rank: 3,
    conference_rank: 10,
    points_for: 347,
    points_against: 424,
  },
  {
    team_abbr: "NYJ",
    wins: 3,
    losses: 14,
    ties: 0,
    division_rank: 4,
    conference_rank: 15,
    points_for: 300,
    points_against: 503,
  },
  {
    team_abbr: "NE",
    wins: 14,
    losses: 3,
    ties: 0,
    division_rank: 1,
    conference_rank: 2,
    points_for: 490,
    points_against: 320,
  },

  // AFC WEST
  {
    team_abbr: "KC",
    wins: 6,
    losses: 11,
    ties: 0,
    division_rank: 3,
    conference_rank: 12,
    points_for: 362,
    points_against: 328,
  },
  {
    team_abbr: "LAC",
    wins: 12,
    losses: 5,
    ties: 0,
    division_rank: 2,
    conference_rank: 7,
    points_for: 368,
    points_against: 340,
  },
  {
    team_abbr: "DEN",
    wins: 14,
    losses: 3,
    ties: 0,
    division_rank: 1,
    conference_rank: 1,
    points_for: 401,
    points_against: 311,
  },
  {
    team_abbr: "LV",
    wins: 3,
    losses: 14,
    ties: 0,
    division_rank: 4,
    conference_rank: 14,
    points_for: 241,
    points_against: 432,
  },

  // AFC NORTH
  {
    team_abbr: "BAL",
    wins: 8,
    losses: 9,
    ties: 0,
    division_rank: 2,
    conference_rank: 9,
    points_for: 424,
    points_against: 398,
  },
  {
    team_abbr: "PIT",
    wins: 10,
    losses: 7,
    ties: 0,
    division_rank: 1,
    conference_rank: 4,
    points_for: 397,
    points_against: 387,
  },
  {
    team_abbr: "CLE",
    wins: 5,
    losses: 12,
    ties: 0,
    division_rank: 4,
    conference_rank: 13,
    points_for: 279,
    points_against: 379,
  },
  {
    team_abbr: "CIN",
    wins: 6,
    losses: 11,
    ties: 0,
    division_rank: 3,
    conference_rank: 11,
    points_for: 414,
    points_against: 492,
  },

  // AFC SOUTH
  {
    team_abbr: "HOU",
    wins: 12,
    losses: 5,
    ties: 0,
    division_rank: 1,
    conference_rank: 5,
    points_for: 404,
    points_against: 295,
  },
  {
    team_abbr: "IND",
    wins: 8,
    losses: 9,
    ties: 0,
    division_rank: 2,
    conference_rank: 8,
    points_for: 466,
    points_against: 412,
  },
  {
    team_abbr: "JAX",
    wins: 13,
    losses: 4,
    ties: 0,
    division_rank: 3,
    conference_rank: 3,
    points_for: 474,
    points_against: 336,
  },
  {
    team_abbr: "TEN",
    wins: 3,
    losses: 14,
    ties: 0,
    division_rank: 4,
    conference_rank: 16,
    points_for: 284,
    points_against: 478,
  },

  // NFC EAST
  {
    team_abbr: "PHI",
    wins: 11,
    losses: 6,
    ties: 0,
    division_rank: 1,
    conference_rank: 3,
    points_for: 379,
    points_against: 325,
  },
  {
    team_abbr: "DAL",
    wins: 7,
    losses: 9,
    ties: 1,
    division_rank: 2,
    conference_rank: 12,
    points_for: 471,
    points_against: 511,
  },
  {
    team_abbr: "WAS",
    wins: 5,
    losses: 12,
    ties: 0,
    division_rank: 3,
    conference_rank: 14,
    points_for: 356,
    points_against: 451,
  },
  {
    team_abbr: "NYG",
    wins: 4,
    losses: 13,
    ties: 0,
    division_rank: 4,
    conference_rank: 15,
    points_for: 381,
    points_against: 439,
  },

  // NFC WEST
  {
    team_abbr: "LAR",
    wins: 12,
    losses: 5,
    ties: 0,
    division_rank: 2,
    conference_rank: 5,
    points_for: 518,
    points_against: 346,
  },
  {
    team_abbr: "SEA",
    wins: 14,
    losses: 3,
    ties: 0,
    division_rank: 1,
    conference_rank: 1,
    points_for: 483,
    points_against: 292,
  },
  {
    team_abbr: "ARI",
    wins: 3,
    losses: 14,
    ties: 0,
    division_rank: 4,
    conference_rank: 16,
    points_for: 355,
    points_against: 488,
  },
  {
    team_abbr: "SF",
    wins: 12,
    losses: 5,
    ties: 0,
    division_rank: 3,
    conference_rank: 6,
    points_for: 437,
    points_against: 371,
  },

  // NFC NORTH
  {
    team_abbr: "DET",
    wins: 9,
    losses: 8,
    ties: 0,
    division_rank: 4,
    conference_rank: 9,
    points_for: 481,
    points_against: 413,
  },
  {
    team_abbr: "GB",
    wins: 9,
    losses: 7,
    ties: 1,
    division_rank: 2,
    conference_rank: 7,
    points_for: 391,
    points_against: 360,
  },
  {
    team_abbr: "MIN",
    wins: 9,
    losses: 8,
    ties: 0,
    division_rank: 3,
    conference_rank: 8,
    points_for: 344,
    points_against: 333,
  },
  {
    team_abbr: "CHI",
    wins: 11,
    losses: 6,
    ties: 0,
    division_rank: 1,
    conference_rank: 2,
    points_for: 441,
    points_against: 415,
  },

  // NFC SOUTH
  {
    team_abbr: "TB",
    wins: 8,
    losses: 9,
    ties: 0,
    division_rank: 2,
    conference_rank: 10,
    points_for: 380,
    points_against: 411,
  },
  {
    team_abbr: "ATL",
    wins: 8,
    losses: 9,
    ties: 0,
    division_rank: 3,
    conference_rank: 11,
    points_for: 353,
    points_against: 401,
  },
  {
    team_abbr: "NO",
    wins: 6,
    losses: 11,
    ties: 0,
    division_rank: 3,
    conference_rank: 13,
    points_for: 306,
    points_against: 383,
  },
  {
    team_abbr: "CAR",
    wins: 8,
    losses: 9,
    ties: 0,
    division_rank: 1,
    conference_rank: 4,
    points_for: 311,
    points_against: 380,
  },
];

// ============================================================================
// SEEDING LOGIC - NO NEED TO MODIFY BELOW
// ============================================================================

interface TeamMapping {
  [abbr: string]: { id: string; conference: string; division: string };
}

class StandingsSeeder {
  private supabase;
  private teamMapping: TeamMapping = {};
  private templateSeasonId: string | null = null;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
      );
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async initialize() {
    console.log("🔧 Initializing...\n");
    await this.loadTeams();
    await this.getOrCreateTemplateSeasonId();
  }

  async loadTeams() {
    console.log("📥 Loading teams...");

    const { data: teams, error } = await this.supabase
      .from("teams")
      .select("id, abbreviation, conference, division");

    if (error) {
      throw new Error(`Failed to load teams: ${error.message}`);
    }

    // Create mapping of abbreviation -> team data
    teams?.forEach((team) => {
      this.teamMapping[team.abbreviation] = {
        id: team.id,
        conference: team.conference,
        division: team.division,
      };
    });

    console.log(`   ✅ Loaded ${teams?.length || 0} teams\n`);
  }

  async getOrCreateTemplateSeasonId(): Promise<string> {
    console.log("🔍 Finding or creating 2025 template season...");

    // Try to find existing 2025 template season
    const { data: existingSeason } = await this.supabase
      .from("seasons")
      .select("id")
      .eq("is_template", true)
      .eq("year", 2025)
      .single();

    if (existingSeason) {
      this.templateSeasonId = existingSeason.id;
      console.log(
        `   ✅ Found existing 2025 template season: ${existingSeason.id}\n`,
      );
      return existingSeason.id;
    }

    // Create new 2025 template season
    console.log("   Creating new 2025 template season...");
    const { data: newSeason, error } = await this.supabase
      .from("seasons")
      .insert({
        year: 2025,
        current_week: 0,
        phase: "offseason",
        is_template: true,
      })
      .select("id")
      .single();

    if (error || !newSeason) {
      throw new Error(`Failed to create template season: ${error?.message}`);
    }

    this.templateSeasonId = newSeason.id;
    console.log(`   ✅ Created 2025 template season: ${newSeason.id}\n`);
    return newSeason.id;
  }

  validateStanding(standing: StandingsData): string[] {
    const errors: string[] = [];

    // Check team exists
    if (!this.teamMapping[standing.team_abbr]) {
      errors.push(`Unknown team abbreviation: ${standing.team_abbr}`);
    }

    // Validate division_rank (1-4)
    if (standing.division_rank < 1 || standing.division_rank > 4) {
      errors.push(`division_rank must be 1-4, got ${standing.division_rank}`);
    }

    // Validate conference_rank (1-16)
    if (standing.conference_rank < 1 || standing.conference_rank > 16) {
      errors.push(
        `conference_rank must be 1-16, got ${standing.conference_rank}`,
      );
    }

    // Validate wins/losses
    if (standing.wins < 0 || standing.losses < 0 || standing.ties < 0) {
      errors.push("wins, losses, and ties cannot be negative");
    }

    // Validate points
    if (standing.points_for < 0 || standing.points_against < 0) {
      errors.push("points_for and points_against cannot be negative");
    }

    return errors;
  }

  async seedStandings(): Promise<void> {
    console.log("📋 Validating standings data...");

    // Validate all standings
    const validStandings: StandingsData[] = [];
    const invalidStandings: Array<{
      standing: StandingsData;
      errors: string[];
    }> = [];

    for (const standing of STANDINGS_2025) {
      const errors = this.validateStanding(standing);

      if (errors.length === 0) {
        validStandings.push(standing);
      } else {
        invalidStandings.push({ standing, errors });
      }
    }

    console.log(`   ✅ Valid: ${validStandings.length}`);
    console.log(`   ❌ Invalid: ${invalidStandings.length}\n`);

    if (invalidStandings.length > 0) {
      console.log("⚠️  Invalid standings:");
      invalidStandings.forEach(({ standing, errors }) => {
        console.log(`   - ${standing.team_abbr}: ${errors.join(", ")}`);
      });
      console.log();
      throw new Error("Fix invalid standings before proceeding");
    }

    // Check for existing standings
    console.log("🔍 Checking for existing standings...");

    const { data: existingStandings } = await this.supabase
      .from("team_standings")
      .select("team_id")
      .eq("season_id", this.templateSeasonId!);

    const existingTeamIds = new Set(
      (existingStandings || []).map((s) => s.team_id),
    );
    console.log(`   ℹ️  Found ${existingTeamIds.size} existing standings\n`);

    // Filter out teams that already have standings
    const newStandings = validStandings.filter(
      (s) => !existingTeamIds.has(this.teamMapping[s.team_abbr].id),
    );

    console.log(`📝 Inserting ${newStandings.length} new standings...\n`);

    if (newStandings.length === 0) {
      console.log("✅ No new standings to insert.\n");
      return;
    }

    // Transform to database format
    const standingsToInsert = newStandings.map((standing) => ({
      season_id: this.templateSeasonId!,
      team_id: this.teamMapping[standing.team_abbr].id,
      wins: standing.wins,
      losses: standing.losses,
      ties: standing.ties,
      division_rank: standing.division_rank,
      conference_rank: standing.conference_rank,
      points_for: standing.points_for,
      points_against: standing.points_against,
    }));

    // Insert all at once (32 teams is small enough)
    const { data, error } = await this.supabase
      .from("team_standings")
      .insert(standingsToInsert)
      .select("id");

    if (error) {
      console.error(`   ❌ Insert failed:`, error.message);
      throw error;
    }

    console.log(`   ✅ Inserted ${data?.length || 0} standings\n`);
  }

  async generateReport() {
    console.log("📊 Generating standings report...\n");

    const { data: standings } = await this.supabase
      .from("team_standings")
      .select(
        `
        wins,
        losses,
        ties,
        division_rank,
        conference_rank,
        points_for,
        points_against,
        team:teams(abbreviation, conference, division)
      `,
      )
      .eq("season_id", this.templateSeasonId!)
      .order("conference_rank", { ascending: true });

    if (!standings || standings.length === 0) {
      console.log("   ⚠️  No standings found\n");
      return;
    }

    console.log("=".repeat(70));
    console.log("2025 NFL STANDINGS SUMMARY");
    console.log("=".repeat(70));
    console.log(`Total Teams: ${standings.length}\n`);

    // Group by conference
    const afc = standings.filter((s: any) => s.team.conference === "AFC");
    const nfc = standings.filter((s: any) => s.team.conference === "NFC");

    console.log("AFC:");
    afc.forEach((s: any) => {
      console.log(
        `  ${s.conference_rank.toString().padStart(2)}. ${s.team.abbreviation.padEnd(4)} ` +
          `${s.wins}-${s.losses}-${s.ties} ` +
          `(Div: ${s.division_rank}) ` +
          `PF: ${s.points_for} PA: ${s.points_against}`,
      );
    });

    console.log("\nNFC:");
    nfc.forEach((s: any) => {
      console.log(
        `  ${s.conference_rank.toString().padStart(2)}. ${s.team.abbreviation.padEnd(4)} ` +
          `${s.wins}-${s.losses}-${s.ties} ` +
          `(Div: ${s.division_rank}) ` +
          `PF: ${s.points_for} PA: ${s.points_against}`,
      );
    });

    console.log("=".repeat(70) + "\n");
  }
}

async function main() {
  try {
    const seeder = new StandingsSeeder();

    // Initialize
    await seeder.initialize();

    // Seed standings
    await seeder.seedStandings();

    // Generate report
    await seeder.generateReport();

    console.log("🎉 2025 standings seeding complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
