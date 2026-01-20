-- Migration: Add INSERT policies for franchise creation
-- This allows users to insert data into their own franchise's season tables

-- Player Attributes - Allow insert for own franchise seasons
CREATE POLICY "Users can insert player attributes for own franchise" ON player_attributes
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Roster Spots - Allow insert for own franchise seasons
CREATE POLICY "Users can insert roster spots for own franchise" ON roster_spots
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Contracts - Allow insert for own franchise seasons
CREATE POLICY "Users can insert contracts for own franchise" ON contracts
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Team Standings - Allow insert for own franchise seasons
CREATE POLICY "Users can insert standings for own franchise" ON team_standings
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );

-- Team Finances - Allow insert for own franchise seasons
CREATE POLICY "Users can insert finances for own franchise" ON team_finances
    FOR INSERT WITH CHECK (
        season_id IN (
            SELECT id FROM seasons WHERE
            franchise_id IN (SELECT id FROM franchises WHERE user_id = auth.uid())
        )
    );