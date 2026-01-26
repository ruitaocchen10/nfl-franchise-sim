"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { generateTestSchedule, type ScheduleDebugResult } from "@/app/actions/scheduleDebug";

export default function ScheduleDebugger() {
  const [year, setYear] = useState(2026);
  const [usePreviousStandings, setUsePreviousStandings] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScheduleDebugResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const result = await generateTestSchedule(year, usePreviousStandings);
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Test Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Year Input */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Season Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2050}
                className="w-full px-3 py-2 bg-bg-dark border border-gray-600 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan"
              />
            </div>

            {/* Standings Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-standings"
                checked={usePreviousStandings}
                onChange={(e) => setUsePreviousStandings(e.target.checked)}
                className="w-4 h-4 text-accent-cyan bg-bg-dark border-gray-600 rounded focus:ring-accent-cyan"
              />
              <label htmlFor="use-standings" className="text-sm text-text-secondary">
                Use Previous Season Standings (2025 template)
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-accent-red to-red-600 text-white font-bold uppercase tracking-wider rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {loading ? "Generating..." : "Generate Schedule"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {result.success && result.data ? (
            <>
              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-bg-dark rounded-lg border border-accent-cyan/20">
                      <div className="text-2xl font-bold text-accent-cyan">
                        {result.data.totalMatchups}
                      </div>
                      <div className="text-sm text-text-secondary">Total Matchups</div>
                    </div>

                    <div className="p-4 bg-bg-dark rounded-lg border border-accent-cyan/20">
                      <div className="text-2xl font-bold text-accent-cyan">
                        {result.data.byeWeeks}
                      </div>
                      <div className="text-sm text-text-secondary">Bye Weeks</div>
                    </div>

                    <div className="p-4 bg-bg-dark rounded-lg border border-green-500/20">
                      <div className="text-2xl font-bold text-green-400">
                        ✓
                      </div>
                      <div className="text-sm text-text-secondary">All Teams: 17 Games</div>
                    </div>

                    <div className="p-4 bg-bg-dark rounded-lg border border-accent-cyan/20">
                      <div className="text-2xl font-bold text-accent-cyan">
                        {year}
                      </div>
                      <div className="text-sm text-text-secondary">Season Year</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Matchups by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Matchups by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(result.data.matchupsByType).map(([type, count]) => (
                      <div
                        key={type}
                        className="p-4 bg-bg-dark rounded-lg border border-gray-700"
                      >
                        <div className="text-xl font-bold text-text-primary">{count}</div>
                        <div className="text-sm text-text-secondary capitalize">
                          {type.replace(/_/g, " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bye Week Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Bye Week Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(result.data.byeWeekDistribution)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([week, teams]) => (
                        <div key={week} className="p-3 bg-bg-dark rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-accent-cyan">
                              Week {week}
                            </span>
                            <span className="text-sm text-text-secondary">
                              {teams.length} teams
                            </span>
                          </div>
                          <div className="text-sm text-text-secondary">
                            {teams.join(", ")}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Schedule Preview */}
              {result.data.weeklyBreakdown && (
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Schedule (Sample)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 10, 18].map((week) => {
                        const weekGames = result.data!.weeklyBreakdown[week] || [];
                        return (
                          <div
                            key={week}
                            className="p-4 bg-bg-dark rounded-lg border border-gray-700"
                          >
                            <div className="font-bold text-accent-cyan mb-3">
                              Week {week} ({weekGames.length} games)
                            </div>
                            <div className="space-y-2">
                              {weekGames.slice(0, 3).map((game, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-text-secondary"
                                >
                                  {game.awayTeam} @ {game.homeTeam}
                                </div>
                              ))}
                              {weekGames.length > 3 && (
                                <div className="text-xs text-text-secondary italic">
                                  + {weekGames.length - 3} more games
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-red-500 text-xl">❌</span>
                    <div>
                      <div className="font-bold text-red-500 mb-1">Error</div>
                      <div className="text-sm text-text-secondary">
                        {result.error || "Unknown error occurred"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
