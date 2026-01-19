# Supabase Setup Guide

This directory contains database migrations and seed data for the NFL Franchise Simulator.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new Supabase project
3. Copy your project's URL and anon key from the API settings

## Setup Steps

### 1. Configure Environment Variables

Copy `.env.local.example` to `.env.local` in the project root and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run Migrations

In your Supabase project dashboard:

1. Go to the SQL Editor
2. Copy the contents of `migrations/00001_initial_schema.sql`
3. Paste and execute the SQL

This will create:
- All core tables (franchises, teams, seasons, players, etc.)
- Enum types
- Indexes for performance
- Row Level Security policies
- Triggers for automatic timestamp updates

### 3. Seed Initial Data

In the SQL Editor:

1. Copy the contents of `seed.sql`
2. Paste and execute the SQL

This will populate the database with:
- All 32 NFL teams with correct branding

## Database Schema Overview

### Core Tables

- `teams` - 32 NFL teams (static data)
- `franchises` - User save files
- `seasons` - Season data for each franchise
- `players` - Base player information
- `player_attributes` - Season-specific player ratings
- `roster_spots` - Team rosters (53-man roster + practice squad)
- `contracts` - Player contracts and salary cap data
- `team_standings` - Win/loss records
- `team_finances` - Salary cap tracking

### Security

Row Level Security (RLS) is enabled on all tables:
- Users can only access their own franchise data
- Template season data is readable by all authenticated users
- Teams table is public (read-only)

## Next Steps

After setting up Supabase:

1. Verify the database is accessible by running the Next.js dev server
2. Test authentication by signing up a new user
3. Create a franchise to test the template season copy logic

## Troubleshooting

**Error: "relation does not exist"**
- Make sure you ran the migration file completely
- Check that the UUID extension is enabled

**Error: "RLS policy violation"**
- Ensure you're authenticated when making requests
- Check that the RLS policies were created correctly

**Can't connect from Next.js**
- Verify your `.env.local` credentials are correct
- Check that the Supabase project URL is reachable

## Future Migrations

Additional migrations will be added for:
- Game simulation tables (games, game_stats, game_events)
- Draft system tables (draft_picks, draft_prospects, scouting_reports)
- Trade system tables (trades, trade_assets)
- Free agency tables (free_agent_signings)
- Coaching/staff tables
- Statistics and records tables
