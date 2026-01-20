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

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

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

    // Create attribute map for easy lookup
    const attributeMap = new Map(
      attributesData.map((attr) => [attr.player_id, attr]),
    );

    // Insert players
    console.log("\n💾 Inserting players...");
    const playerIdMap = new Map<string, string>();
    const playerTeamMap = new Map<string, string>(); // Store team assignments
    let insertedCount = 0;

    for (let i = 0; i < playersData.length; i += 100) {
      const batch = playersData.slice(i, i + 100);

      const playersToInsert = batch.map((p) => ({
        first_name: p.first_name,
        last_name: p.last_name,
        position: p.position,
        college: p.college || null,
        draft_year: p.draft_year,
        draft_round: p.draft_round,
        draft_pick: p.draft_pick,
        height_inches: p.height,
        weight_lbs: p.weight,
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

      // Map temporary IDs to real database IDs and store team assignments
      insertedPlayers.forEach((dbPlayer: any, idx: number) => {
        const originalPlayer = batch[idx];
        playerIdMap.set(originalPlayer.id, dbPlayer.id);
        playerTeamMap.set(dbPlayer.id, originalPlayer.team);
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

    for (let i = 0; i < playersData.length; i += 100) {
      const batch = playersData.slice(i, i + 100);

      const attributesToInsert = batch
        .map((player) => {
          const dbPlayerId = playerIdMap.get(player.id);
          const attr = attributeMap.get(player.id);

          if (!dbPlayerId || !attr) {
            console.warn(
              `   ⚠️  Player or attributes not found: ${player.id}`,
            );
            return null;
          }

          // Helper to clamp values to valid range (40-99)
          const clamp = (val: number) => Math.max(40, Math.min(99, val));

          return {
            player_id: dbPlayerId,
            season_id: seasonId,
            age: player.age,
            overall_rating: clamp(attr.overall),
            speed: clamp(attr.speed),
            strength: clamp(attr.strength),
            agility: clamp(attr.stamina), // Map stamina to agility
            awareness: clamp(attr.awareness),
            injury_prone: Math.max(0, Math.min(99, attr.injury_prone)),
            development_trait: attr.development_trait,
            morale: Math.max(0, Math.min(100, attr.morale)),
            years_pro: player.years_pro,
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
        `\r   📥 Progress: ${attributesInsertedCount}/${playersData.length}`,
      );
    }

    console.log(
      `\n   ✅ Inserted ${attributesInsertedCount} player attributes`,
    );

    // Create roster spots
    console.log("\n💾 Creating roster assignments...");
    let rosterSpotsCount = 0;

    // Get all player IDs with their teams
    const playerRosterData: Array<{
      playerId: string;
      teamAbbr: string;
    }> = [];

    playerTeamMap.forEach((teamAbbr, playerId) => {
      playerRosterData.push({ playerId, teamAbbr });
    });

    for (let i = 0; i < playerRosterData.length; i += 100) {
      const batch = playerRosterData.slice(i, i + 100);

      const rosterSpotsToInsert = batch
        .map((item) => {
          const teamId = teamMap.get(item.teamAbbr);
          if (!teamId) {
            console.warn(`   ⚠️  Team not found: ${item.teamAbbr}`);
            return null;
          }

          return {
            season_id: seasonId,
            team_id: teamId,
            player_id: item.playerId,
            status: "active",
            depth_position: 1, // Will be set properly later by depth chart logic
          };
        })
        .filter(Boolean);

      const { data: insertedSpots, error: spotsError } = await this.supabase
        .from("roster_spots")
        .insert(rosterSpotsToInsert)
        .select("id");

      if (spotsError) {
        console.error(
          `   ❌ Error inserting batch ${i / 100 + 1}:`,
          spotsError.message,
        );
        continue;
      }

      rosterSpotsCount += insertedSpots.length;
      process.stdout.write(
        `\r   📥 Progress: ${rosterSpotsCount}/${playerRosterData.length}`,
      );
    }

    console.log(`\n   ✅ Created ${rosterSpotsCount} roster assignments`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Seeding Complete!");
    console.log(`   Players: ${insertedCount}`);
    console.log(`   Attributes: ${attributesInsertedCount}`);
    console.log(`   Roster Spots: ${rosterSpotsCount}`);
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
