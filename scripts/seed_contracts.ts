/**
 * Contract Seeding Script
 * Inserts matched contracts into the database
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import type { Database } from "@/lib/types/database.types";

interface MatchedContract {
  player_id: string;
  player_name: string;
  team_abbr: string;
  position: string;
  total_value: number;
  years_remaining: number;
  annual_salary: number;
  guaranteed_money: number;
  signing_bonus: number;
  cap_hit: number;
  match_confidence: "exact" | "fuzzy" | "manual";
}

interface TeamMapping {
  [abbr: string]: string; // abbr -> team_id
}

class ContractSeeder {
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

    // Get or create template season
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

  validateContract(contract: MatchedContract): string[] {
    const errors: string[] = [];

    // Check player_id exists
    if (!contract.player_id) {
      errors.push("Missing player_id");
    }

    // Check team mapping
    if (!this.teamMapping[contract.team_abbr]) {
      errors.push(`Unknown team abbreviation: ${contract.team_abbr}`);
    }

    // Validate financial data
    if (contract.total_value < 0) {
      errors.push("total_value cannot be negative");
    }

    if (contract.guaranteed_money > contract.total_value) {
      errors.push("guaranteed_money exceeds total_value");
    }

    if (contract.years_remaining <= 0) {
      errors.push("years_remaining must be positive");
    }

    if (contract.annual_salary < 0) {
      errors.push("annual_salary cannot be negative");
    }

    if (contract.cap_hit < 0) {
      errors.push("cap_hit cannot be negative");
    }

    return errors;
  }

  async seedContracts(matchedPath: string): Promise<void> {
    console.log("📋 Loading matched contracts...");

    // Load matched contracts
    const matched: MatchedContract[] = JSON.parse(
      fs.readFileSync(matchedPath, "utf-8"),
    );

    console.log(`   ✅ Loaded ${matched.length} matched contracts\n`);

    // Validate all contracts
    console.log("✅ Validating contracts...");
    const validContracts: MatchedContract[] = [];
    const invalidContracts: Array<{
      contract: MatchedContract;
      errors: string[];
    }> = [];

    for (const contract of matched) {
      const errors = this.validateContract(contract);

      if (errors.length === 0) {
        validContracts.push(contract);
      } else {
        invalidContracts.push({ contract, errors });
      }
    }

    console.log(`   ✅ Valid: ${validContracts.length}`);
    console.log(`   ❌ Invalid: ${invalidContracts.length}\n`);

    if (invalidContracts.length > 0) {
      console.log("⚠️  Invalid contracts:");
      invalidContracts.slice(0, 5).forEach(({ contract, errors }) => {
        console.log(`   - ${contract.player_name}: ${errors.join(", ")}`);
      });
      console.log();
    }

    // Check for existing contracts - load in batches
    console.log("🔍 Checking for existing contracts...");

    const checkBatchSize = 1000;
    let checkOffset = 0;
    let allExistingContracts: any[] = [];

    while (true) {
      const { data, error } = await this.supabase
        .from("contracts")
        .select("player_id")
        .eq("season_id", this.templateSeasonId!)
        .range(checkOffset, checkOffset + checkBatchSize - 1);

      if (error) {
        throw new Error(`Failed to check existing contracts: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allExistingContracts = allExistingContracts.concat(data);
      checkOffset += checkBatchSize;

      if (data.length < checkBatchSize) {
        break;
      }
    }

    const existingPlayerIds = new Set(
      allExistingContracts.map((c) => c.player_id),
    );
    console.log(`   ℹ️  Found ${existingPlayerIds.size} existing contracts\n`);

    // Filter out duplicates
    const newContracts = validContracts.filter(
      (c) => !existingPlayerIds.has(c.player_id),
    );

    console.log(`📝 Inserting ${newContracts.length} new contracts...\n`);

    if (newContracts.length === 0) {
      console.log("✅ No new contracts to insert.\n");
      return;
    }

    // Transform to database format
    const contractsToInsert = newContracts.map((contract) => ({
      player_id: contract.player_id,
      team_id: this.teamMapping[contract.team_abbr],
      season_id: this.templateSeasonId!,
      total_value: contract.total_value,
      years_remaining: contract.years_remaining,
      annual_salary: contract.annual_salary,
      guaranteed_money: contract.guaranteed_money,
      signing_bonus: contract.signing_bonus,
      cap_hit: contract.cap_hit,
    }));

    // Insert in batches to avoid timeout
    const batchSize = 100;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < contractsToInsert.length; i += batchSize) {
      const batch = contractsToInsert.slice(i, i + batchSize);

      const { data, error } = await this.supabase
        .from("contracts")
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
          `   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} contracts`,
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SEEDING SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Contracts Loaded:  ${matched.length}`);
    console.log(`Valid Contracts:         ${validContracts.length}`);
    console.log(
      `Already Existed:         ${validContracts.length - newContracts.length}`,
    );
    console.log(`Newly Inserted:          ${inserted}`);
    console.log(`Failed:                  ${failed}`);
    console.log("=".repeat(60) + "\n");
  }

  async generateReport(outputPath: string) {
    console.log("📊 Generating contract report...\n");

    // Get contract counts by team
    const { data: contracts } = await this.supabase
      .from("contracts")
      .select("team_id, teams(abbreviation)")
      .eq("season_id", this.templateSeasonId!);

    if (!contracts) {
      console.log("   ⚠️  No contracts found\n");
      return;
    }

    // Count by team
    const teamCounts: Record<string, number> = {};
    contracts.forEach((contract: any) => {
      const abbr = contract.teams?.abbreviation || "UNKNOWN";
      teamCounts[abbr] = (teamCounts[abbr] || 0) + 1;
    });

    // Generate report
    const report = {
      total_contracts: contracts.length,
      contracts_by_team: Object.entries(teamCounts)
        .map(([team, count]) => ({ team, count }))
        .sort((a, b) => b.count - a.count),
      teams_with_contracts: Object.keys(teamCounts).length,
      average_per_team: (
        contracts.length / Object.keys(teamCounts).length
      ).toFixed(1),
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log("✅ Contract Report:");
    console.log(`   Total Contracts: ${report.total_contracts}`);
    console.log(`   Teams: ${report.teams_with_contracts}`);
    console.log(`   Average per Team: ${report.average_per_team}`);
    console.log(`\n   Report saved: ${outputPath}\n`);

    // Show teams with most contracts
    console.log("   Top 5 Teams by Contract Count:");
    report.contracts_by_team.slice(0, 5).forEach(({ team, count }) => {
      console.log(`     ${team}: ${count}`);
    });
    console.log();
  }
}

async function main() {
  try {
    const seeder = new ContractSeeder();

    // Initialize
    await seeder.initialize();

    // Seed contracts
    const matchedPath = "./spotrac_data/processed/matched_contracts.json";

    if (!fs.existsSync(matchedPath)) {
      console.error(`❌ File not found: ${matchedPath}`);
      console.log(
        "   Run match_players.ts first to generate matched contracts.\n",
      );
      process.exit(1);
    }

    await seeder.seedContracts(matchedPath);

    // Generate report
    await seeder.generateReport(
      "./spotrac_data/processed/contract_report.json",
    );

    console.log("🎉 Contract seeding complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
