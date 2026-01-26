/**
 * Schedule Generator Test Script
 *
 * Tests the schedule generator with real team and standings data
 *
 * Usage:
 *   npx tsx scripts/test_schedule_generator.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { generateRegularSeasonSchedule } from "@/lib/schedule/scheduleGenerator";

type Team = Database["public"]["Tables"]["teams"]["Row"];
type Standing = Database["public"]["Tables"]["team_standings"]["Row"];

class ScheduleGeneratorTester {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
      );
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async loadTeams(): Promise<Team[]> {
    console.log("📥 Loading teams from database...");

    const { data: teams, error } = await this.supabase
      .from("teams")
      .select("*")
      .order("conference", { ascending: true })
      .order("division", { ascending: true });

    if (error) {
      throw new Error(`Failed to load teams: ${error.message}`);
    }

    if (!teams || teams.length !== 32) {
      throw new Error(`Expected 32 teams, got ${teams?.length || 0}`);
    }

    console.log(`   ✅ Loaded ${teams.length} teams\n`);
    return teams;
  }

  async loadStandings(): Promise<Standing[] | undefined> {
    console.log("📊 Loading previous season standings...");

    // Get 2025 template season
    const { data: templateSeason } = await this.supabase
      .from("seasons")
      .select("id")
      .eq("is_template", true)
      .eq("year", 2025)
      .single();

    if (!templateSeason) {
      console.log("   ⚠️  No template season found, will use default rankings\n");
      return undefined;
    }

    const { data: standings, error } = await this.supabase
      .from("team_standings")
      .select("*")
      .eq("season_id", templateSeason.id);

    if (error || !standings || standings.length === 0) {
      console.log("   ⚠️  No standings found, will use default rankings\n");
      return undefined;
    }

    console.log(`   ✅ Loaded ${standings.length} team standings\n`);
    return standings;
  }

  analyzeResults(
    teams: Team[],
    byeWeeks: any[],
    allMatchups: any[]
  ): void {
    console.log("\n" + "=".repeat(70));
    console.log("SCHEDULE GENERATOR TEST RESULTS");
    console.log("=".repeat(70));

    // Bye weeks analysis
    console.log("\n📅 BYE WEEKS:");
    console.log(`   Total: ${byeWeeks.length}`);
    console.log(`   Expected: 32 (one per team)`);

    const byeWeekCounts = new Map<number, number>();
    byeWeeks.forEach((bye) => {
      byeWeekCounts.set(
        bye.bye_week_number,
        (byeWeekCounts.get(bye.bye_week_number) || 0) + 1
      );
    });

    console.log(`\n   Distribution:`);
    for (let week = 6; week <= 13; week++) {
      const count = byeWeekCounts.get(week) || 0;
      console.log(`      Week ${week}: ${count} teams`);
    }

    // Count games per team
    console.log("\n🏈 GAMES PER TEAM:");
    const teamGameCounts = new Map<string, number>();
    const teamHomeGames = new Map<string, number>();
    const teamAwayGames = new Map<string, number>();

    teams.forEach((team) => {
      teamGameCounts.set(team.id, 0);
      teamHomeGames.set(team.id, 0);
      teamAwayGames.set(team.id, 0);
    });

    allMatchups.forEach((matchup) => {
      teamGameCounts.set(
        matchup.home_team_id,
        (teamGameCounts.get(matchup.home_team_id) || 0) + 1
      );
      teamGameCounts.set(
        matchup.away_team_id,
        (teamGameCounts.get(matchup.away_team_id) || 0) + 1
      );

      teamHomeGames.set(
        matchup.home_team_id,
        (teamHomeGames.get(matchup.home_team_id) || 0) + 1
      );
      teamAwayGames.set(
        matchup.away_team_id,
        (teamAwayGames.get(matchup.away_team_id) || 0) + 1
      );
    });

    // Find teams with incorrect game counts
    const incorrectTeams = teams.filter(
      (team) => teamGameCounts.get(team.id) !== 17
    );

    if (incorrectTeams.length === 0) {
      console.log(`   ✅ All teams have exactly 17 games`);
    } else {
      console.log(`   ❌ ${incorrectTeams.length} teams with incorrect game counts:`);
      incorrectTeams.forEach((team) => {
        const total = teamGameCounts.get(team.id) || 0;
        const home = teamHomeGames.get(team.id) || 0;
        const away = teamAwayGames.get(team.id) || 0;
        console.log(
          `      ${team.abbreviation}: ${total} games (${home} home, ${away} away)`
        );
      });
    }

    // Games by type
    console.log("\n🎯 GAMES BY TYPE:");
    const typeCounts = new Map<string, number>();
    allMatchups.forEach((m) => {
      typeCounts.set(m.matchup_type, (typeCounts.get(m.matchup_type) || 0) + 1);
    });

    const expectedCounts: { [key: string]: number } = {
      divisional: 96,
      intra_conference_rotating: 64,
      intra_conference_standings: 32,
      inter_conference_rotating: 64,
      inter_conference_17th: 16,
    };

    typeCounts.forEach((count, type) => {
      const expected = expectedCounts[type] || "?";
      const status = count === expected ? "✅" : "❌";
      console.log(`   ${status} ${type}: ${count} (expected: ${expected})`);
    });

    // Total games
    console.log("\n📊 TOTALS:");
    console.log(`   Total matchups: ${allMatchups.length}`);
    console.log(`   Expected: 272 (32 teams × 17 games ÷ 2)`);
    const totalStatus = allMatchups.length === 272 ? "✅" : "❌";
    console.log(`   Status: ${totalStatus}`);

    // Sample games by division
    console.log("\n📋 SAMPLE MATCHUPS BY TYPE:");
    const sampleByType: { [key: string]: any[] } = {};

    allMatchups.forEach((matchup) => {
      if (!sampleByType[matchup.matchup_type]) {
        sampleByType[matchup.matchup_type] = [];
      }
      if (sampleByType[matchup.matchup_type].length < 3) {
        sampleByType[matchup.matchup_type].push(matchup);
      }
    });

    Object.entries(sampleByType).forEach(([type, matches]) => {
      console.log(`\n   ${type}:`);
      matches.forEach((m) => {
        const homeTeam = teams.find((t) => t.id === m.home_team_id);
        const awayTeam = teams.find((t) => t.id === m.away_team_id);
        console.log(
          `      ${homeTeam?.abbreviation} vs ${awayTeam?.abbreviation}`
        );
      });
    });

    console.log("\n" + "=".repeat(70));

    // Final verdict
    const allCorrect =
      incorrectTeams.length === 0 &&
      allMatchups.length === 272 &&
      byeWeeks.length === 32;

    if (allCorrect) {
      console.log("✅ ALL TESTS PASSED!");
    } else {
      console.log("❌ SOME TESTS FAILED - See details above");
    }

    console.log("=".repeat(70) + "\n");
  }

  async runTest(): Promise<void> {
    console.log("\n🧪 Starting Schedule Generator Test\n");

    // Load teams
    const teams = await this.loadTeams();

    // Load standings (optional)
    const standings = await this.loadStandings();

    // Test with year 2026
    const testYear = 2026;
    const testSeasonId = "test-season-id";

    console.log(`📅 Testing schedule generation for year ${testYear}...\n`);

    // Generate schedule
    const { games, byeWeeks } = generateRegularSeasonSchedule(
      teams,
      testSeasonId,
      testYear,
      standings
    );

    // Note: games array is currently empty because Phase 2 isn't implemented
    console.log("\n⚠️  Note: Phase 2 (week assignment) is not yet implemented");
    console.log("   Testing Phase 1 (matchup generation) only\n");

    // For now, we need to manually call the matchup generation to get the data
    // This is a workaround until Phase 2 is implemented
    console.log("ℹ️  Analyzing matchup generation from console output above...\n");

    // Analyze results
    // Note: We can't fully analyze since games array is empty
    // But the console output from generateRegularSeasonSchedule shows the validation
  }
}

async function main() {
  try {
    const tester = new ScheduleGeneratorTester();
    await tester.runTest();

    console.log("🎉 Test complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
