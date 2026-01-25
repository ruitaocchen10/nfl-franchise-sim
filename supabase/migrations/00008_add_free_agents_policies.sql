-- Migration: Add INSERT and UPDATE policies for free_agents
-- This allows users to insert and update free agents for their own franchise's seasons

-- Free Agents - Allow insert for own franchise seasons
CREATE POLICY "Users can insert free agents for own franchise" ON free_agents
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Free Agents - Allow update for own franchise seasons
CREATE POLICY "Users can update free agents for own franchise" ON free_agents
    FOR UPDATE USING (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );
