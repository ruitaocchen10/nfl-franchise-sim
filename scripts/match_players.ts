/**
 * Player Matching Script
 * Matches Spotrac contract data to database player IDs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

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
  base_salary_2025: number;
  cap_hit_2025: number;
  total_value: number;
  years: number;
  avg_salary: number;
  guaranteed: number;
  signing_bonus: number;
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

interface UnmatchedContract extends SpotracContract {
  team_abbr: string;
  reason: string;
}

class PlayerMatcher {
  private supabase;
  private players: DatabasePlayer[] = [];

  // Position mapping (Spotrac -> Database)
  private positionMapping: Record<string, string> = {
    // Defensive Line
    ED: "DL", // Edge rusher
    DL: "DL",

    // Offensive Line
    G: "OL", // Guard
    C: "OL", // Center
    RT: "OL", // Right tackle
    LT: "OL", // Left tackle
    T: "OL", // Tackle
    OL: "OL",
    LS: "OL", // Long snapper

    // Defensive Backs
    CB: "CB",
    S: "S",
    SS: "S", // Strong safety

    // Linebackers
    LB: "LB",

    // Skill Positions
    QB: "QB",
    RB: "RB",
    FB: "RB", // Fullback
    WR: "WR",
    TE: "TE",

    // Special Teams
    K: "K",
    P: "P",
  };

  // Team abbreviation mapping (Spotrac -> Database)
  private teamMapping: Record<string, string> = {
    ARI: "ARI",
    ATL: "ATL",
    BAL: "BAL",
    BUF: "BUF",
    CAR: "CAR",
    CHI: "CHI",
    CIN: "CIN",
    CLE: "CLE",
    DAL: "DAL",
    DEN: "DEN",
    DET: "DET",
    GB: "GB",
    HOU: "HOU",
    IND: "IND",
    JAX: "JAX",
    KC: "KC",
    LV: "LV",
    LAC: "LAC",
    LAR: "LAR",
    MIA: "MIA",
    MIN: "MIN",
    NE: "NE",
    NO: "NO",
    NYG: "NYG",
    NYJ: "NYJ",
    PHI: "PHI",
    PIT: "PIT",
    SF: "SF",
    SEA: "SEA",
    TB: "TB",
    TEN: "TEN",
    WAS: "WAS",
  };

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async loadPlayers() {
    console.log("📥 Loading players from database...");

    // Load all players in batches to avoid query limits
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

      // Log progress for large datasets
      if (offset % 1000 === 0) {
        console.log(`   📥 Loaded ${allPlayers.length} players so far...`);
      }

      // Break if we got less than a full batch (last batch)
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
  ): { player: DatabasePlayer | null; confidence: "exact" | "fuzzy" | null } {
    const spotracParts = splitName(spotracName);
    const spotracNormalized = normalizeName(spotracName);

    // Map Spotrac position to database position
    const dbPosition = this.positionMapping[spotracPosition] || spotracPosition;

    // Try exact match first
    for (const player of this.players) {
      const dbNormalized = normalizeName(
        `${player.first_name} ${player.last_name}`,
      );

      if (dbNormalized === spotracNormalized) {
        // Position should match using mapped position
        if (player.position === dbPosition) {
          return { player, confidence: "exact" };
        }
      }
    }

    // Try fuzzy match on last name + position + first name match
    // Only allow fuzzy matching if first names are very similar (edit distance <=1)
    let bestMatch: DatabasePlayer | null = null;
    let bestDistance = Infinity;
    const lastNameThreshold = 2; // Max edit distance for last name

    for (const player of this.players) {
      // Must match position (using mapped position)
      if (player.position !== dbPosition) {
        continue;
      }

      const dbFirstName = normalizeName(player.first_name);
      const spotracFirstName = spotracParts.first;

      // First names must be very similar (exact or 1 character difference)
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

      if (lastNameDistance < bestDistance && lastNameDistance <= lastNameThreshold) {
        bestDistance = lastNameDistance;
        bestMatch = player;
      }
    }

    if (bestMatch) {
      return { player: bestMatch, confidence: "fuzzy" };
    }

    return { player: null, confidence: null };
  }

  async processContracts(contractsDir: string): Promise<{
    matched: MatchedContract[];
    unmatched: UnmatchedContract[];
  }> {
    console.log("🔍 Matching contracts to players...\n");

    const matched: MatchedContract[] = [];
    const unmatched: UnmatchedContract[] = [];

    // Read all team JSON files
    const files = fs
      .readdirSync(contractsDir)
      .filter((f) => f.endsWith(".json") && f !== "_summary.json");

    for (const file of files) {
      const filepath = path.join(contractsDir, file);
      const data: TeamData = JSON.parse(fs.readFileSync(filepath, "utf-8"));

      console.log(`📋 ${data.team_abbr}: ${data.contracts.length} contracts`);

      for (const contract of data.contracts) {
        const { player, confidence } = this.matchPlayer(
          contract.player_name,
          contract.position,
        );

        if (player && confidence) {
          matched.push({
            player_id: player.id,
            player_name: contract.player_name,
            team_abbr: data.team_abbr,
            position: contract.position,
            total_value: contract.total_value,
            years_remaining: contract.years,
            annual_salary: contract.avg_salary,
            guaranteed_money: contract.guaranteed,
            signing_bonus: contract.signing_bonus,
            cap_hit: contract.cap_hit_2025,
            match_confidence: confidence,
          });
        } else {
          unmatched.push({
            ...contract,
            team_abbr: data.team_abbr,
            reason: "No matching player found in database",
          });
        }
      }

      const teamMatched = matched.filter(
        (m) => m.team_abbr === data.team_abbr,
      ).length;
      const teamUnmatched = unmatched.filter(
        (u) => u.team_abbr === data.team_abbr,
      ).length;
      console.log(
        `   ✅ Matched: ${teamMatched} | ⚠️  Unmatched: ${teamUnmatched}\n`,
      );
    }

    return { matched, unmatched };
  }

  exportResults(
    matched: MatchedContract[],
    unmatched: UnmatchedContract[],
    outputDir: string,
  ) {
    fs.mkdirSync(outputDir, { recursive: true });

    // Export matched contracts
    const matchedPath = path.join(outputDir, "matched_contracts.json");
    fs.writeFileSync(matchedPath, JSON.stringify(matched, null, 2));

    // Export unmatched for manual review
    const unmatchedPath = path.join(outputDir, "unmatched_contracts.json");
    fs.writeFileSync(unmatchedPath, JSON.stringify(unmatched, null, 2));

    // Create summary
    const summary = {
      total_contracts: matched.length + unmatched.length,
      matched: matched.length,
      unmatched: unmatched.length,
      match_rate: `${((matched.length / (matched.length + unmatched.length)) * 100).toFixed(1)}%`,
      exact_matches: matched.filter((m) => m.match_confidence === "exact")
        .length,
      fuzzy_matches: matched.filter((m) => m.match_confidence === "fuzzy")
        .length,
    };

    const summaryPath = path.join(outputDir, "_match_summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("📊 MATCHING SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Contracts:  ${summary.total_contracts}`);
    console.log(`Matched:          ${summary.matched} (${summary.match_rate})`);
    console.log(`  - Exact:        ${summary.exact_matches}`);
    console.log(`  - Fuzzy:        ${summary.fuzzy_matches}`);
    console.log(`Unmatched:        ${summary.unmatched}`);
    console.log("=".repeat(60));
    console.log(`\n✅ Matched contracts: ${matchedPath}`);
    console.log(`⚠️  Unmatched contracts: ${unmatchedPath}`);
    console.log(`📊 Summary: ${summaryPath}\n`);
  }
}

async function main() {
  try {
    const matcher = new PlayerMatcher();

    // Load players from database
    await matcher.loadPlayers();

    // Process contracts
    const contractsDir = "./spotrac_data/contracts";
    const { matched, unmatched } = await matcher.processContracts(contractsDir);

    // Export results
    matcher.exportResults(matched, unmatched, "./spotrac_data/processed");

    if (unmatched.length > 0) {
      console.log("⚠️  Some contracts could not be matched automatically.");
      console.log("   Review unmatched_contracts.json for manual matching.\n");
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
