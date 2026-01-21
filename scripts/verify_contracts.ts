/**
 * Contract Verification Script
 * Verifies contract data and identifies free agents
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import type { Database } from "@/lib/types/database.types";

class ContractVerifier {
  private supabase;
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

    const { data: season, error } = await this.supabase
      .from("seasons")
      .select("id")
      .eq("is_template", true)
      .single();

    if (error || !season) {
      throw new Error("Template season not found");
    }

    this.templateSeasonId = season.id;
    console.log(`   ✅ Template season: ${season.id}\n`);
  }

  async verifyContracts() {
    console.log("🔍 Verifying contracts...\n");

    // Get all contracts in batches
    const batchSize = 1000;
    let offset = 0;
    let allContracts: any[] = [];

    while (true) {
      const { data, error } = await this.supabase
        .from("contracts")
        .select(
          `
          id,
          player_id,
          team_id,
          total_value,
          years_remaining,
          annual_salary,
          guaranteed_money,
          cap_hit,
          teams(abbreviation),
          players(first_name, last_name, position)
        `,
        )
        .eq("season_id", this.templateSeasonId!)
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw new Error(`Failed to load contracts: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allContracts = allContracts.concat(data);
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    const contracts = allContracts;
    console.log(`   ✅ Found ${contracts?.length || 0} contracts\n`);

    // Verify data integrity
    const issues: Array<{ player: string; issue: string }> = [];

    contracts?.forEach((contract: any) => {
      const playerName = `${contract.players?.first_name} ${contract.players?.last_name}`;

      // Check for data issues
      if (contract.guaranteed_money > contract.total_value) {
        issues.push({
          player: playerName,
          issue: `Guaranteed (${contract.guaranteed_money}) > Total (${contract.total_value})`,
        });
      }

      if (contract.cap_hit < 0) {
        issues.push({
          player: playerName,
          issue: `Negative cap hit: ${contract.cap_hit}`,
        });
      }

      if (contract.years_remaining <= 0) {
        issues.push({
          player: playerName,
          issue: `Invalid years remaining: ${contract.years_remaining}`,
        });
      }

      if (contract.annual_salary > contract.total_value) {
        issues.push({
          player: playerName,
          issue: `Annual salary (${contract.annual_salary}) > Total (${contract.total_value})`,
        });
      }
    });

    if (issues.length > 0) {
      console.log(`⚠️  Found ${issues.length} data integrity issues:\n`);
      issues.slice(0, 10).forEach(({ player, issue }) => {
        console.log(`   - ${player}: ${issue}`);
      });
      console.log();
    } else {
      console.log("   ✅ No data integrity issues found\n");
    }

    // Contract distribution by team
    const teamDistribution: Record<string, number> = {};
    contracts?.forEach((contract: any) => {
      const team = contract.teams?.abbreviation || "UNKNOWN";
      teamDistribution[team] = (teamDistribution[team] || 0) + 1;
    });

    console.log("📊 Contracts by Team:");
    Object.entries(teamDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([team, count]) => {
        console.log(`   ${team}: ${count} contracts`);
      });
    console.log();

    // Top contracts by value
    const topContracts = contracts
      ?.sort((a: any, b: any) => b.total_value - a.total_value)
      .slice(0, 10);

    console.log("💰 Top 10 Contracts by Value:");
    topContracts?.forEach((contract: any, idx) => {
      const playerName = `${contract.players?.first_name} ${contract.players?.last_name}`;
      const value = contract.total_value;
      const team = contract.teams?.abbreviation;
      console.log(
        `   ${idx + 1}. ${playerName} (${team}): $${(value / 1_000_000).toFixed(1)}M`,
      );
    });
    console.log();

    return contracts;
  }

  async identifyFreeAgents() {
    console.log("🔍 Identifying free agents...\n");

    // Get all players on rosters in batches
    const batchSize = 1000;
    let offset = 0;
    let allRosterPlayers: any[] = [];

    while (true) {
      const { data, error } = await this.supabase
        .from("roster_spots")
        .select(
          `
          player_id,
          team_id,
          status,
          players(id, first_name, last_name, position),
          teams(abbreviation)
        `,
        )
        .eq("season_id", this.templateSeasonId!)
        .eq("status", "active")
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw new Error(`Failed to load roster: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allRosterPlayers = allRosterPlayers.concat(data);
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    const rosterPlayers = allRosterPlayers;

    // Get all contracts in batches
    offset = 0;
    let allContracts: any[] = [];

    while (true) {
      const { data, error } = await this.supabase
        .from("contracts")
        .select("player_id")
        .eq("season_id", this.templateSeasonId!)
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw new Error(`Failed to load contracts: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allContracts = allContracts.concat(data);
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    const contracts = allContracts;

    // Create set of player IDs with contracts
    const playerIdsWithContracts = new Set(
      contracts?.map((c) => c.player_id) || [],
    );

    // Find players without contracts
    const freeAgents =
      rosterPlayers?.filter(
        (spot: any) => !playerIdsWithContracts.has(spot.player_id),
      ) || [];

    console.log(
      `   ✅ Total Active Roster Players: ${rosterPlayers?.length || 0}`,
    );
    console.log(`   ✅ Players with Contracts: ${playerIdsWithContracts.size}`);
    console.log(`   🆓 Free Agents: ${freeAgents.length}\n`);

    // Group by position
    const freeAgentsByPosition: Record<string, number> = {};
    freeAgents.forEach((fa: any) => {
      const position = fa.players?.position || "UNKNOWN";
      freeAgentsByPosition[position] =
        (freeAgentsByPosition[position] || 0) + 1;
    });

    console.log("📊 Free Agents by Position:");
    Object.entries(freeAgentsByPosition)
      .sort(([, a], [, b]) => b - a)
      .forEach(([position, count]) => {
        console.log(`   ${position}: ${count}`);
      });
    console.log();

    // Sample free agents
    console.log("📋 Sample Free Agents (Top 20 by last team):");
    freeAgents.slice(0, 20).forEach((fa: any, idx) => {
      const name = `${fa.players?.first_name} ${fa.players?.last_name}`;
      const position = fa.players?.position;
      const team = fa.teams?.abbreviation;
      console.log(`   ${idx + 1}. ${name} (${position}) - Last team: ${team}`);
    });
    console.log();

    return freeAgents;
  }

  async generateFreeAgentReport(freeAgents: any[], outputPath: string) {
    console.log("📝 Generating free agent report...\n");

    // Get player attributes for free agents
    const playerIds = freeAgents.map((fa: any) => fa.player_id);

    const { data: attributes } = await this.supabase
      .from("player_attributes")
      .select("player_id, overall_rating, age")
      .eq("season_id", this.templateSeasonId!)
      .in("player_id", playerIds);

    // Create map of player_id -> rating
    const ratingsMap: Record<string, { overall: number; age: number }> = {};
    attributes?.forEach((attr) => {
      ratingsMap[attr.player_id] = {
        overall: attr.overall_rating,
        age: attr.age,
      };
    });

    // Build report
    const report = freeAgents
      .map((fa: any) => ({
        player_id: fa.player_id,
        name: `${fa.players?.first_name} ${fa.players?.last_name}`,
        position: fa.players?.position,
        last_team: fa.teams?.abbreviation,
        overall_rating: ratingsMap[fa.player_id]?.overall || 0,
        age: ratingsMap[fa.player_id]?.age || 0,
      }))
      .sort((a, b) => b.overall_rating - a.overall_rating);

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log(`   ✅ Free agent report saved: ${outputPath}`);
    console.log(`   📊 Total free agents: ${report.length}\n`);

    // Show top free agents
    console.log("⭐ Top 10 Free Agents by Rating:");
    report.slice(0, 10).forEach((fa, idx) => {
      console.log(
        `   ${idx + 1}. ${fa.name} (${fa.position}) - ${fa.overall_rating} OVR, ${fa.age} years old`,
      );
    });
    console.log();
  }

  async generateSummary() {
    console.log("📊 Generating Final Summary...\n");

    // Get counts
    const { count: contractCount } = await this.supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("season_id", this.templateSeasonId!);

    const { count: rosterCount } = await this.supabase
      .from("roster_spots")
      .select("*", { count: "exact", head: true })
      .eq("season_id", this.templateSeasonId!)
      .eq("status", "active");

    const freeAgentCount = (rosterCount || 0) - (contractCount || 0);

    console.log("=".repeat(60));
    console.log("📊 CONTRACT SYSTEM SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Active Roster Spots:  ${rosterCount || 0}`);
    console.log(`Players with Contracts:     ${contractCount || 0}`);
    console.log(`Free Agents (No Contract):  ${freeAgentCount}`);
    console.log(
      `Contract Coverage:          ${(((contractCount || 0) / (rosterCount || 1)) * 100).toFixed(1)}%`,
    );
    console.log("=".repeat(60) + "\n");
  }
}

async function main() {
  try {
    const verifier = new ContractVerifier();

    // Initialize
    await verifier.initialize();

    // Verify contracts
    await verifier.verifyContracts();

    // Identify free agents
    const freeAgents = await verifier.identifyFreeAgents();

    // Generate free agent report
    await verifier.generateFreeAgentReport(
      freeAgents,
      "./spotrac_data/processed/free_agents.json",
    );

    // Final summary
    await verifier.generateSummary();

    console.log("🎉 Verification complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
