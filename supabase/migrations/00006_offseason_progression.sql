-- NFL Franchise Simulator - Offseason Progression Tables
-- Migration: 00006_offseason_progression
-- Description: Creates tables for draft prospects, retired players, and offseason progression tracking

-- ============================================================================
-- DRAFT PROSPECTS TABLE
-- ============================================================================

CREATE TABLE draft_prospects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(3) NOT NULL,
    college VARCHAR(255),
    age INTEGER NOT NULL DEFAULT 21,
    height_inches INTEGER,
    weight_lbs INTEGER,

    -- Hidden attributes (true talent - only revealed after drafting)
    true_overall INTEGER NOT NULL CHECK (true_overall >= 65 AND true_overall <= 95),
    true_potential INTEGER NOT NULL CHECK (true_potential >= 70 AND true_potential <= 99),
    true_speed INTEGER NOT NULL CHECK (true_speed >= 60 AND true_speed <= 99),
    true_strength INTEGER NOT NULL CHECK (true_strength >= 60 AND true_strength <= 99),
    true_agility INTEGER NOT NULL CHECK (true_agility >= 60 AND true_agility <= 99),
    true_awareness INTEGER NOT NULL CHECK (true_awareness >= 60 AND true_awareness <= 99),
    true_injury_prone INTEGER NOT NULL DEFAULT 50 CHECK (true_injury_prone >= 0 AND true_injury_prone <= 99),

    -- Visible combine stats
    combine_40_time DECIMAL(4,2), -- 4.3 to 5.5 seconds
    combine_bench INTEGER, -- Reps at 225 lbs
    combine_vertical DECIMAL(4,1), -- Inches
    combine_broad_jump INTEGER, -- Inches
    combine_three_cone DECIMAL(4,2), -- Seconds

    -- Draft projections (visible to all)
    draft_grade VARCHAR(50), -- e.g., "1st Round Talent", "Day 2 Pick"
    projected_round_min INTEGER CHECK (projected_round_min >= 1 AND projected_round_min <= 7),
    projected_round_max INTEGER CHECK (projected_round_max >= 1 AND projected_round_max <= 7),
    hype INTEGER NOT NULL DEFAULT 50 CHECK (hype >= 0 AND hype <= 100), -- Media attention

    -- Player ID will be set when drafted
    drafted_by_team_id UUID REFERENCES teams(id),
    player_id UUID REFERENCES players(id), -- Set after draft

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(season_id, first_name, last_name)
);

-- ============================================================================
-- RETIRED PLAYERS TABLE
-- ============================================================================

CREATE TABLE retired_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    retirement_season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    retirement_year INTEGER NOT NULL,
    age_at_retirement INTEGER NOT NULL,
    final_overall_rating INTEGER,
    total_seasons_played INTEGER NOT NULL,
    reason VARCHAR(100), -- 'age', 'injury', 'performance'
    career_stats JSONB, -- Store final career stats
    retired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(player_id)
);

-- ============================================================================
-- FREE AGENTS TRACKING
-- ============================================================================

CREATE TABLE free_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    previous_team_id UUID NOT NULL REFERENCES teams(id),
    previous_contract_value BIGINT,
    market_value BIGINT, -- Estimated market value
    interested_teams UUID[], -- Array of team IDs that have shown interest
    status VARCHAR(20) NOT NULL DEFAULT 'available', -- 'available', 'signed', 'retired'
    signed_team_id UUID REFERENCES teams(id),
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(player_id, season_id)
);

-- ============================================================================
-- SEASON PROGRESSION LOG
-- ============================================================================

CREATE TABLE season_progression_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    from_season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    to_season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    players_progressed INTEGER NOT NULL DEFAULT 0,
    players_regressed INTEGER NOT NULL DEFAULT 0,
    players_retired INTEGER NOT NULL DEFAULT 0,
    contracts_expired INTEGER NOT NULL DEFAULT 0,
    free_agents_created INTEGER NOT NULL DEFAULT 0,
    prospects_generated INTEGER NOT NULL DEFAULT 0,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_draft_prospects_season_id ON draft_prospects(season_id);
CREATE INDEX idx_draft_prospects_position ON draft_prospects(position);
CREATE INDEX idx_draft_prospects_player_id ON draft_prospects(player_id);
CREATE INDEX idx_retired_players_player_id ON retired_players(player_id);
CREATE INDEX idx_retired_players_season_id ON retired_players(retirement_season_id);
CREATE INDEX idx_free_agents_player_id ON free_agents(player_id);
CREATE INDEX idx_free_agents_season_id ON free_agents(season_id);
CREATE INDEX idx_free_agents_status ON free_agents(status);
CREATE INDEX idx_season_progression_log_franchise_id ON season_progression_log(franchise_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE draft_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE retired_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_progression_log ENABLE ROW LEVEL SECURITY;

-- Draft prospects viewable by users who own the franchise/season
CREATE POLICY "Users can view draft prospects for own franchise" ON draft_prospects
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Retired players viewable by all authenticated users
CREATE POLICY "Authenticated users can view retired players" ON retired_players
    FOR SELECT USING (auth.role() = 'authenticated');

-- Free agents viewable by users who own the franchise/season
CREATE POLICY "Users can view free agents for own franchise" ON free_agents
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Season progression log viewable by franchise owner
CREATE POLICY "Users can view own franchise progression log" ON season_progression_log
    FOR SELECT USING (
        franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
    );
