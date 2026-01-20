/**
 * Fix 3-digit overall ratings in player_attributes.json
 *
 * Usage:
 *   npx tsx scripts/fix_player_attributes.ts
 */

import * as fs from "fs";
import * as path from "path";

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

const filePath = path.join(process.cwd(), "madden_data/player_attributes.json");

console.log("🔧 Fixing 3-digit overall ratings...");
console.log(`📄 File: ${filePath}\n`);

// Read the JSON file
const data: PlayerAttributesJSON[] = JSON.parse(
  fs.readFileSync(filePath, "utf-8"),
);

let fixedCount = 0;

data.forEach((player) => {
  if (player.overall >= 100) {
    const originalValue = player.overall;
    // Keep only first 2 digits (e.g., 992 → 99)
    player.overall = Math.floor(player.overall / 10);
    console.log(
      `   ✅ Fixed player ${player.player_id}: ${originalValue} → ${player.overall}`,
    );
    fixedCount++;
  }
});

// Write back to file with pretty formatting
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

console.log(`\n${"=".repeat(60)}`);
console.log(`🎉 Complete! Fixed ${fixedCount} players`);
console.log(`📄 Updated: ${filePath}`);
console.log("=".repeat(60));
