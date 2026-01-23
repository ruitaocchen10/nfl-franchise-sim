/**
 * Franchise Navigation Component
 * Navigation bar specifically for franchise pages
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FranchiseNavigationProps {
  franchiseId: string;
}

export default function FranchiseNavigation({
  franchiseId,
}: FranchiseNavigationProps) {
  const pathname = usePathname();
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);

  const navItems = [
    { name: "Home", href: `/franchise/${franchiseId}`, isLink: true, hasDropdown: false },
    {
      name: "Team",
      href: "",
      isLink: false,
      hasDropdown: true,
      dropdownItems: [
        { name: "Roster", href: `/franchise/${franchiseId}/roster` },
        { name: "Depth Chart", href: `/franchise/${franchiseId}/depth-chart` },
      ]
    },
    { name: "Schedule", href: `/franchise/${franchiseId}/schedule`, isLink: true, hasDropdown: false },
    { name: "Trades", href: `/franchise/${franchiseId}/trades`, isLink: true, hasDropdown: false },
    { name: "Free Agents", href: `/franchise/${franchiseId}/free-agents`, isLink: true, hasDropdown: false },
    { name: "Prospects", href: `/franchise/${franchiseId}/prospects`, isLink: true, hasDropdown: false },
    { name: "Sign Out", href: "", isLink: false, hasDropdown: false, isAction: true },
  ];

  return (
    <nav
      className="bg-bg-dark border-b border-border-default"
      style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)" }}
    >
      <div className="flex w-full relative">
        {navItems.map((item) => {
          const isActive = item.isLink && pathname === item.href;
          const isTeamActive = item.hasDropdown && item.dropdownItems?.some((sub: any) => pathname === sub.href);

          // Sign Out button
          if (item.isAction) {
            return (
              <form key={item.name} action={logout} className="flex-1">
                <button
                  type="submit"
                  className="w-full h-16 flex items-center justify-center text-sm font-medium uppercase tracking-wider transition-all border-r border-border-default hover:bg-bg-medium hover:text-text-primary"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.name}
                </button>
              </form>
            );
          }

          // Team dropdown
          if (item.hasDropdown) {
            return (
              <div
                key={item.name}
                className="flex-1 relative"
                onMouseEnter={() => setTeamDropdownOpen(true)}
                onMouseLeave={() => setTeamDropdownOpen(false)}
              >
                <button
                  className={cn(
                    "w-full h-16 flex items-center justify-center text-sm font-medium uppercase tracking-wider transition-all border-r border-border-default",
                    isTeamActive
                      ? "text-accent-cyan"
                      : "text-text-secondary hover:bg-bg-medium hover:text-text-primary"
                  )}
                  style={{
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {item.name}
                </button>

                {/* Dropdown menu */}
                {teamDropdownOpen && (
                  <div
                    className="absolute top-full left-0 w-48 bg-bg-medium border border-border-default shadow-lg z-50"
                    style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.6)" }}
                  >
                    {item.dropdownItems?.map((subItem: any) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "block px-4 py-3 text-sm font-medium uppercase tracking-wider transition-all border-b border-border-default last:border-b-0",
                          pathname === subItem.href
                            ? "bg-bg-light text-accent-cyan"
                            : "text-text-secondary hover:bg-bg-light hover:text-text-primary"
                        )}
                        style={{
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Regular link
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 h-16 flex items-center justify-center text-sm font-medium uppercase tracking-wider transition-all border-r border-border-default",
                isActive
                  ? "text-accent-cyan"
                  : "text-text-secondary hover:bg-bg-medium hover:text-text-primary"
              )}
              style={{
                fontFamily: "var(--font-display)",
              }}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
