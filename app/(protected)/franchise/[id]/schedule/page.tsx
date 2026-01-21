/**
 * Schedule Page
 * Displays the season schedule and allows game simulation
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFranchiseById } from "@/app/actions/franchises";
import { getSchedule } from "@/app/actions/simulation";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import SimulateGameButton from "./SimulateGameButton";
import SimulateWeekButton from "./SimulateWeekButton";
import SimButton from "./SimButton";

interface SchedulePageProps {
  params: Promise<{ id: string }>;
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch franchise and schedule
  const franchise = (await getFranchiseById(id)) as any;
  const games = await getSchedule(id);

  const team = franchise.team as any;
  const season = franchise.current_season as any;

  // Group games by week
  const gamesByWeek = games.reduce(
    (acc: any, game: any) => {
      if (!acc[game.week]) {
        acc[game.week] = [];
      }
      acc[game.week].push(game);
      return acc;
    },
    {},
  );

  // Get user's team games
  const userTeamGames = games.filter(
    (game: any) =>
      game.home_team.id === team.id || game.away_team.id === team.id,
  );

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
              Schedule
            </h1>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 flex gap-4">
            <SimulateWeekButton
              franchiseId={id}
              week={season.current_week + 1}
              disabled={season.current_week >= 18}
            />
          </div>

          {/* User's Team Schedule */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userTeamGames.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No games scheduled</p>
                ) : (
                  userTeamGames.map((game: any) => {
                    const isHome = game.home_team.id === team.id;
                    const opponent = isHome ? game.away_team : game.home_team;

                    return (
                      <div
                        key={game.id}
                        className="flex items-center justify-between p-4 rounded-lg border transition-all hover:-translate-y-0.5"
                        style={{
                          background: 'var(--bg-light)',
                          borderColor: 'var(--border-default)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 text-center">
                            <span className="text-sm font-semibold uppercase tracking-wider" style={{
                              fontFamily: 'var(--font-display)',
                              color: 'var(--text-tertiary)'
                            }}>
                              Week {game.week}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {isHome ? "vs" : "@"} {opponent.city}{" "}
                              {opponent.name}
                            </p>
                            {game.simulated && (
                              <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                Final: {isHome ? game.home_score : game.away_score} -{" "}
                                {isHome ? game.away_score : game.home_score}
                                {game.overtime && " (OT)"}
                                {" • "}
                                <span
                                  className="font-semibold"
                                  style={{
                                    color: (isHome && game.home_score > game.away_score) ||
                                      (!isHome && game.away_score > game.home_score)
                                      ? 'var(--success)'
                                      : game.home_score === game.away_score
                                        ? 'var(--warning)'
                                        : 'var(--error)'
                                  }}
                                >
                                  {(isHome && game.home_score > game.away_score) ||
                                  (!isHome && game.away_score > game.home_score)
                                    ? "W"
                                    : game.home_score === game.away_score
                                      ? "T"
                                      : "L"}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        {!game.simulated && (
                          <SimulateGameButton
                            franchiseId={id}
                            gameId={game.id}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Full League Schedule by Week */}
          <Card>
            <CardHeader>
              <CardTitle>Full League Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.keys(gamesByWeek)
                  .sort((a, b) => Number(a) - Number(b))
                  .map((week) => (
                    <div key={week} className="border-b pb-4" style={{ borderColor: 'var(--border-default)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold uppercase tracking-wide" style={{
                          fontFamily: 'var(--font-display)',
                          color: 'var(--text-primary)'
                        }}>
                          Week {week}
                        </h3>
                        {!gamesByWeek[week].every((g: any) => g.simulated) && (
                          <SimulateWeekButton
                            franchiseId={id}
                            week={Number(week)}
                            variant="secondary"
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {gamesByWeek[week].map((game: any) => (
                          <div
                            key={game.id}
                            className="flex items-center justify-between p-3 rounded border text-sm"
                            style={{
                              background: 'var(--bg-light)',
                              borderColor: 'var(--border-default)'
                            }}
                          >
                            <div>
                              <p style={{ color: 'var(--text-primary)' }}>
                                <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                                  {game.away_team.abbreviation}
                                </span>{" "}
                                @{" "}
                                <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                                  {game.home_team.abbreviation}
                                </span>
                              </p>
                              {game.simulated && (
                                <p className="text-xs" style={{
                                  color: 'var(--text-secondary)',
                                  fontFamily: 'var(--font-mono)'
                                }}>
                                  {game.away_score} - {game.home_score}
                                  {game.overtime && " (OT)"}
                                </p>
                              )}
                            </div>
                            {!game.simulated && (
                              <SimButton onClick={() => {
                                // This would need to be a client component action
                              }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
