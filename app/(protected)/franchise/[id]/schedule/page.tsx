/**
 * Schedule Page
 * Displays the season schedule and allows game simulation
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFranchiseById } from "@/app/actions/franchises";
import { getSchedule } from "@/app/actions/simulation";
import Navigation from "@/components/layout/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import SimulateGameButton from "./SimulateGameButton";
import SimulateWeekButton from "./SimulateWeekButton";

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
    <div className="min-h-screen bg-gray-50">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {season.year} Season Schedule
            </h1>
            <p className="text-gray-600">
              {team.city} {team.name} • Week {season.current_week} •{" "}
              {season.phase}
            </p>
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
                  <p className="text-gray-500">No games scheduled</p>
                ) : (
                  userTeamGames.map((game: any) => {
                    const isHome = game.home_team.id === team.id;
                    const opponent = isHome ? game.away_team : game.home_team;

                    return (
                      <div
                        key={game.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 text-center">
                            <span className="text-sm font-semibold text-gray-600">
                              Week {game.week}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold">
                              {isHome ? "vs" : "@"} {opponent.city}{" "}
                              {opponent.name}
                            </p>
                            {game.simulated && (
                              <p className="text-sm text-gray-600">
                                Final: {isHome ? game.home_score : game.away_score} -{" "}
                                {isHome ? game.away_score : game.home_score}
                                {game.overtime && " (OT)"}
                                {" • "}
                                <span
                                  className={
                                    (isHome &&
                                      game.home_score > game.away_score) ||
                                    (!isHome &&
                                      game.away_score > game.home_score)
                                      ? "text-green-600 font-semibold"
                                      : game.home_score === game.away_score
                                        ? "text-yellow-600 font-semibold"
                                        : "text-red-600 font-semibold"
                                  }
                                >
                                  {(isHome &&
                                    game.home_score > game.away_score) ||
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
                    <div key={week} className="border-b border-gray-200 pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
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
                            className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 text-sm"
                          >
                            <div>
                              <p>
                                <span className="font-semibold">
                                  {game.away_team.abbreviation}
                                </span>{" "}
                                @{" "}
                                <span className="font-semibold">
                                  {game.home_team.abbreviation}
                                </span>
                              </p>
                              {game.simulated && (
                                <p className="text-gray-600 text-xs">
                                  {game.away_score} - {game.home_score}
                                  {game.overtime && " (OT)"}
                                </p>
                              )}
                            </div>
                            {!game.simulated && (
                              <button
                                className="text-xs text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  // This would need to be a client component action
                                }}
                              >
                                Sim
                              </button>
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
