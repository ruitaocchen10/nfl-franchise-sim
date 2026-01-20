/**
 * Dashboard Page
 * Main hub for authenticated users
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/layout/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import Link from "next/link";
import { getFranchises } from "@/app/actions/franchises";
import DeleteFranchiseButton from "./DeleteFranchiseButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's franchises
  const franchises = await getFranchises();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back! Manage your franchises and build your dynasty.
            </p>
          </div>

          {/* Main Content */}
          {franchises.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  You don't have any franchises yet. Create your first franchise
                  to start your GM career!
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    What You Can Do:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-blue-800">
                    <li>Choose from all 32 NFL teams</li>
                    <li>Manage your 53-man roster</li>
                    <li>Draft future stars</li>
                    <li>Make trades with other teams</li>
                    <li>Simulate games and seasons</li>
                    <li>Build a championship dynasty</li>
                  </ul>
                </div>

                <Link
                  href="/franchises/create"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Create Your First Franchise
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Your Franchises
                </h2>
                <Link
                  href="/franchises/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Create New Franchise
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {franchises.map((franchise: any) => (
                  <FranchiseCard key={franchise.id} franchise={franchise} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface FranchiseCardProps {
  franchise: any;
}

function FranchiseCard({ franchise }: FranchiseCardProps) {
  const team = franchise.team;
  const season = franchise.current_season;

  return (
    <div className="relative">
      <Link href={`/franchise/${franchise.id}`}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: team.primary_color }}
              >
                {team.abbreviation}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">
                  {franchise.franchise_name}
                </CardTitle>
                <p className="text-sm text-gray-600 truncate">
                  {team.city} {team.name}
                </p>
              </div>
              <div className="flex-shrink-0">
                <DeleteFranchiseButton
                  franchiseId={franchise.id}
                  franchiseName={franchise.franchise_name}
                />
              </div>
            </div>
          </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Season</span>
              <span className="font-semibold">{season.year}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phase</span>
              <span className="font-semibold capitalize">{season.phase}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Week</span>
              <span className="font-semibold">{season.current_week}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Difficulty</span>
              <span className="font-semibold capitalize">
                {franchise.difficulty}
              </span>
            </div>

            <div className="pt-3 border-t">
              <div className="text-xs text-gray-500">
                Created {new Date(franchise.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
    </div>
  );
}
