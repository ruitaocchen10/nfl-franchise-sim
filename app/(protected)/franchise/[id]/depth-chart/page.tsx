/**
 * Depth Chart Page
 * Displays and manages team depth chart with player reordering
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { getDepthChart } from "@/app/actions/roster";
import DepthChartView from "./DepthChartView";

interface DepthChartPageProps {
  params: Promise<{ id: string }>;
}

export default async function DepthChartPage({ params }: DepthChartPageProps) {
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

  // Fetch depth chart
  const depthChart = await getDepthChart(id);

  return (
    <div className="min-h-screen bg-bg-darkest">
      <FranchiseNavigation
        franchiseId={id}
        teamData={{
          abbreviation: team.abbreviation,
          city: team.city,
          name: team.name,
          primary_color: team.primary_color,
          secondary_color: team.secondary_color,
        }}
        seasonData={{
          year: season.year,
          current_week: season.current_week,
          simulation_date: season.simulation_date,
          phase: season.phase,
        }}
        userEmail={user.email}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 slide-up">
            <h1 className="text-3xl font-bold uppercase tracking-wide" style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)'
            }}>Depth Chart</h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Manage your team's starting lineup and backups
            </p>
          </div>

          {/* Depth Chart Component */}
          <DepthChartView depthChart={depthChart} franchiseId={id} />
        </div>
      </main>
    </div>
  );
}
