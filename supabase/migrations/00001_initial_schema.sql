-- NFL Franchise Simulator - Initial Database Schema
-- Migration: 00001_initial_schema
-- Description: Creates core tables for franchises, teams, seasons, players, rosters, and contracts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE conference AS ENUM ('AFC', 'NFC');
CREATE TYPE division AS ENUM ('East', 'West', 'North', 'South');
CREATE TYPE season_phase AS ENUM ('preseason', 'regular', 'playoffs', 'offseason', 'draft', 'free_agency');
CREATE TYPE player_status AS ENUM ('active', 'injured_reserve', 'practice_squad', 'inactive');
CREATE TYPE development_trait AS ENUM ('superstar', 'star', 'normal', 'slow');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Teams Table (32 NFL Teams)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    abbreviation VARCHAR(3) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    conference conference NOT NULL,
    division division NOT NULL,
    primary_color VARCHAR(7) NOT NULL, -- Hex color
    secondary_color VARCHAR(7) NOT NULL, -- Hex color
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Franchises Table (User save files)
CREATE TABLE franchises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    franchise_name VARCHAR(255) NOT NULL,
    current_season_id UUID, -- References seasons(id), added later
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seasons Table
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    current_week INTEGER NOT NULL DEFAULT 0,
    phase season_phase NOT NULL DEFAULT 'preseason',
    is_template BOOLEAN NOT NULL DEFAULT false, -- Template season for new franchises
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraint: Template seasons have no franchise_id
    CONSTRAINT template_season_check CHECK (
        (is_template = true AND franchise_id IS NULL) OR
        (is_template = false AND franchise_id IS NOT NULL)
    )
);

-- Add foreign key constraint for current_season_id
ALTER TABLE franchises
ADD CONSTRAINT franchises_current_season_fkey
FOREIGN KEY (current_season_id) REFERENCES seasons(id) ON DELETE SET NULL;

-- ============================================================================
-- PLAYER TABLES
-- ============================================================================

-- Players Table (Base player data, shared across seasons)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(3) NOT NULL, -- QB, RB, WR, etc.
    college VARCHAR(255),
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    height_inches INTEGER,
    weight_lbs INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Player Attributes Table (Season-specific ratings and attributes)
CREATE TABLE player_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    age INTEGER NOT NULL,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 40 AND overall_rating <= 99),
    speed INTEGER NOT NULL CHECK (speed >= 40 AND speed <= 99),
    strength INTEGER NOT NULL CHECK (strength >= 40 AND strength <= 99),
    agility INTEGER NOT NULL CHECK (agility >= 40 AND agility <= 99),
    awareness INTEGER NOT NULL CHECK (awareness >= 40 AND awareness <= 99),
    injury_prone INTEGER NOT NULL DEFAULT 50 CHECK (injury_prone >= 0 AND injury_prone <= 99),
    development_trait development_trait NOT NULL DEFAULT 'normal',
    morale INTEGER NOT NULL DEFAULT 75 CHECK (morale >= 0 AND morale <= 100),
    years_pro INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(player_id, season_id)
);

-- ============================================================================
-- ROSTER MANAGEMENT TABLES
-- ============================================================================

-- Roster Spots Table (Players on team rosters)
CREATE TABLE roster_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    jersey_number INTEGER CHECK (jersey_number >= 0 AND jersey_number <= 99),
    status player_status NOT NULL DEFAULT 'active',
    depth_position INTEGER NOT NULL DEFAULT 1, -- Position on depth chart
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(season_id, team_id, player_id),
    UNIQUE(season_id, team_id, jersey_number)
);

-- Contracts Table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    total_value BIGINT NOT NULL, -- Total contract value in dollars
    years_remaining INTEGER NOT NULL,
    annual_salary BIGINT NOT NULL,
    guaranteed_money BIGINT NOT NULL,
    signing_bonus BIGINT NOT NULL DEFAULT 0,
    cap_hit BIGINT NOT NULL, -- Annual cap hit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(player_id, season_id)
);

