/**
 * Deduplicates matched_contracts.json by removing duplicate player_ids
 * Keeps the first occurrence of each player
 */

import fs from "fs";

const inputPath = "./spotrac_data/processed/matched_contracts.json";
const outputPath = "./spotrac_data/processed/matched_contracts.json";

// Read the matched contracts
const contracts = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

console.log(`📋 Total contracts: ${contracts.length}`);

// Deduplicate by player_id
const seenPlayerIds = new Set<string>();
const uniqueContracts: any[] = [];
const duplicates: any[] = [];

contracts.forEach((contract: any) => {
  if (seenPlayerIds.has(contract.player_id)) {
    duplicates.push(contract);
  } else {
    seenPlayerIds.add(contract.player_id);
    uniqueContracts.push(contract);
  }
});

console.log(`✅ Unique contracts: ${uniqueContracts.length}`);
console.log(`❌ Duplicates removed: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log("\nDuplicates that were removed:");
  duplicates.forEach((dup, idx) => {
    console.log(
      `  ${idx + 1}. ${dup.player_name} (${dup.position}) - ${dup.team_abbr}`,
    );
  });
}

// Write back to file
fs.writeFileSync(outputPath, JSON.stringify(uniqueContracts, null, 2));

console.log(`\n✅ Deduplicated contracts saved to: ${outputPath}`);
