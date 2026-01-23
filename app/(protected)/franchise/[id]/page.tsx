/**
 * Franchise Detail Page
 * Main hub for a specific franchise - shows overview and quick actions
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import {
  getFranchiseById,
  getTeamStandings,
  getNextGame,
  getTeamOverallRating,
  getRosterSize,
} from "@/app/actions/franchises";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import QuickActionButton from "./QuickActionButton";
import QuickStats from "./QuickStats";
import UpcomingEvent from "./UpcomingEvent";
import PhaseInfo from "./PhaseInfo";
import LeagueNews from "./LeagueNews";

interface FranchisePageProps {
  params: Promise<{ id: string }>;
}

export default async function FranchisePage({ params }: FranchisePageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch franchise details with season info
  const franchise = (await getFranchiseById(id)) as any;

  // Type guard for team and season
  const team = franchise.team as any;
  const season = franchise.current_season as any;

  // Extract season data for UpcomingEvent
  const seasonData = {
    phase: season.phase,
    simulationDate: season.simulation_date,
    currentWeek: season.current_week,
    year: season.year,
    tradeDeadlinePassed: season.trade_deadline_passed,
  };

  // Fetch additional data
  const [standings, nextGame, overallRating, rosterSize] = await Promise.all([
    getTeamStandings(id, team.id),
    getNextGame(id, team.id),
    getTeamOverallRating(id, team.id),
    getRosterSize(id, team.id),
  ]);

  // Calculate games played
  const gamesPlayed = standings ? standings.wins + standings.losses + standings.ties : 0;

  return (
    <div className="min-h-screen bg-bg-darkest">
      <FranchiseNavigation franchiseId={id} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with team badge and name */}
          <div className="mb-6 slide-up">
            <div className="flex items-center gap-4 mb-2">
              <div
                className="w-16 h-16 rounded-none flex items-center justify-center text-white font-bold text-2xl border-2"
                style={{
                  backgroundColor: team.primary_color,
                  fontFamily: "var(--font-mono)",
                  boxShadow: `0 2px 8px ${team.primary_color}40, inset 0 -2px 4px rgba(0,0,0,0.3)`,
                  borderColor: `${team.primary_color}`,
                  filter: 'brightness(1.1)',
                }}
              >
                {team.abbreviation}
              </div>
              <div>
                <h1
                  className="text-3xl font-bold uppercase tracking-wide"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                  }}
                >
                  {team.city} {team.name}
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>
                  {season.year} season
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <QuickStats
            phase={season.phase}
            teamData={{
              overallRating,
            }}
            standingsData={standings}
            rosterSize={rosterSize}
          />

          {/* Main Content - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Upcoming Event */}
              <UpcomingEvent
                upcomingGame={nextGame}
                franchiseId={id}
                phase={seasonData.phase}
                simulationDate={seasonData.simulationDate}
                currentWeek={seasonData.currentWeek}
                year={seasonData.year}
                tradeDeadlinePassed={seasonData.tradeDeadlinePassed}
              />

              {/* Phase Info */}
              <PhaseInfo
                phase={season.phase}
                teamLeaders={null}
                standingsData={standings}
                gamesPlayed={gamesPlayed}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card style={{ background: "var(--bg-medium)" }}>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <QuickActionButton
                      href={`/franchise/${id}/roster`}
                      title="Manage Roster"
                      description="View and manage players"
                      disabled={false}
                    />
                    <QuickActionButton
                      href={`/franchise/${id}/depth-chart`}
                      title="Edit Depth Chart"
                      description="Set your lineup"
                      disabled={false}
                    />
                    <QuickActionButton
                      href={`/franchise/${id}/schedule`}
                      title="View Trades"
                      description="Manage trades"
                      disabled={false}
                    />
                    <QuickActionButton
                      href={`/franchise/${id}/schedule`}
                      title="View Free Agents"
                      description="Sign players"
                      disabled={false}
                    />
                    <QuickActionButton
                      href={`/franchise/${id}/schedule`}
                      title="Scout Prospects"
                      description="Draft preparation"
                      disabled={false}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* League News */}
              <LeagueNews />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
