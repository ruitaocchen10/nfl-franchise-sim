-- Game Simulation Tables
-- Migration: 00003_game_simulation_tables
-- Description: Adds tables for games, schedules, statistics, and events

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE game_type AS ENUM ('preseason', 'regular', 'wildcard', 'divisional', 'conference', 'superbowl');
CREATE TYPE weather_type AS ENUM ('clear', 'rain', 'snow', 'wind', 'dome');
CREATE TYPE event_type AS ENUM ('touchdown', 'field_goal', 'turnover', 'injury', 'big_play', 'safety', 'two_point', 'game_winning');

-- ============================================================================
-- GAMES TABLE
-- ============================================================================

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    week INTEGER NOT NULL CHECK (week >= 0 AND week <= 22),
    game_type game_type NOT NULL DEFAULT 'regular',
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    home_score INTEGER CHECK (home_score >= 0),
    away_score INTEGER CHECK (away_score >= 0),
    simulated BOOLEAN NOT NULL DEFAULT false,
    simulated_at TIMESTAMPTZ,
    overtime BOOLEAN NOT NULL DEFAULT false,
    weather weather_type NOT NULL DEFAULT 'clear',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT different_teams CHECK (home_team_id != away_team_id),
    CONSTRAINT scores_if_simulated CHECK (
        (simulated = false AND home_score IS NULL AND away_score IS NULL) OR
        (simulated = true AND home_score IS NOT NULL AND away_score IS NOT NULL)
    )
);

-- ============================================================================
-- GAME STATS TABLE
-- ============================================================================

CREATE TABLE game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

    -- Passing stats
    pass_attempts INTEGER NOT NULL DEFAULT 0,
    pass_completions INTEGER NOT NULL DEFAULT 0,
    pass_yards INTEGER NOT NULL DEFAULT 0,
    pass_tds INTEGER NOT NULL DEFAULT 0,
    interceptions INTEGER NOT NULL DEFAULT 0,
    sacks_taken INTEGER NOT NULL DEFAULT 0,

    -- Rushing stats
    rush_attempts INTEGER NOT NULL DEFAULT 0,
    rush_yards INTEGER NOT NULL DEFAULT 0,
    rush_tds INTEGER NOT NULL DEFAULT 0,
    fumbles INTEGER NOT NULL DEFAULT 0,
    fumbles_lost INTEGER NOT NULL DEFAULT 0,

    -- Receiving stats
    targets INTEGER NOT NULL DEFAULT 0,
    receptions INTEGER NOT NULL DEFAULT 0,
    receiving_yards INTEGER NOT NULL DEFAULT 0,
    receiving_tds INTEGER NOT NULL DEFAULT 0,
    drops INTEGER NOT NULL DEFAULT 0,

    -- Defensive stats
    tackles INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    sacks DECIMAL(4,1) NOT NULL DEFAULT 0.0,
    tackles_for_loss INTEGER NOT NULL DEFAULT 0,
    forced_fumbles INTEGER NOT NULL DEFAULT 0,
    fumble_recoveries INTEGER NOT NULL DEFAULT 0,
    interceptions_defense INTEGER NOT NULL DEFAULT 0,
    pass_deflections INTEGER NOT NULL DEFAULT 0,
    defensive_tds INTEGER NOT NULL DEFAULT 0,

    -- Kicking stats
    field_goals_made INTEGER NOT NULL DEFAULT 0,
    field_goals_attempted INTEGER NOT NULL DEFAULT 0,
    longest_field_goal INTEGER NOT NULL DEFAULT 0,
    extra_points_made INTEGER NOT NULL DEFAULT 0,
    extra_points_attempted INTEGER NOT NULL DEFAULT 0,

    -- Punting stats
    punts INTEGER NOT NULL DEFAULT 0,
    punt_yards INTEGER NOT NULL DEFAULT 0,
    inside_20 INTEGER NOT NULL DEFAULT 0,
    touchbacks INTEGER NOT NULL DEFAULT 0,

    -- Return stats
    kick_returns INTEGER NOT NULL DEFAULT 0,
    kick_return_yards INTEGER NOT NULL DEFAULT 0,
    punt_returns INTEGER NOT NULL DEFAULT 0,
    punt_return_yards INTEGER NOT NULL DEFAULT 0,
    return_tds INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one stat line per player per game
    UNIQUE(game_id, player_id)
);

-- ============================================================================
-- GAME EVENTS TABLE
-- ============================================================================

CREATE TABLE game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 5),
    time_remaining VARCHAR(10) NOT NULL,
    event_type event_type NOT NULL,
    description TEXT NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES players(id) ON DELETE CASCADE,
    yards INTEGER NOT NULL DEFAULT 0,
    scoring_play BOOLEAN NOT NULL DEFAULT false,
    points_scored INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEASON STATS TABLE
-- ============================================================================

