"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import DeleteFranchiseButton from "./DeleteFranchiseButton";

interface FranchiseCardProps {
  franchise: any;
}

export default function FranchiseCard({ franchise }: FranchiseCardProps) {
  const team = franchise.team;
  const season = franchise.current_season;

  return (
    <div className="relative">
      <Link href={`/franchise/${franchise.id}`}>
        <Card className="transition-all cursor-pointer h-full hover:-translate-y-1" style={{
          background: "var(--bg-medium)",
          border: "1px solid var(--border-default)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
        }}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold shadow-lg"
                style={{
                  backgroundColor: team.primary_color,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {team.abbreviation}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate text-text-primary" style={{ fontFamily: "var(--font-display)" }}>
                  {franchise.franchise_name}
                </CardTitle>
                <p className="text-sm text-text-secondary truncate">
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
              <span className="text-text-tertiary">Season</span>
              <span className="font-semibold text-text-primary" style={{ fontFamily: "var(--font-mono)" }}>{season.year}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">Phase</span>
              <span className="font-semibold capitalize text-text-primary">{season.phase}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">Week</span>
              <span className="font-semibold text-text-primary" style={{ fontFamily: "var(--font-mono)" }}>{season.current_week}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">Difficulty</span>
              <span className="font-semibold capitalize text-text-primary">
                {franchise.difficulty}
              </span>
            </div>

            <div className="pt-3 border-t border-border-default">
              <div className="text-xs text-text-muted">
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
