/**
 * One-time Fix: Copy Free Agents to Existing Franchises
 * Copies free agents from template season to all existing franchise seasons
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Load environment variables from .env.local
config({ path: ".env.local" });

class FreeAgentCopier {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async copyFreeAgentsToFranchises() {
    console.log("🔧 Starting free agent copy process...\n");

    // Step 1: Get template season
    console.log("🔍 Finding template season...");
    const { data: templateSeason, error: templateError } = await this.supabase
      .from("seasons")
      .select("id")
      .eq("is_template", true)
      .single();

    if (templateError || !templateSeason) {
      throw new Error("Template season not found");
    }

    console.log(`   ✅ Template season: ${templateSeason.id}\n`);

    // Step 2: Get all template free agents
    console.log("📋 Loading free agents from template...");
    const { data: templateFreeAgents, error: freeAgentsError } =
      await this.supabase
        .from("free_agents")
        .select("*")
        .eq("season_id", templateSeason.id);

    if (freeAgentsError) {
      throw new Error(
        `Failed to load template free agents: ${freeAgentsError.message}`,
      );
    }

    console.log(
      `   ✅ Found ${templateFreeAgents?.length || 0} template free agents\n`,
    );

    if (!templateFreeAgents || templateFreeAgents.length === 0) {
      console.log("⚠️  No template free agents found. Nothing to copy.\n");
      return;
    }

    // Step 3: Get all franchise seasons (excluding template)
    console.log("🔍 Finding franchise seasons...");
    const { data: franchiseSeasons, error: seasonsError } = await this.supabase
      .from("seasons")
      .select("id, franchise_id, year")
      .eq("is_template", false);

    if (seasonsError) {
      throw new Error(
        `Failed to load franchise seasons: ${seasonsError.message}`,
      );
    }

    console.log(
      `   ✅ Found ${franchiseSeasons?.length || 0} franchise seasons\n`,
    );

    if (!franchiseSeasons || franchiseSeasons.length === 0) {
      console.log("⚠️  No franchise seasons found. Nothing to do.\n");
      return;
    }

    // Step 4: Copy free agents to each franchise season
    let totalCopied = 0;
    let totalSkipped = 0;

    for (const season of franchiseSeasons) {
      console.log(
        `📝 Processing season ${season.year} (${season.id.substring(0, 8)}...)`,
      );

      // Check if this season already has free agents
      const { data: existingFreeAgents } = await this.supabase
        .from("free_agents")
        .select("id")
        .eq("season_id", season.id)
        .limit(1);

      if (existingFreeAgents && existingFreeAgents.length > 0) {
        console.log(`   ⏭️  Season already has free agents, skipping\n`);
        totalSkipped++;
        continue;
      }

      // Copy free agents to this season
      const freeAgentsToCopy = templateFreeAgents.map((fa) => ({
        player_id: fa.player_id,
        season_id: season.id,
        previous_team_id: fa.previous_team_id,
        previous_contract_value: fa.previous_contract_value,
        market_value: fa.market_value,
        status: fa.status,
        interested_teams: fa.interested_teams || [],
      }));

      const { error: insertError } = await this.supabase
        .from("free_agents")
        .insert(freeAgentsToCopy);

      if (insertError) {
        console.error(
          `   ❌ Failed to copy free agents: ${insertError.message}`,
        );
        continue;
      }

      console.log(
        `   ✅ Copied ${freeAgentsToCopy.length} free agents to season\n`,
      );
      totalCopied++;
    }

    // Summary
    console.log("=".repeat(60));
    console.log("📊 COPY SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Franchise Seasons Found: ${franchiseSeasons.length}`);
    console.log(`Seasons Updated:                ${totalCopied}`);
    console.log(`Seasons Skipped (already had):  ${totalSkipped}`);
    console.log(`Free Agents per Season:         ${templateFreeAgents.length}`);
    console.log("=".repeat(60) + "\n");
  }
}

async function main() {
  try {
    const copier = new FreeAgentCopier();
    await copier.copyFreeAgentsToFranchises();
    console.log("🎉 Free agent copy complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
