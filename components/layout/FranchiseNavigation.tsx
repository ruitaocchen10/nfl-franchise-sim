/**
 * Franchise Navigation Component
 * Navigation bar specifically for franchise pages
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { formatSeasonDate, formatPhaseDisplay } from "@/lib/season/calendarUtils";

interface FranchiseNavigationProps {
  franchiseId: string;
  teamData: {
    abbreviation: string;
    city: string;
    name: string;
    primary_color: string;
    secondary_color: string;
  };
  seasonData: {
    year: number;
    current_week: number;
    simulation_date: string | null;
    phase: string;
  };
  userEmail?: string;
}

export default function FranchiseNavigation({
  franchiseId,
  teamData,
  seasonData,
  userEmail,
}: FranchiseNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: `/franchise/${franchiseId}` },
    { name: "Roster", href: `/franchise/${franchiseId}/roster` },
    { name: "Depth Chart", href: `/franchise/${franchiseId}/depth-chart` },
    { name: "Schedule", href: `/franchise/${franchiseId}/schedule` },
    { name: "Manage", href: `/franchise/${franchiseId}/manage` },
  ];

  return (
    <nav
      className="bg-bg-dark shadow-sm border-b border-border-default"
      style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Team Branding and Nav Items */}
          <div className="flex items-center space-x-6">
            {/* Team Logo Badge */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg"
                style={{
                  backgroundColor: teamData.primary_color,
                  fontFamily: "var(--font-mono)",
                  boxShadow: `0 2px 8px ${teamData.primary_color}60`,
                }}
              >
                {teamData.abbreviation}
              </div>
              <div className="hidden lg:block">
                <p
                  className="text-sm font-bold uppercase tracking-wide leading-tight"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-primary)",
                  }}
                >
                  {teamData.city} {teamData.name}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {seasonData.simulation_date
                    ? formatSeasonDate(new Date(seasonData.simulation_date))
                    : `${seasonData.year} Season`}{" "}
                  • {formatPhaseDisplay(seasonData.phase as any)}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all uppercase tracking-wider",
                    pathname === item.href
                      ? "bg-bg-light text-accent-cyan border border-accent-cyan"
                      : "text-text-secondary hover:bg-bg-medium hover:text-text-primary border border-transparent"
                  )}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors hidden sm:block"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Dashboard
            </Link>
            {userEmail && (
              <span className="text-sm text-text-secondary hidden lg:block">
                {userEmail}
              </span>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-border-default text-sm font-medium rounded-md text-text-secondary bg-bg-medium hover:bg-bg-light hover:text-text-primary hover:border-border-bright focus:outline-none focus:ring-2 focus:ring-accent-cyan transition-all uppercase tracking-wide"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
