/**
 * Update Player Ages Script
 * Updates player_attributes ages from Spotrac contract data
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import type { Database } from "@/lib/types/database.types";

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Normalize name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/'/g, "")
    .replace(/\s+jr\.?$/i, "")
    .replace(/\s+sr\.?$/i, "")
    .replace(/\s+iii$/i, "")
    .replace(/\s+ii$/i, "")
    .replace(/\s+iv$/i, "")
    .trim();
}

// Split full name into parts
function splitName(fullName: string): { first: string; last: string } {
  const normalized = normalizeName(fullName);
  const parts = normalized.split(/\s+/);

  if (parts.length === 1) {
    return { first: "", last: parts[0] };
  }

  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
}

interface SpotracContract {
  player_name: string;
  position: string;
  age: number | null;
}

interface TeamData {
  team_slug: string;
  team_abbr: string;
  contract_count: number;
  contracts: SpotracContract[];
}

interface DatabasePlayer {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

class AgeUpdater {
  private supabase;
  private players: DatabasePlayer[] = [];
  private templateSeasonId: string | null = null;

  // Position mapping (Spotrac -> Database)
  private positionMapping: Record<string, string> = {
    ED: "DL",
    DL: "DL",
    G: "OL",
    C: "OL",
    RT: "OL",
    LT: "OL",
    T: "OL",
    OL: "OL",
    LS: "OL",
    CB: "CB",
    S: "S",
    SS: "S",
    LB: "LB",
    QB: "QB",
    RB: "RB",
    FB: "RB",
    WR: "WR",
    TE: "TE",
    K: "K",
    P: "P",
  };

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

    // Get template season
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

    // Load all players
    await this.loadPlayers();
  }

  async loadPlayers() {
    console.log("📥 Loading players from database...");

    const batchSize = 1000;
    let offset = 0;
    let allPlayers: DatabasePlayer[] = [];

    while (true) {
      const { data, error } = await this.supabase
        .from("players")
        .select("id, first_name, last_name, position")
        .range(offset, offset + batchSize - 1);

      if (error) {
        throw new Error(`Failed to load players: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allPlayers = allPlayers.concat(data);
      offset += batchSize;

      if (data.length < batchSize) {
        break;
      }
    }

    this.players = allPlayers;
    console.log(`   ✅ Loaded ${this.players.length} players\n`);
  }

  matchPlayer(
    spotracName: string,
    spotracPosition: string,
  ): DatabasePlayer | null {
    const spotracParts = splitName(spotracName);
    const spotracNormalized = normalizeName(spotracName);
    const dbPosition = this.positionMapping[spotracPosition] || spotracPosition;

    // Try exact match first
    for (const player of this.players) {
      const dbNormalized = normalizeName(
        `${player.first_name} ${player.last_name}`,
      );

      if (dbNormalized === spotracNormalized && player.position === dbPosition) {
        return player;
      }
    }

    // Try fuzzy match
    let bestMatch: DatabasePlayer | null = null;
    let bestDistance = Infinity;
    const lastNameThreshold = 2;

    for (const player of this.players) {
      if (player.position !== dbPosition) {
        continue;
      }

      const dbFirstName = normalizeName(player.first_name);
      const spotracFirstName = spotracParts.first;

      const firstNameDistance = levenshteinDistance(
        spotracFirstName,
        dbFirstName,
      );
      if (firstNameDistance > 1) {
        continue;
      }

      const dbLastName = normalizeName(player.last_name);
      const lastNameDistance = levenshteinDistance(
        spotracParts.last,
        dbLastName,
      );

      if (
        lastNameDistance < bestDistance &&
        lastNameDistance <= lastNameThreshold
      ) {
        bestDistance = lastNameDistance;
        bestMatch = player;
      }
    }

    return bestMatch;
  }

  async updateAges(contractsDir: string) {
    console.log("📋 Loading Spotrac contract data...\n");

    const files = fs
      .readdirSync(contractsDir)
      .filter((f) => f.endsWith(".json") && f !== "_summary.json");

    const ageUpdates: Array<{ player_id: string; age: number; name: string }> =
      [];
    let totalContracts = 0;
    let contractsWithAge = 0;
    let matched = 0;
    let unmatched = 0;

    for (const file of files) {
      const filepath = path.join(contractsDir, file);
      const data: TeamData = JSON.parse(fs.readFileSync(filepath, "utf-8"));

      totalContracts += data.contracts.length;

      for (const contract of data.contracts) {
        if (contract.age === null || contract.age === undefined) {
          continue;
        }

        contractsWithAge++;

        const player = this.matchPlayer(
          contract.player_name,
          contract.position,
        );

        if (player) {
          matched++;
          ageUpdates.push({
            player_id: player.id,
            age: contract.age,
            name: contract.player_name,
          });
        } else {
          unmatched++;
        }
      }
    }

    console.log(`   ✅ Total contracts: ${totalContracts}`);
    console.log(`   ✅ Contracts with age: ${contractsWithAge}`);
    console.log(`   ✅ Matched players: ${matched}`);
    console.log(`   ⚠️  Unmatched: ${unmatched}\n`);

    // Deduplicate by player_id (keep first occurrence)
    const uniqueUpdates = new Map<string, { age: number; name: string }>();
    ageUpdates.forEach((update) => {
      if (!uniqueUpdates.has(update.player_id)) {
        uniqueUpdates.set(update.player_id, {
          age: update.age,
          name: update.name,
        });
      }
    });

    console.log(
      `   ✅ Unique players to update: ${uniqueUpdates.size}\n`,
    );

    // Update ages in batches
    console.log("📝 Updating player ages...\n");

    let updated = 0;
    let failed = 0;

    for (const [playerId, { age, name }] of uniqueUpdates) {
      const { error } = await this.supabase
        .from("player_attributes")
        .update({ age })
        .eq("player_id", playerId)
        .eq("season_id", this.templateSeasonId!);

      if (error) {
        console.error(`   ❌ Failed to update ${name}: ${error.message}`);
        failed++;
      } else {
        updated++;
        if (updated % 100 === 0) {
          console.log(`   ✅ Updated ${updated} players...`);
        }
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 AGE UPDATE SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Contracts:         ${totalContracts}`);
    console.log(`Contracts with Age:      ${contractsWithAge}`);
    console.log(`Matched Players:         ${matched}`);
    console.log(`Successfully Updated:    ${updated}`);
    console.log(`Failed:                  ${failed}`);
    console.log("=".repeat(60) + "\n");
  }
}

async function main() {
  try {
    const updater = new AgeUpdater();

    await updater.initialize();

    const contractsDir = "./spotrac_data/contracts";

    if (!fs.existsSync(contractsDir)) {
      console.error(`❌ Directory not found: ${contractsDir}`);
      process.exit(1);
    }

    await updater.updateAges(contractsDir);

    console.log("🎉 Age update complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