CREATE TABLE season_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_started INTEGER NOT NULL DEFAULT 0,

    -- Passing stats (totals)
    pass_attempts INTEGER NOT NULL DEFAULT 0,
    pass_completions INTEGER NOT NULL DEFAULT 0,
    pass_yards INTEGER NOT NULL DEFAULT 0,
    pass_tds INTEGER NOT NULL DEFAULT 0,
    interceptions INTEGER NOT NULL DEFAULT 0,
    sacks_taken INTEGER NOT NULL DEFAULT 0,

    -- Rushing stats
    rush_attempts INTEGER NOT NULL DEFAULT 0,
    rush_yards INTEGER NOT NULL DEFAULT 0,
    rush_tds INTEGER NOT NULL DEFAULT 0,
    fumbles INTEGER NOT NULL DEFAULT 0,
    fumbles_lost INTEGER NOT NULL DEFAULT 0,

    -- Receiving stats
    targets INTEGER NOT NULL DEFAULT 0,
    receptions INTEGER NOT NULL DEFAULT 0,
    receiving_yards INTEGER NOT NULL DEFAULT 0,
    receiving_tds INTEGER NOT NULL DEFAULT 0,
    drops INTEGER NOT NULL DEFAULT 0,

    -- Defensive stats
    tackles INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    sacks DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    tackles_for_loss INTEGER NOT NULL DEFAULT 0,
    forced_fumbles INTEGER NOT NULL DEFAULT 0,
    fumble_recoveries INTEGER NOT NULL DEFAULT 0,
    interceptions_defense INTEGER NOT NULL DEFAULT 0,
    pass_deflections INTEGER NOT NULL DEFAULT 0,
    defensive_tds INTEGER NOT NULL DEFAULT 0,

    -- Kicking stats
    field_goals_made INTEGER NOT NULL DEFAULT 0,
    field_goals_attempted INTEGER NOT NULL DEFAULT 0,
    longest_field_goal INTEGER NOT NULL DEFAULT 0,
    extra_points_made INTEGER NOT NULL DEFAULT 0,
    extra_points_attempted INTEGER NOT NULL DEFAULT 0,

    -- Punting stats
    punts INTEGER NOT NULL DEFAULT 0,
    punt_yards INTEGER NOT NULL DEFAULT 0,
    inside_20 INTEGER NOT NULL DEFAULT 0,
    touchbacks INTEGER NOT NULL DEFAULT 0,

    -- Return stats
    kick_returns INTEGER NOT NULL DEFAULT 0,
    kick_return_yards INTEGER NOT NULL DEFAULT 0,
    punt_returns INTEGER NOT NULL DEFAULT 0,
    punt_return_yards INTEGER NOT NULL DEFAULT 0,
    return_tds INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one stat record per player per season
    UNIQUE(player_id, season_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Games indexes
CREATE INDEX idx_games_season_id ON games(season_id);
CREATE INDEX idx_games_week ON games(week);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE INDEX idx_games_simulated ON games(simulated);

-- Game Stats indexes
CREATE INDEX idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX idx_game_stats_player_id ON game_stats(player_id);
CREATE INDEX idx_game_stats_team_id ON game_stats(team_id);

-- Game Events indexes
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_player_id ON game_events(player_id);
CREATE INDEX idx_game_events_scoring ON game_events(scoring_play);

-- Season Stats indexes
CREATE INDEX idx_season_stats_player_id ON season_stats(player_id);
CREATE INDEX idx_season_stats_season_id ON season_stats(season_id);
CREATE INDEX idx_season_stats_team_id ON season_stats(team_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_stats ENABLE ROW LEVEL SECURITY;

-- Games policies (users can view games for their franchise seasons)
CREATE POLICY "Users can view games for own franchise" ON games
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert games for own franchise" ON games
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update games for own franchise" ON games
    FOR UPDATE USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Game stats policies
CREATE POLICY "Users can view game stats for own franchise" ON game_stats
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games WHERE
            season_id IN (
                SELECT id FROM seasons WHERE
                franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert game stats for own franchise" ON game_stats
    FOR INSERT WITH CHECK (
        game_id IN (
            SELECT id FROM games WHERE
            season_id IN (
                SELECT id FROM seasons WHERE
                franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
            )
        )
    );

-- Game events policies
CREATE POLICY "Users can view game events for own franchise" ON game_events
    FOR SELECT USING (
        game_id IN (
            SELECT id FROM games WHERE
            season_id IN (
                SELECT id FROM seasons WHERE
                franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert game events for own franchise" ON game_events
    FOR INSERT WITH CHECK (
        game_id IN (
            SELECT id FROM games WHERE
            season_id IN (
                SELECT id FROM seasons WHERE
                franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
            )
        )
    );

-- Season stats policies
CREATE POLICY "Users can view season stats for own franchise" ON season_stats
    FOR SELECT USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert season stats for own franchise" ON season_stats
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update season stats for own franchise" ON season_stats
    FOR UPDATE USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_season_stats_updated_at BEFORE UPDATE ON season_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