-- ============================================================================
-- TEAM MANAGEMENT TABLES
-- ============================================================================

-- Team Standings Table
CREATE TABLE team_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    ties INTEGER NOT NULL DEFAULT 0,
    division_rank INTEGER NOT NULL DEFAULT 1,
    conference_rank INTEGER NOT NULL DEFAULT 1,
    points_for INTEGER NOT NULL DEFAULT 0,
    points_against INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(season_id, team_id)
);

-- Team Finances Table
CREATE TABLE team_finances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    salary_cap BIGINT NOT NULL DEFAULT 255000000, -- $255M default cap
    cap_space BIGINT NOT NULL,
    dead_money BIGINT NOT NULL DEFAULT 0,
    rollover_cap BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(season_id, team_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Franchises indexes
CREATE INDEX idx_franchises_user_id ON franchises(user_id);
CREATE INDEX idx_franchises_team_id ON franchises(team_id);
CREATE INDEX idx_franchises_is_active ON franchises(is_active);

-- Seasons indexes
CREATE INDEX idx_seasons_franchise_id ON seasons(franchise_id);
CREATE INDEX idx_seasons_is_template ON seasons(is_template);

-- Player Attributes indexes
CREATE INDEX idx_player_attributes_player_id ON player_attributes(player_id);
CREATE INDEX idx_player_attributes_season_id ON player_attributes(season_id);

-- Roster Spots indexes
CREATE INDEX idx_roster_spots_season_id ON roster_spots(season_id);
CREATE INDEX idx_roster_spots_team_id ON roster_spots(team_id);
CREATE INDEX idx_roster_spots_player_id ON roster_spots(player_id);
CREATE INDEX idx_roster_spots_status ON roster_spots(status);

-- Contracts indexes
CREATE INDEX idx_contracts_player_id ON contracts(player_id);
CREATE INDEX idx_contracts_team_id ON contracts(team_id);
CREATE INDEX idx_contracts_season_id ON contracts(season_id);

-- Team Standings indexes
CREATE INDEX idx_team_standings_season_id ON team_standings(season_id);
CREATE INDEX idx_team_standings_team_id ON team_standings(team_id);

-- Team Finances indexes
CREATE INDEX idx_team_finances_season_id ON team_finances(season_id);
CREATE INDEX idx_team_finances_team_id ON team_finances(team_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_finances ENABLE ROW LEVEL SECURITY;

-- Teams table is public (read-only)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);

-- Franchises policies (users can only see/modify their own franchises)
CREATE POLICY "Users can view own franchises" ON franchises
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own franchises" ON franchises
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own franchises" ON franchises
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own franchises" ON franchises
    FOR DELETE USING (auth.uid() = user_id);

-- Seasons policies (users can access their franchise's seasons + template)
CREATE POLICY "Users can view own franchise seasons or template" ON seasons
    FOR SELECT USING (
        is_template = true OR
        franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert seasons for own franchise" ON seasons
    FOR INSERT WITH CHECK (
        is_template = false AND
        franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own franchise seasons" ON seasons
    FOR UPDATE USING (
        franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
    );

-- Players policies (readable by all authenticated users)
CREATE POLICY "Players are viewable by authenticated users" ON players
    FOR SELECT USING (auth.role() = 'authenticated');

-- Player attributes policies (users can view/modify their franchise's season data)
CREATE POLICY "Users can view player attributes for own franchise seasons" ON player_attributes
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Similar policies for roster_spots, contracts, team_standings, team_finances
CREATE POLICY "Users can view roster spots for own franchise" ON roster_spots
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can view contracts for own franchise" ON contracts
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can view standings for own franchise" ON team_standings
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can view finances for own franchise" ON team_finances
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasons_updated_at BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_attributes_updated_at BEFORE UPDATE ON player_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roster_spots_updated_at BEFORE UPDATE ON roster_spots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_standings_updated_at BEFORE UPDATE ON team_standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_finances_updated_at BEFORE UPDATE ON team_finances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
