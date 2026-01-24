/**
 * Free Agents Seeding Script
 * Inserts free agents from Spotrac data into the database
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import type { Database } from "@/lib/types/database.types";

// Load environment variables from .env.local
config({ path: ".env.local" });

interface FreeAgentData {
  player_id: string;
  name: string;
  position: string;
  last_team: string;
  overall_rating: number;
  age: number;
}

interface TeamMapping {
  [abbr: string]: string; // abbr -> team_id
}

class FreeAgentSeeder {
  private supabase;
  private teamMapping: TeamMapping = {};
  private templateSeasonId: string | null = null;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async initialize() {
    console.log("🔧 Initializing...\n");

    // Load team mapping
    await this.loadTeams();

    // Get template season
    await this.getTemplateSeasonId();
  }

  async loadTeams() {
    console.log("📥 Loading teams...");

    const { data: teams, error } = await this.supabase
      .from("teams")
      .select("id, abbreviation");

    if (error) {
      throw new Error(`Failed to load teams: ${error.message}`);
    }

    // Create mapping of abbreviation -> team_id
    teams?.forEach((team) => {
      this.teamMapping[team.abbreviation] = team.id;
    });

    console.log(`   ✅ Loaded ${teams?.length || 0} teams\n`);
  }

  async getTemplateSeasonId(): Promise<string> {
    console.log("🔍 Finding template season...");

    const { data: season, error } = await this.supabase
      .from("seasons")
      .select("id")
      .eq("is_template", true)
      .single();

    if (error || !season) {
      throw new Error("Template season not found. Please create one first.");
    }

    this.templateSeasonId = season.id;
    console.log(`   ✅ Template season: ${season.id}\n`);

    return season.id;
  }

  /**
   * Calculate market value based on position and overall rating
   */
  calculateMarketValue(position: string, overallRating: number): number {
    // Base salary calculation (exponential curve for higher ratings)
    const baseValue = Math.pow(overallRating / 50, 3) * 1000000;

    // Position multipliers (based on NFL market values)
    const positionMultipliers: Record<string, number> = {
      QB: 2.0, // Quarterbacks get premium
      DL: 1.3, // Pass rushers
      LB: 1.2,
      CB: 1.4, // Cornerbacks
      S: 1.1, // Safeties
      WR: 1.5, // Wide receivers
      OL: 1.2, // Offensive line
      TE: 1.1, // Tight ends
      RB: 0.8, // Running backs (lower market)
      K: 0.4, // Kickers
      P: 0.3, // Punters
    };

    const multiplier = positionMultipliers[position] || 1.0;
    const marketValue = baseValue * multiplier;

    // Round to nearest 100k
    return Math.round(marketValue / 100000) * 100000;
  }

  /**
   * Estimate previous contract value (slightly lower than current market)
   */
  estimatePreviousContractValue(marketValue: number): number {
    // Previous contract was 85-95% of current market value
    const percentage = 0.85 + Math.random() * 0.1;
    return Math.round(marketValue * percentage);
  }

  validateFreeAgent(fa: FreeAgentData): string[] {
    const errors: string[] = [];

    // Check player_id exists
    if (!fa.player_id) {
      errors.push("Missing player_id");
    }

    // Check team mapping
    if (!this.teamMapping[fa.last_team]) {
      errors.push(`Unknown team abbreviation: ${fa.last_team}`);
    }

    // Validate ratings
    if (fa.overall_rating < 0 || fa.overall_rating > 99) {
      errors.push("overall_rating must be between 0 and 99");
    }

    // Validate age
    if (fa.age < 20 || fa.age > 45) {
      errors.push("age must be between 20 and 45");
    }

    return errors;
  }

  async seedFreeAgents(dataPath: string): Promise<void> {
    console.log("📋 Loading free agents data...");

    // Load free agents
    const freeAgentsData: FreeAgentData[] = JSON.parse(
      fs.readFileSync(dataPath, "utf-8"),
    );

    console.log(`   ✅ Loaded ${freeAgentsData.length} free agents\n`);

    // Validate all free agents
    console.log("✅ Validating free agents...");
    const validFreeAgents: FreeAgentData[] = [];
    const invalidFreeAgents: Array<{
      freeAgent: FreeAgentData;
      errors: string[];
    }> = [];

    for (const fa of freeAgentsData) {
      const errors = this.validateFreeAgent(fa);

      if (errors.length === 0) {
        validFreeAgents.push(fa);
      } else {
        invalidFreeAgents.push({ freeAgent: fa, errors });
      }
    }

    console.log(`   ✅ Valid: ${validFreeAgents.length}`);
    console.log(`   ❌ Invalid: ${invalidFreeAgents.length}\n`);

    if (invalidFreeAgents.length > 0) {
      console.log("⚠️  Invalid free agents:");
      invalidFreeAgents.slice(0, 5).forEach(({ freeAgent, errors }) => {
        console.log(`   - ${freeAgent.name}: ${errors.join(", ")}`);
      });
      console.log();
    }

    // Check for existing free agents
    console.log("🔍 Checking for existing free agents...");

    const { data: existingFreeAgents, error: checkError } = await this.supabase
      .from("free_agents")
      .select("player_id")
      .eq("season_id", this.templateSeasonId!);

    if (checkError) {
      throw new Error(
        `Failed to check existing free agents: ${checkError.message}`,
      );
    }

    const existingPlayerIds = new Set(
      existingFreeAgents?.map((fa) => fa.player_id) || [],
    );
    console.log(
      `   ℹ️  Found ${existingPlayerIds.size} existing free agents\n`,
    );

    // Filter out duplicates
    const newFreeAgents = validFreeAgents.filter(
      (fa) => !existingPlayerIds.has(fa.player_id),
    );

    console.log(`📝 Inserting ${newFreeAgents.length} new free agents...\n`);

    if (newFreeAgents.length === 0) {
      console.log("✅ No new free agents to insert.\n");
      return;
    }

    // Transform to database format
    const freeAgentsToInsert = newFreeAgents.map((fa) => {
      const marketValue = this.calculateMarketValue(
        fa.position,
        fa.overall_rating,
      );
      const previousContractValue =
        this.estimatePreviousContractValue(marketValue);

      return {
        player_id: fa.player_id,
        season_id: this.templateSeasonId!,
        previous_team_id: this.teamMapping[fa.last_team],
        previous_contract_value: previousContractValue,
        market_value: marketValue,
        status: "available" as const,
        interested_teams: [],
      };
    });

    // Insert in batches to avoid timeout
    const batchSize = 100;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < freeAgentsToInsert.length; i += batchSize) {
      const batch = freeAgentsToInsert.slice(i, i + batchSize);

      const { data, error } = await this.supabase
        .from("free_agents")
        .insert(batch)
        .select("id");

      if (error) {
        console.error(
          `   ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`,
          error.message,
        );
        failed += batch.length;
      } else {
        inserted += data?.length || 0;
        console.log(
          `   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} free agents`,
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SEEDING SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Free Agents Loaded: ${freeAgentsData.length}`);
    console.log(`Valid Free Agents:        ${validFreeAgents.length}`);
    console.log(
      `Already Existed:          ${validFreeAgents.length - newFreeAgents.length}`,
    );
    console.log(`Newly Inserted:           ${inserted}`);
    console.log(`Failed:                   ${failed}`);
    console.log("=".repeat(60) + "\n");
  }

  async generateReport(outputPath: string) {
    console.log("📊 Generating free agents report...\n");

    // Get free agent counts by position
    const { data: freeAgents } = await this.supabase
      .from("free_agents")
      .select("previous_team_id, player_id, players(position)")
      .eq("season_id", this.templateSeasonId!);

    if (!freeAgents) {
      console.log("   ⚠️  No free agents found\n");
      return;
    }

    // Count by position
    const positionCounts: Record<string, number> = {};
    freeAgents.forEach((fa: any) => {
      const position = fa.players?.position || "UNKNOWN";
      positionCounts[position] = (positionCounts[position] || 0) + 1;
    });

    // Generate report
    const report = {
      total_free_agents: freeAgents.length,
      free_agents_by_position: Object.entries(positionCounts)
        .map(([position, count]) => ({ position, count }))
        .sort((a, b) => b.count - a.count),
      positions_represented: Object.keys(positionCounts).length,
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log("✅ Free Agents Report:");
    console.log(`   Total Free Agents: ${report.total_free_agents}`);
    console.log(`   Positions: ${report.positions_represented}`);
    console.log(`\n   Report saved: ${outputPath}\n`);

    // Show positions with most free agents
    console.log("   Top Positions by Free Agent Count:");
    report.free_agents_by_position.slice(0, 10).forEach(({ position, count }) => {
      console.log(`     ${position}: ${count}`);
    });
    console.log();
  }
}

async function main() {
  try {
    const seeder = new FreeAgentSeeder();

    // Initialize
    await seeder.initialize();

    // Seed free agents
    const dataPath = "./spotrac_data/processed/free_agents.json";

    if (!fs.existsSync(dataPath)) {
      console.error(`❌ File not found: ${dataPath}`);
      console.log("   Please ensure free_agents.json exists.\n");
      process.exit(1);
    }

    await seeder.seedFreeAgents(dataPath);

    // Generate report
    await seeder.generateReport(
      "./spotrac_data/processed/free_agents_report.json",
    );

    console.log("🎉 Free agent seeding complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
