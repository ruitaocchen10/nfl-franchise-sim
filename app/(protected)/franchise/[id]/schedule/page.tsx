/**
 * Schedule Page
 * Displays the season schedule with calendar dates and time slots
 * Allows game simulation
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFranchiseById } from "@/app/actions/franchises";
import { getSchedule } from "@/app/actions/simulation";
import {
  formatGameDate,
  getTimeSlotBadge,
  getTimeSlotDisplay,
} from "@/lib/season/calendarUtils";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
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

  // Group games by week and date
  const gamesByWeek = games.reduce(
    (acc: any, game: any) => {
      const weekKey = game.game_type === "preseason"
        ? `preseason-${game.week}`
        : `week-${game.week}`;
      if (!acc[weekKey]) {
        acc[weekKey] = {
          week: game.week,
          type: game.game_type,
          games: [],
        };
      }
      acc[weekKey].games.push(game);
      return acc;
    },
    {},
  );

  // Get user's team games
  const userTeamGames = games.filter(
    (game: any) =>
      game.home_team.id === team.id || game.away_team.id === team.id,
  );

  // Helper to get time slot priority for sorting
  const getTimeSlotPriority = (slot: string | null): number => {
    const priorities: Record<string, number> = {
      tnf: 0,
      thanksgiving: 0,
      saturday: 1,
      early_window: 2,
      late_window: 3,
      snf: 4,
      mnf: 5,
    };
    return priorities[slot || "early_window"] ?? 2;
  };

  // Sort games by date and time slot
  const sortGamesByDateTime = (a: any, b: any) => {
    const dateA = a.game_date ? new Date(a.game_date).getTime() : 0;
    const dateB = b.game_date ? new Date(b.game_date).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    return getTimeSlotPriority(a.game_time_slot) - getTimeSlotPriority(b.game_time_slot);
  };

  // Sort user's team games
  userTeamGames.sort(sortGamesByDateTime);

  // Sort games within each week
  Object.values(gamesByWeek).forEach((weekData: any) => {
    weekData.games.sort(sortGamesByDateTime);
  });

  return (
    <div className="min-h-screen bg-bg-darkest">
      <FranchiseNavigation franchiseId={id} />

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
                    const gameDate = game.game_date ? new Date(game.game_date) : null;
                    const timeSlotBadge = getTimeSlotBadge(game.game_time_slot);
                    const isPreseason = game.game_type === "preseason";

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
                          <div className="min-w-24 text-center">
                            <div className="text-sm font-semibold uppercase tracking-wider" style={{
                              fontFamily: 'var(--font-display)',
                              color: 'var(--text-tertiary)'
                            }}>
                              {isPreseason ? "Preseason" : `Week ${game.week}`}
                            </div>
                            {gameDate && (
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {gameDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {isHome ? "vs" : "@"} {opponent.city}{" "}
                                {opponent.name}
                              </p>
                              {timeSlotBadge && (
                                <span
                                  className="px-2 py-0.5 text-xs font-bold rounded uppercase"
                                  style={{
                                    background: 'rgba(0, 217, 255, 0.15)',
                                    color: '#00d9ff',
                                    fontFamily: 'var(--font-display)'
                                  }}
                                >
                                  {timeSlotBadge}
                                </span>
                              )}
                            </div>
                            {game.simulated && (
                              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
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
                  .sort((a, b) => {
                    // Sort preseason first, then regular season
                    if (a.startsWith("preseason") && !b.startsWith("preseason")) return -1;
                    if (!a.startsWith("preseason") && b.startsWith("preseason")) return 1;
                    return gamesByWeek[a].week - gamesByWeek[b].week;
                  })
                  .map((weekKey) => {
                    const weekData = gamesByWeek[weekKey];
                    const isPreseason = weekData.type === "preseason";
                    const weekTitle = isPreseason
                      ? `Preseason Week ${weekData.week}`
                      : `Week ${weekData.week}`;

                    // Get first game date for week display
                    const firstGame = weekData.games[0];
                    const weekDate = firstGame?.game_date
                      ? formatGameDate(new Date(firstGame.game_date))
                      : "";

                    return (
                      <div key={weekKey} className="border-b pb-4" style={{ borderColor: 'var(--border-default)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold uppercase tracking-wide" style={{
                              fontFamily: 'var(--font-display)',
                              color: 'var(--text-primary)'
                            }}>
                              {weekTitle}
                            </h3>
                            {weekDate && (
                              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                {weekDate}
                              </p>
                            )}
                          </div>
                          {!weekData.games.every((g: any) => g.simulated) && !isPreseason && (
                            <SimulateWeekButton
                              franchiseId={id}
                              week={weekData.week}
                              variant="secondary"
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {weekData.games.map((game: any) => {
                            const timeSlotBadge = getTimeSlotBadge(game.game_time_slot);

                            return (
                              <div
                                key={game.id}
                                className="flex items-center justify-between p-3 rounded border text-sm"
                                style={{
                                  background: 'var(--bg-light)',
                                  borderColor: 'var(--border-default)'
                                }}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p style={{ color: 'var(--text-primary)' }}>
                                      <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                                        {game.away_team.abbreviation}
                                      </span>{" "}
                                      @{" "}
                                      <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                                        {game.home_team.abbreviation}
                                      </span>
                                    </p>
                                    {timeSlotBadge && (
                                      <span
                                        className="px-1.5 py-0.5 text-xs font-bold rounded uppercase"
                                        style={{
                                          background: 'rgba(0, 217, 255, 0.15)',
                                          color: '#00d9ff',
                                          fontFamily: 'var(--font-display)'
                                        }}
                                      >
                                        {timeSlotBadge}
                                      </span>
                                    )}
                                  </div>
                                  {game.simulated && (
                                    <p className="text-xs mt-1" style={{
                                      color: 'var(--text-secondary)',
                                      fontFamily: 'var(--font-mono)'
                                    }}>
                                      {game.away_score} - {game.home_score}
                                      {game.overtime && " (OT)"}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
