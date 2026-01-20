/**
 * Franchise Detail Page
 * Main hub for a specific franchise - shows overview and quick actions
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/layout/Navigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import Link from "next/link";

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

  // Fetch franchise details
  const franchise = (await getFranchiseById(id)) as any;

  // Type guard for team and season
  const team = franchise.team as any;
  const season = franchise.current_season as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with team branding */}
          <div className="mb-6 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: team.primary_color }}
            >
              {team.abbreviation}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {franchise.franchise_name}
              </h1>
              <p className="text-gray-600">
                {team.city} {team.name} • {season.year} Season
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Season</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {season.year}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Phase</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {season.phase}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {season.current_week}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Difficulty</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {franchise.difficulty}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Getting Started Guide */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Your Franchise!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Your franchise has been created successfully! You're
                      starting in the{" "}
                      <span className="font-semibold">{season.phase}</span>{" "}
                      phase of the {season.year} season.
                    </p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-2">
                        ✓ Roster Loaded!
                      </h3>
                      <p className="text-sm text-green-800 mb-3">
                        Your team's roster has been populated with player data.
                        Click on "Roster" above to view your players.
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Next Steps
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            <strong>View your roster:</strong> Check out your
                            team's players, ratings, and attributes
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">2.</span>
                          <span>
                            <strong>Set your depth chart:</strong> Organize your
                            starting lineup and backups (coming soon)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">3.</span>
                          <span>
                            <strong>Simulate games:</strong> Progress through
                            the season and compete for the playoffs (coming
                            soon)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600">4.</span>
                          <span>
                            <strong>Make moves:</strong> Trade players, sign
                            free agents, and draft rookies (coming soon)
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <QuickActionButton
                      href={`/franchise/${id}/roster`}
                      title="Roster"
                      description="View your players"
                      disabled={false}
                    />
                    <QuickActionButton
                      href={`/franchise/${id}/depth-chart`}
                      title="Depth Chart"
                      description="Set your lineup"
                      disabled={true}
                    />
                    <QuickActionButton
                      href={`/franchise/${id}/schedule`}
                      title="Schedule"
                      description="Simulate games"
                      disabled={true}
                    />
                    <QuickActionButton
                      href="/dashboard"
                      title="Back to Dashboard"
                      description="View all franchises"
                      disabled={false}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Team Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Conference</p>
                      <p className="font-semibold">{team.conference}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Division</p>
                      <p className="font-semibold">
                        {team.conference} {team.division}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Team Colors</p>
                      <div className="flex gap-2 mt-1">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: team.primary_color }}
                          title={team.primary_color}
                        />
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: team.secondary_color }}
                          title={team.secondary_color}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface QuickActionButtonProps {
  href: string;
  title: string;
  description: string;
  disabled?: boolean;
}

function QuickActionButton({
  href,
  title,
  description,
  disabled = false,
}: QuickActionButtonProps) {
  const baseClasses =
    "block w-full px-4 py-3 rounded-lg border text-left transition-colors";
  const enabledClasses =
    "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50";
  const disabledClasses =
    "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed";

  const content = (
    <>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600 mt-0.5">{description}</p>
      {disabled && (
        <span className="inline-block mt-1 text-xs text-gray-500">
          Coming soon
        </span>
      )}
    </>
  );

  if (disabled) {
    return <div className={`${baseClasses} ${disabledClasses}`}>{content}</div>;
  }

  return (
    <Link href={href} className={`${baseClasses} ${enabledClasses}`}>
      {content}
    </Link>
  );
}
