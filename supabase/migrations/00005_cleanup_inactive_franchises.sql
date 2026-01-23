-- Cleanup Inactive Franchises
-- Migration: 00005_cleanup_inactive_franchises
-- Description: Removes all franchises marked as inactive (is_active = false)
--              This will cascade delete all associated data (seasons, players, games, etc.)

-- ============================================================================
-- DELETE INACTIVE FRANCHISES
-- ============================================================================

-- Delete all franchises where is_active = false
-- The ON DELETE CASCADE constraints will automatically clean up:
-- - seasons
-- - player_attributes
-- - roster_spots
-- - contracts
-- - team_standings
-- - team_finances
-- - games (and their game_stats, game_events)
-- - season_stats
-- - team_bye_weeks

DELETE FROM franchises WHERE is_active = false;
