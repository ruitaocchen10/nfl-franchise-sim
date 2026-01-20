/**
 * League Rosters Page
 * View and compare rosters from all teams in the league
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/layout/Navigation";
import { getFranchiseById, getAllTeams } from "@/app/actions/franchises";
import { getLeagueRosters } from "@/app/actions/roster";
import LeagueRostersView from "./LeagueRostersView";

interface LeagueRostersPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeagueRostersPage({
  params,
}: LeagueRostersPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch franchise details
  const franchise = (await getFranchiseById(id)) as any;
  const team = franchise.team as any;
  const season = franchise.current_season as any;

  // Fetch only user's team roster initially (lazy load others)
  const initialRoster = await getLeagueRosters(id, team.id);

  // Fetch all teams for the team selector
  const allTeams = await getAllTeams();

  return (
    <div className="min-h-screen bg-bg-darkest">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 slide-up">
            <div className="flex items-center gap-4 mb-2">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{
                  backgroundColor: team.primary_color,
                  fontFamily: "var(--font-mono)",
                  boxShadow: `0 4px 16px ${team.primary_color}40`,
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
                  League Rosters
                </h1>
                <p style={{ color: "var(--text-secondary)" }}>
                  {season.year} Season
                </p>
              </div>
            </div>
          </div>

          {/* League Rosters View Component */}
          <LeagueRostersView
            initialRoster={initialRoster}
            franchiseId={id}
            allTeams={allTeams}
            userTeamId={team.id}
          />
        </div>
      </main>
    </div>
  );
}
