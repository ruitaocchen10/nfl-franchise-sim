/**
 * Roster Page
 * Displays the team's 53-man roster with filtering and sorting
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/layout/Navigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { getFranchiseRoster } from "@/app/actions/roster";
import RosterView from "./RosterView";

interface RosterPageProps {
  params: Promise<{ id: string }>;
}

export default async function RosterPage({ params }: RosterPageProps) {
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

  // Fetch roster
  const roster = await getFranchiseRoster(id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: team.primary_color }}
              >
                {team.abbreviation}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {team.city} {team.name} Roster
                </h1>
                <p className="text-gray-600">
                  {season.year} Season • {roster.length} Players
                </p>
              </div>
            </div>
          </div>

          {/* Roster View Component */}
          <RosterView roster={roster} franchiseId={id} />
        </div>
      </main>
    </div>
  );
}
