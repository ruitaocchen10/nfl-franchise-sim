-- Team AI State and Personality System
-- Migration: 00007_team_ai_state
-- Description: Adds AI agent state and personality for autonomous team decision-making

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Team strategy types
CREATE TYPE team_strategy AS ENUM (
    'win_now',      -- All-in for championship (aging roster, playoff team)
    'contend',      -- Building sustainable contender (young core, solid record)
    'rebuild'       -- Long-term rebuild (poor record, young/low talent roster)
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Team AI State Table
-- Stores personality traits and decision-making state for each AI-controlled team
CREATE TABLE team_ai_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,

    -- Personality Traits (generated at season start)
    strategy team_strategy NOT NULL DEFAULT 'contend',
    aggressiveness DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (aggressiveness >= 0.50 AND aggressiveness <= 1.50),
    risk_tolerance DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (risk_tolerance >= 0.00 AND risk_tolerance <= 1.00),

    -- Priorities
    critical_positions TEXT[] DEFAULT '{}',  -- Highest priority positions
    high_priority_positions TEXT[] DEFAULT '{}',  -- Medium-high priority
    medium_priority_positions TEXT[] DEFAULT '{}',  -- Medium priority

    -- Budget Management
    weekly_budget BIGINT DEFAULT 0,  -- How much to spend per week
    budget_spent BIGINT DEFAULT 0,  -- Total spent so far this season

    -- State Tracking
    wishlist JSONB DEFAULT '[]'::jsonb,  -- Array of player IDs team is targeting
    recent_signings JSONB DEFAULT '[]'::jsonb,  -- Recent signing history
    last_activity_date TIMESTAMPTZ,  -- Last time this team made a decision

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Each team has one AI state per season
    UNIQUE(team_id, season_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_team_ai_state_team_id ON team_ai_state(team_id);
CREATE INDEX idx_team_ai_state_season_id ON team_ai_state(season_id);
CREATE INDEX idx_team_ai_state_strategy ON team_ai_state(strategy);
CREATE INDEX idx_team_ai_state_last_activity ON team_ai_state(last_activity_date);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE team_ai_state ENABLE ROW LEVEL SECURITY;

-- Users can view AI state for teams in their franchise's season
CREATE POLICY "Users can view AI state for own franchise" ON team_ai_state
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            is_template = true OR
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- System can insert/update AI state
CREATE POLICY "System can manage AI state" ON team_ai_state
    FOR ALL USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_ai_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_ai_state_timestamp
    BEFORE UPDATE ON team_ai_state
    FOR EACH ROW
    EXECUTE FUNCTION update_team_ai_state_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE team_ai_state IS 'Stores AI personality and decision-making state for autonomous team agents';
COMMENT ON COLUMN team_ai_state.strategy IS 'Overall team strategy: win_now (all-in), contend (sustainable), rebuild (long-term)';
COMMENT ON COLUMN team_ai_state.aggressiveness IS 'How aggressively team spends/acts (0.50=conservative, 1.50=very aggressive)';
COMMENT ON COLUMN team_ai_state.risk_tolerance IS 'Willingness to take risks on unproven players (0=safe, 1=high risk/reward)';
COMMENT ON COLUMN team_ai_state.critical_positions IS 'Top priority positions for this team';
COMMENT ON COLUMN team_ai_state.weekly_budget IS 'How much cap space team allocates per week during free agency';
COMMENT ON COLUMN team_ai_state.wishlist IS 'JSON array of player IDs team is specifically targeting';
COMMENT ON COLUMN team_ai_state.recent_signings IS 'JSON array tracking recent signing decisions and outcomes';
