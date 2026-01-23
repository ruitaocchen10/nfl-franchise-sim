-- Calendar-Based Schedule System
-- Migration: 00004_calendar_based_schedule
-- Description: Adds calendar dates, time slots, refined phases, and preseason support

-- ============================================================================
-- UPDATE ENUM TYPES
-- ============================================================================

-- Drop and recreate season_phase enum with refined phases
-- First, drop the default constraint to allow type change
ALTER TABLE seasons ALTER COLUMN phase DROP DEFAULT;

-- Rename old enum type
ALTER TYPE season_phase RENAME TO season_phase_old;

-- Create new enum type
CREATE TYPE season_phase AS ENUM (
    'offseason',        -- Feb-Mar: Re-sign own players, prepare
    'free_agency',      -- Mar-Apr: Sign FAs + scout draft simultaneously
    'draft',            -- Apr 25-27: Draft event (3 days)
    'training_camp',    -- Apr 28-Aug 7: OTAs, minicamp, finalize roster
    'preseason',        -- Aug 8-27: 3 preseason games
    'regular_season',   -- Sep 5-Jan 5: 18 weeks (17 games + bye)
    'postseason'        -- Jan 11-Feb 9: Playoffs
);

-- Migrate existing data to new enum
ALTER TABLE seasons
    ALTER COLUMN phase TYPE season_phase
    USING (
        CASE phase::text
            WHEN 'preseason' THEN 'preseason'::season_phase
            WHEN 'regular' THEN 'regular_season'::season_phase
            WHEN 'playoffs' THEN 'postseason'::season_phase
            WHEN 'offseason' THEN 'offseason'::season_phase
            WHEN 'draft' THEN 'draft'::season_phase
            WHEN 'free_agency' THEN 'free_agency'::season_phase
            ELSE 'offseason'::season_phase
        END
    );

-- Re-add the default constraint with new enum value
ALTER TABLE seasons ALTER COLUMN phase SET DEFAULT 'offseason'::season_phase;

-- Drop old enum type
DROP TYPE season_phase_old;

-- Create game_time_slot enum
CREATE TYPE game_time_slot AS ENUM (
    'early_window',     -- Sunday 1:00 PM ET
    'late_window',      -- Sunday 4:00 PM ET
    'snf',              -- Sunday Night Football 8:20 PM
    'mnf',              -- Monday Night Football 8:15 PM
    'tnf',              -- Thursday Night Football 8:00 PM
    'saturday',         -- Saturday games (late season)
    'thanksgiving'      -- Thanksgiving games
);

-- ============================================================================
-- MODIFY EXISTING TABLES
-- ============================================================================

-- Add calendar fields to seasons table
ALTER TABLE seasons
    ADD COLUMN simulation_date TIMESTAMPTZ,
    ADD COLUMN season_start_date TIMESTAMPTZ,
    ADD COLUMN trade_deadline_passed BOOLEAN NOT NULL DEFAULT false;

-- Add calendar fields to games table
ALTER TABLE games
    ADD COLUMN game_date TIMESTAMPTZ,
    ADD COLUMN game_time_slot game_time_slot;

-- Create index on game_date for efficient querying
CREATE INDEX idx_games_game_date ON games(game_date);

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Team Bye Weeks Table
CREATE TABLE team_bye_weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    bye_week_number INTEGER NOT NULL CHECK (bye_week_number >= 6 AND bye_week_number <= 14),
    bye_week_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Each team has one bye per season
    UNIQUE(season_id, team_id)
);

-- ============================================================================
-- INDEXES FOR NEW TABLE
-- ============================================================================

CREATE INDEX idx_team_bye_weeks_season_id ON team_bye_weeks(season_id);
CREATE INDEX idx_team_bye_weeks_team_id ON team_bye_weeks(team_id);

-- ============================================================================
-- ROW LEVEL SECURITY FOR NEW TABLE
-- ============================================================================

ALTER TABLE team_bye_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bye weeks for own franchise" ON team_bye_weeks
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- ============================================================================
-- DATA MIGRATION FOR EXISTING RECORDS
-- ============================================================================

-- Update existing seasons with estimated dates based on year
-- Assumes season starts in early September for regular season
UPDATE seasons
SET
    season_start_date = make_date(year, 9, 5)::timestamptz,
    simulation_date = make_date(year, 9, 5)::timestamptz + (current_week * interval '7 days')
WHERE season_start_date IS NULL;

-- Update existing games with estimated dates based on week
-- This is a rough estimate - new schedule generator will assign proper dates
UPDATE games g
SET
    game_date = s.season_start_date + ((g.week - 1) * interval '7 days') + interval '3 days',
    game_time_slot = 'early_window'
FROM seasons s
WHERE g.season_id = s.id
    AND g.game_date IS NULL
    AND g.week IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN seasons.simulation_date IS 'Current simulation date - tracks calendar position in season';
COMMENT ON COLUMN seasons.season_start_date IS 'Date when preseason begins (early August)';
COMMENT ON COLUMN seasons.trade_deadline_passed IS 'Set to true after Nov 5 trade deadline';
COMMENT ON COLUMN games.game_date IS 'Actual date and time of game';
COMMENT ON COLUMN games.game_time_slot IS 'TV time slot (SNF, MNF, TNF, etc)';
COMMENT ON TABLE team_bye_weeks IS 'Tracks each team bye week during regular season';
