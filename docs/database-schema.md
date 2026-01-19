# Overview

This document describes the complete database schema for the NFL Franchise Simulator. The database supports multiple users, each with multiple franchise save files, progressing through multiple seasons with full roster management, game simulation, drafts, trades, and all associated features.

## Technology Stack

- Database: PostgreSQL 15+
- Platform: Supabase
- Access Pattern: Supabase JavaScript client
- Authentication: Supabase Auth

## Key Metrics

- Total Tables: 26
- Estimated Storage per Franchise: ~4-5MB per season
- Expected Query Performance: <100ms for most operations

# Schema Design Principles

1. Franchise Isolation
   Each user's franchise is completely independent. When a franchise is created, all necessary data is copied from a template season. This ensures:

- No cross-franchise data contamination
- Simple queries (no complex joins across franchises)
- Easy backup/restore per franchise
- Parallel processing possible

2. Season-Centric Design

Most game data is tied to a specific season_id. This allows:

- Historical data preservation across multiple seasons
- Clean year-over-year comparisons
- Easy archival of old seasons

3. Template Pattern

A "template season" (2025 NFL season) wiill exist with is_template = true and franchise_id = NULL. All new franchises copy this template, ensuring:

- Consistent starting point for all users
- Easy updates (update template, all new franchises get latest)
- No manual data entry required

4. Normalization Strategy

Player base data (name, position, college) stored once in players table
Season-specific attributes (ratings, age) in player_attributes table
This allows players to evolve across seasons while maintaining identity

5. Soft Deletes

Rather than hard deleting records, we use status fields:

- roster_spots.status = 'inactive'
- contracts.years_remaining = 0
- injuries.healed = true

This preserves historical data and transaction history.

# Entity Relationship Overview

USER
└─── FRANCHISE (1:N - multiple save files)
├─── Controls one TEAM
└─── SEASON (1:N - multiple years)
│
├─── TEAMS (all 32 NFL teams)
│ ├─── ROSTER_SPOTS (53 active + practice squad)
│ │ └─── Links to PLAYER
│ │ ├─── PLAYER_ATTRIBUTES (season-specific ratings)
│ │ ├─── CONTRACT (salary, years, terms)
│ │ └─── INJURIES (current ailments)
│ │
│ ├─── DEPTH_CHART (starting lineup)
│ ├─── TEAM_STANDINGS (W-L record)
│ ├─── TEAM_FINANCES (salary cap tracking)
│ ├─── TEAM_NEEDS (position priorities)
│ ├─── TEAM_CHEMISTRY (morale, cohesion)
│ ├─── COACHES (HC, coordinators, position coaches)
│ └─── STAFF (scouts, trainers, GM)
│
├─── GAMES (256 regular season + playoffs)
│ ├─── GAME_STATS (individual player performance)
│ └─── GAME_EVENTS (touchdowns, turnovers, key plays)
│
├─── SEASON_STATS (aggregated player totals)
│
├─── DRAFT_PICKS (all 7 rounds × 32 teams)
│ └─── Links to DRAFT_PROSPECTS
│ └─── SCOUTING_REPORTS (team-specific evaluations)
│
├─── TRADES (proposed and completed)
│ └─── TRADE_ASSETS (players, picks, cash in trade)
│
└─── FREE_AGENT_SIGNINGS (contract offers)
