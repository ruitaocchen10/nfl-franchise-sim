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

  const { data: teams } = await supabase.from("teams").select("*");
  const { data: templateSeason } = await supabase.from("seasons").select("id").eq("is_template", true).eq("year", 2025).single();
  const { data: standings } = await supabase.from("team_standings").select("*").eq("season_id", templateSeason!.id);

  console.log("\nTesting different years:\n");

  for (const testYear of [2026, 2027, 2028]) {
    console.log(`\n==== YEAR ${testYear} (mod 3 = ${testYear % 3}) ====`);
    generateRegularSeasonSchedule(teams!, "test", testYear, standings || undefined);
  }
}

main();
