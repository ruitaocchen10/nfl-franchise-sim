/**
 * Debug script to see which teams are getting which matchups
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { generateRegularSeasonSchedule } from "@/lib/schedule/scheduleGenerator";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Load teams
  const { data: teams } = await supabase.from("teams").select("*");
  const { data: standings } = await supabase
    .from("team_standings")
    .select("*")
    .eq("season_id", (await supabase.from("seasons").select("id").eq("is_template", true).eq("year", 2025).single()).data!.id);

  if (!teams) return;

  // Generate schedule
  generateRegularSeasonSchedule(teams, "test", 2026, standings || undefined);

  // Count games per team manually
  console.log("\n🔍 NFC East Teams:");
  const nfcEast = teams.filter(t => t.conference === "NFC" && t.division === "East");
  nfcEast.forEach(t => console.log(`   ${t.abbreviation}`));

  console.log("\n🔍 NFC West Teams:");
  const nfcWest = teams.filter(t => t.conference === "NFC" && t.division === "West");
  nfcWest.forEach(t => console.log(`   ${t.abbreviation}`));
}

main();
