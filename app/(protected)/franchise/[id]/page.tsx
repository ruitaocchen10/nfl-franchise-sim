/**
 * Franchise Detail Page
 * Main hub for a specific franchise - shows overview and quick actions
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import QuickActionButton from "./QuickActionButton";

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
    <div className="min-h-screen bg-bg-darkest">
      <FranchiseNavigation franchiseId={id} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with franchise name */}
          <div className="mb-6 slide-up">
            <h1 className="text-3xl font-bold uppercase tracking-wide" style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)'
            }}>
              {franchise.franchise_name}
            </h1>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider font-semibold mb-2" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-tertiary)'
                  }}>Season</p>
                  <p className="text-2xl font-bold" style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}>
                    {season.year}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider font-semibold mb-2" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-tertiary)'
                  }}>Phase</p>
                  <p className="text-2xl font-bold capitalize" style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}>
                    {season.phase}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider font-semibold mb-2" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-tertiary)'
                  }}>Week</p>
                  <p className="text-2xl font-bold" style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}>
                    {season.current_week}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wider font-semibold mb-2" style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-tertiary)'
                  }}>Difficulty</p>
                  <p className="text-2xl font-bold capitalize" style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)'
                  }}>
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
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Your franchise has been created successfully! You're
                      starting in the{" "}
                      <span className="font-semibold" style={{ color: 'var(--accent-cyan)' }}>{season.phase}</span>{" "}
                      phase of the {season.year} season.
                    </p>

                    <div className="rounded-lg p-4 border" style={{
                      background: 'rgba(0, 255, 136, 0.1)',
                      borderColor: 'var(--success)'
                    }}>
                      <h3 className="font-semibold mb-2 uppercase tracking-wide" style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--success)'
                      }}>
                        ✓ Roster Loaded!
                      </h3>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                        Your team's roster has been populated with player data.
                        Click on "Roster" above to view your players.
                      </p>
                    </div>

                    <div className="rounded-lg p-4 border" style={{
                      background: 'rgba(0, 217, 255, 0.1)',
                      borderColor: 'var(--accent-cyan)'
                    }}>
                      <h3 className="font-semibold mb-3 uppercase tracking-wide" style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--accent-cyan)'
                      }}>
                        Next Steps
                      </h3>
                      <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--success)' }}>✓</span>
                          <span>
                            <strong style={{ color: 'var(--text-primary)' }}>View your roster:</strong> Check out your
                            team's players, ratings, and attributes
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--accent-cyan)' }}>2.</span>
                          <span>
                            <strong style={{ color: 'var(--text-primary)' }}>Set your depth chart:</strong> Organize your
                            starting lineup and backups (coming soon)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--accent-cyan)' }}>3.</span>
                          <span>
                            <strong style={{ color: 'var(--text-primary)' }}>Simulate games:</strong> Progress through
                            the season and compete for the playoffs (coming
                            soon)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span style={{ color: 'var(--accent-cyan)' }}>4.</span>
                          <span>
                            <strong style={{ color: 'var(--text-primary)' }}>Make moves:</strong> Trade players, sign
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
                      href={`/franchise/${id}/manage`}
                      title="Manage Franchise"
                      description="Rosters, trades, finances"
                      disabled={false}
                    />
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
                      disabled={false}
                    />
                    <QuickActionButton
                      href={`/franchise/${id}/schedule`}
                      title="Schedule"
                      description="Simulate games"
                      disabled={false}
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
                      <p className="uppercase tracking-wider font-semibold mb-1" style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text-tertiary)'
                      }}>Conference</p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{team.conference}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wider font-semibold mb-1" style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text-tertiary)'
                      }}>Division</p>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {team.conference} {team.division}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wider font-semibold mb-1" style={{
                        fontFamily: 'var(--font-display)',
                        color: 'var(--text-tertiary)'
                      }}>Team Colors</p>
                      <div className="flex gap-2 mt-1">
                        <div
                          className="w-8 h-8 rounded border shadow-md"
                          style={{
                            backgroundColor: team.primary_color,
                            borderColor: 'var(--border-bright)',
                            boxShadow: `0 2px 8px ${team.primary_color}40`
                          }}
                          title={team.primary_color}
                        />
                        <div
                          className="w-8 h-8 rounded border shadow-md"
                          style={{
                            backgroundColor: team.secondary_color,
                            borderColor: 'var(--border-bright)',
                            boxShadow: `0 2px 8px ${team.secondary_color}40`
                          }}
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
