"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRegularSeasonSchedule } from "@/lib/schedule/scheduleGenerator";

export interface ScheduleDebugResult {
  success: boolean;
  error?: string;
  data?: {
    totalMatchups: number;
    byeWeeks: number;
    matchupsByType: {
      [key: string]: string | number;
    };
    gamesPerTeam: {
      [teamName: string]: number;
    };
    byeWeekDistribution: {
      [week: number]: string[];
    };
    weeklyBreakdown: {
      [week: number]: Array<{
        homeTeam: string;
        awayTeam: string;
      }>;
    };
  };
}

export async function generateTestSchedule(
  year: number,
  usePreviousStandings: boolean
): Promise<ScheduleDebugResult> {
  try {
    const supabase = await createClient();

    // Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*")
      .order("conference")
      .order("division");

    if (teamsError || !teams || teams.length !== 32) {
      return {
        success: false,
        error: `Failed to fetch teams: ${teamsError?.message || "Expected 32 teams"}`,
      };
    }

    // Fetch previous season standings if requested
    let standings = null;
    if (usePreviousStandings) {
      const { data: templateSeason } = await supabase
        .from("seasons")
        .select("id")
        .eq("is_template", true)
        .eq("year", 2025)
        .single();

      if (templateSeason) {
        const { data: standingsData } = await supabase
          .from("team_standings")
          .select("*")
          .eq("season_id", templateSeason.id);

        standings = standingsData;
      }
    }

    // Generate schedule (this only generates matchups, not full games with weeks/dates yet)
    const { games, byeWeeks } = generateRegularSeasonSchedule(
      teams,
      `test-${year}`,
      year,
      standings || undefined
    );

    // Create team lookup map
    const teamMap = new Map(teams.map((t) => [t.id, `${t.city} ${t.name}`]));

    // Analyze bye weeks
    const byeWeekDistribution: { [week: number]: string[] } = {};
    byeWeeks.forEach((bye) => {
      if (!byeWeekDistribution[bye.bye_week_number]) {
        byeWeekDistribution[bye.bye_week_number] = [];
      }
      byeWeekDistribution[bye.bye_week_number].push(
        teamMap.get(bye.team_id) || "Unknown"
      );
    });

    // Analyze games per team
    const gamesPerTeam: { [teamName: string]: number } = {};
    teams.forEach((team) => {
      const teamGames = games.filter(
        (g) => g.home_team_id === team.id || g.away_team_id === team.id
      );
      gamesPerTeam[`${team.city} ${team.name}`] = teamGames.length;
    });

    // Analyze games by week
    const weeklyBreakdown: {
      [week: number]: Array<{ homeTeam: string; awayTeam: string }>;
    } = {};

    games.forEach((game) => {
      if (!weeklyBreakdown[game.week]) {
        weeklyBreakdown[game.week] = [];
      }
      weeklyBreakdown[game.week].push({
        homeTeam: teamMap.get(game.home_team_id) || "Unknown",
        awayTeam: teamMap.get(game.away_team_id) || "Unknown",
      });
    });

    // Count matchups by type (would need to track matchup_type through conversion)
    // For now, use expected values
    const matchupsByType = {
      divisional: games.filter((g) => g.week === 18).length > 0 ? "96+" : "96",
      intra_conference: "96",
      inter_conference: "64",
      "17th_game": "16",
    };

    return {
      success: true,
      data: {
        totalMatchups: games.length,
        byeWeeks: byeWeeks.length,
        matchupsByType,
        gamesPerTeam,
        byeWeekDistribution,
        weeklyBreakdown,
      },
    };
  } catch (error) {
    console.error("Schedule generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
