/**
 * Franchise Management Hub
 * Central page for accessing all franchise management tools
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface ManagePageProps {
  params: Promise<{ id: string }>;
}

export default async function ManagePage({ params }: ManagePageProps) {
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
            }}>
              Franchise Management
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {franchise.franchise_name}
            </p>
          </div>

          {/* Management Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Rosters Tool */}
            <Link href={`/franchise/${id}/manage/rosters`}>
              <Card className="h-full transition-all hover:-translate-y-1 cursor-pointer" style={{
                background: "var(--bg-medium)",
                border: "1px solid var(--border-default)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
              }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                      background: 'var(--accent-cyan)',
                      color: 'var(--bg-darkest)'
                    }}>
                      <span className="text-2xl font-bold">👥</span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--text-primary)'
                    }}>League Rosters</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    View and compare rosters from all 32 teams in the league. Filter by team, position, and rating.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent-cyan)' }}>
                    <span>Explore Rosters</span>
                    <span>→</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Placeholder for future tools */}
            <Card className="h-full opacity-50" style={{
              background: "var(--bg-medium)",
              border: "1px solid var(--border-default)",
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                    background: 'var(--text-tertiary)',
                    color: 'var(--bg-darkest)'
                  }}>
                    <span className="text-2xl font-bold">💰</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)'
                  }}>Finances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Manage salary cap, contracts, and team finances.
                </p>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="h-full opacity-50" style={{
              background: "var(--bg-medium)",
              border: "1px solid var(--border-default)",
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                    background: 'var(--text-tertiary)',
                    color: 'var(--bg-darkest)'
                  }}>
                    <span className="text-2xl font-bold">🔄</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)'
                  }}>Trades</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Negotiate trades with other teams.
                </p>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="h-full opacity-50" style={{
              background: "var(--bg-medium)",
              border: "1px solid var(--border-default)",
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                    background: 'var(--text-tertiary)',
                    color: 'var(--bg-darkest)'
                  }}>
                    <span className="text-2xl font-bold">✍️</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)'
                  }}>Free Agency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Sign free agents and manage player contracts.
                </p>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  Coming Soon
                </div>
              </CardContent>
            </Card>

            <Card className="h-full opacity-50" style={{
              background: "var(--bg-medium)",
              border: "1px solid var(--border-default)",
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                    background: 'var(--text-tertiary)',
                    color: 'var(--bg-darkest)'
                  }}>
                    <span className="text-2xl font-bold">🎓</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)'
                  }}>Draft</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Scout prospects and manage your draft picks.
                </p>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                  Coming Soon
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
