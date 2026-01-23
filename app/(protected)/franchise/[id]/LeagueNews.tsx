"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export default function LeagueNews() {
  return (
    <Card style={{ background: 'var(--bg-medium)' }}>
      <CardHeader>
        <CardTitle>League News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p
              className="font-bold mb-1"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
              }}
            >
              League News Card
            </p>
            <p
              className="text-sm"
              style={{
                color: 'var(--text-secondary)',
              }}
            >
              Recent transactions, game results, and league updates will appear here.
            </p>
          </div>
          <div className="pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <p
              className="text-sm"
              style={{
                color: 'var(--text-tertiary)',
              }}
            >
              • Upcoming feature: Recent trades
            </p>
            <p
              className="text-sm"
              style={{
                color: 'var(--text-tertiary)',
              }}
            >
              • Upcoming feature: Injury reports
            </p>
            <p
              className="text-sm"
              style={{
                color: 'var(--text-tertiary)',
              }}
            >
              • Upcoming feature: Top performances
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
