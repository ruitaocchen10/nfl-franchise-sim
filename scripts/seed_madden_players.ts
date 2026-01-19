/**
 * Madden Player Data Seeder
 *
 * Imports player data from JSON files into Supabase
 *
 * Usage:
 *   npm install
 *   npx tsx scripts/seed_madden_players.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

interface PlayerJSON {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  age: number;
  college: string;
  draft_year: number | null;
  draft_round: number | null;
  draft_pick: number | null;
  years_pro: number;
  height: number | null;
  weight: number | null;
  photo_url: string;
  handedness: string;
  team: string;
}

interface PlayerAttributesJSON {
  player_id: string;
  overall: number;
  potential: number;
  injury_prone: number;
  morale: number;
  confidence: number;
  development_trait: string;
  speed: number;
  strength: number;
  stamina: number;
  awareness: number;
  accuracy: number | null;
  arm_strength: number | null;
  throw_power: number | null;
  pocket_presence: number | null;
  hands: number | null;
  route_running: number | null;
  catching: number | null;
  elusiveness: number | null;
  pass_block: number | null;
  run_block: number | null;
  pass_rush: number | null;
  run_stop: number | null;
  tackling: number | null;
  coverage: number | null;
  jumping: number | null;
  play_recognition: number | null;
  kick_power: number | null;
  kick_accuracy: number | null;
}

class MaddenSeeder {
  private supabase: any;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async seedPlayers(
    playersFile: string,
    attributesFile: string,
    seasonId: string,
  ) {
    console.log("🏈 Madden Player Data Seeder");
    console.log("=".repeat(60));

    // Read JSON files
    console.log("\n📖 Reading JSON files...");
    const playersData: PlayerJSON[] = JSON.parse(
      fs.readFileSync(playersFile, "utf-8"),
    );
    const attributesData: PlayerAttributesJSON[] = JSON.parse(
      fs.readFileSync(attributesFile, "utf-8"),
    );

    console.log(`   ✅ ${playersData.length} players`);
    console.log(`   ✅ ${attributesData.length} attribute records`);

    // Get team IDs from database
    console.log("\n🔍 Fetching team IDs...");
    const { data: teams, error: teamsError } = await this.supabase
      .from("teams")
      .select("id, abbreviation");

    if (teamsError) {
      throw new Error(`Failed to fetch teams: ${teamsError.message}`);
    }

    const teamMap = new Map(
      teams.map((team: any) => [team.abbreviation, team.id]),
    );
    console.log(`   ✅ Found ${teamMap.size} teams`);

    // Insert players
    console.log("\n💾 Inserting players...");
    const playerIdMap = new Map<string, string>();
    let insertedCount = 0;

    for (let i = 0; i < playersData.length; i += 100) {
      const batch = playersData.slice(i, i + 100);

      const playersToInsert = batch.map((p) => ({
        first_name: p.first_name,
        last_name: p.last_name,
        position: p.position,
        age: p.age,
        college: p.college || null,
        draft_year: p.draft_year,
        draft_round: p.draft_round,
        draft_pick: p.draft_pick,
        years_pro: p.years_pro,
        height: p.height,
        weight: p.weight,
        photo_url: p.photo_url || null,
        handedness: p.handedness,
      }));

      const { data: insertedPlayers, error: playersError } = await this.supabase
        .from("players")
        .insert(playersToInsert)
        .select("id");

      if (playersError) {
        console.error(
          `   ❌ Error inserting batch ${i / 100 + 1}:`,
          playersError.message,
        );
        continue;
      }

      // Map temporary IDs to real database IDs
      insertedPlayers.forEach((dbPlayer: any, idx: number) => {
        const originalId = batch[idx].id;
        playerIdMap.set(originalId, dbPlayer.id);
      });

      insertedCount += insertedPlayers.length;
      process.stdout.write(
        `\r   📥 Progress: ${insertedCount}/${playersData.length}`,
      );
    }

    console.log(`\n   ✅ Inserted ${insertedCount} players`);

    // Insert player attributes
    console.log("\n💾 Inserting player attributes...");
    let attributesInsertedCount = 0;

    for (let i = 0; i < attributesData.length; i += 100) {
      const batch = attributesData.slice(i, i + 100);

      const attributesToInsert = batch
        .map((attr) => {
          const dbPlayerId = playerIdMap.get(attr.player_id);
          if (!dbPlayerId) {
            console.warn(`   ⚠️  Player ID not found: ${attr.player_id}`);
            return null;
          }

          return {
            player_id: dbPlayerId,
            season_id: seasonId,
            overall: attr.overall,
            potential: attr.potential,
            injury_prone: attr.injury_prone,
            morale: attr.morale,
            confidence: attr.confidence,
            development_trait: attr.development_trait,
            speed: attr.speed,
            strength: attr.strength,
            stamina: attr.stamina,
            awareness: attr.awareness,
            accuracy: attr.accuracy,
            arm_strength: attr.arm_strength,
            throw_power: attr.throw_power,
            pocket_presence: attr.pocket_presence,
            hands: attr.hands,
            route_running: attr.route_running,
            catching: attr.catching,
            elusiveness: attr.elusiveness,
            pass_block: attr.pass_block,
            run_block: attr.run_block,
            pass_rush: attr.pass_rush,
            run_stop: attr.run_stop,
            tackling: attr.tackling,
            coverage: attr.coverage,
            jumping: attr.jumping,
            play_recognition: attr.play_recognition,
            kick_power: attr.kick_power,
            kick_accuracy: attr.kick_accuracy,
          };
        })
        .filter(Boolean);

      const { data: insertedAttrs, error: attrsError } = await this.supabase
        .from("player_attributes")
        .insert(attributesToInsert)
        .select("id");

      if (attrsError) {
        console.error(
          `   ❌ Error inserting batch ${i / 100 + 1}:`,
          attrsError.message,
        );
        continue;
      }

      attributesInsertedCount += insertedAttrs.length;
      process.stdout.write(
        `\r   📥 Progress: ${attributesInsertedCount}/${attributesData.length}`,
      );
    }

    console.log(
      `\n   ✅ Inserted ${attributesInsertedCount} player attributes`,
    );

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Seeding Complete!");
    console.log(`   Players: ${insertedCount}`);
    console.log(`   Attributes: ${attributesInsertedCount}`);
    console.log("=".repeat(60) + "\n");
  }

  async getDefaultSeasonId(franchiseId?: string): Promise<string> {
    // If franchise ID provided, get its current season
    if (franchiseId) {
      const { data: franchise, error } = await this.supabase
        .from("franchises")
        .select("current_season_id")
        .eq("id", franchiseId)
        .single();

      if (!error && franchise?.current_season_id) {
        return franchise.current_season_id;
      }
    }

    // Otherwise, create a template season or use first available
    const { data: seasons } = await this.supabase
      .from("seasons")
      .select("id")
      .eq("is_template", true)
      .limit(1);

    if (seasons && seasons.length > 0) {
      return seasons[0].id;
    }

    // Create a template season
    const { data: newSeason, error } = await this.supabase
      .from("seasons")
      .insert({
        year: 2024,
        current_week: 0,
        phase: "preseason",
        is_template: true,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Failed to create template season: ${error.message}`);
    }

    return newSeason.id;
  }
}

// Main execution
async function main() {
  const dataDir = process.argv[2] || "./madden_data";
  const franchiseId = process.argv[3]; // Optional

  const playersFile = path.join(dataDir, "players.json");
  const attributesFile = path.join(dataDir, "player_attributes.json");

  // Check if files exist
  if (!fs.existsSync(playersFile) || !fs.existsSync(attributesFile)) {
    console.error("❌ Error: JSON files not found!");
    console.log("\nExpected files:");
    console.log(`   - ${playersFile}`);
    console.log(`   - ${attributesFile}`);
    console.log("\nRun the scraper first to generate these files.");
    process.exit(1);
  }

  const seeder = new MaddenSeeder();

  // Get season ID
  console.log("🔍 Finding season...");
  const seasonId = await seeder.getDefaultSeasonId(franchiseId);
  console.log(`   ✅ Using season: ${seasonId}\n`);

  // Seed database
  await seeder.seedPlayers(playersFile, attributesFile, seasonId);
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
});
