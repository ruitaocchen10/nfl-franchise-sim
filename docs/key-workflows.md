Key Workflows:

1. User creates account (users table)
2. User clicks "New Franchise"
3. Selects team from 32 options (teams table)
4. Selects difficulty (easy/medium/hard)
5. Names franchise
6. System creates: - franchise record - season record (year 2024, week 0, preseason phase) - Copies all 1,696 NFL players → creates player_attributes for this season - Assigns players to teams → creates roster_spots - Generates contracts for all players - Generates schedule → creates 256 regular season games - Creates depth charts for all teams - Creates coaches/staff for all teams - Initializes team_standings (all 0-0) - Creates team_finances with salary cap
7. User enters franchise at preseason phase

### 5.2 Simulating a Game ```

1. User clicks "Simulate Game" or "Simulate Week"
2. System loads: - Both teams' rosters - Depth charts (who's starting) - Player attributes - Active injuries - Team chemistry
3. Simulation engine runs: a. Generates play-by-play (not stored, just shown) b. Calculates stats based on player ratings + some randomness c. Determines injuries (random chance based on injury_prone) d. Creates game_events for key plays
4. System saves: - game.home_score, game.away_score, game.simulated = true - game_stats for all players who played - injuries (if any occurred) - Updates season_stats (aggregate) - Updates team_standings (wins/losses)
5. UI shows: - Final score - Box score (passing/rushing/receiving stats) - Key plays from game_events - Injury report

### 5.3 Making a Trade ```

1. User goes to "Trade Center"
2. Selects target team and player
3. Builds trade package: - Adds own players/picks to offer - Adds desired players/picks from other team
4. System calculates trade value: - Player value = overall rating + age + contract + position scarcity - Pick value = draft value chart
5. AI evaluates: - Is value fair? (within 15%) - Does it fill team_needs? - Does it fit salary cap? - Random acceptance modifier
6. If accepted: - Creates trade record (status: accepted) - Creates trade_assets for each item - Updates roster_spots (players change teams) - Updates draft_picks (current_owner changes) - Updates team_finances (cap implications) - Updates team_needs (recalculated)
7. UI shows trade confirmation

### 5.4 Draft Process ```

1. Regular season ends → System generates draft_picks based on standings
2. Offseason phase begins
3. System generates ~350 draft_prospects with: - Visible: combine stats, projected round, draft grade - Hidden: true_overall, true_potential, true attributes
4. User allocates scouting budget: - Each prospect can be scouted 0-100% - Creates scouting_reports with estimated ranges - More scouting = narrower estimate range
5. Draft day: - Follows pick order (draft*picks.pick_number) - Each pick: a. If AI team: selects based on team_needs + best available + scouting b. If user team: user makes selection - Selected prospect: a. Creates player record b. Links to draft_pick.player_id c. Creates roster_spot d. Creates rookie contract (4 years, slotted by pick) e. Creates player_attributes (using true* values from prospect)
6. After draft: - All prospects without player_id deleted - System moves to free_agency phase ```

### 5.5 Player Progression (Offseason) ```

1. After season ends, for each player:
2. System checks: - Age (from players table) - Development trait (from player_attributes) - Season performance (from season_stats) - Coach quality (from coaches)
3. Progression formula: Age < 23: +3 to +5 overall Age 23-26: +1 to +3 overall (star/superstar traits) Age 27-29: 0 to +1 overall Age 30-32: -1 to 0 overall Age 33+: -2 to -4 overall Modifiers: - Good season stats: +1 - Bad season stats: -1 - Good coach: +1 - High morale: +1
4. Updates player_attributes for new season: - Creates new player_attributes record for next season - Applies progression changes - Resets morale to baseline - Adjusts potential if reached 5. Contract years decrease: - contract.years_remaining -= 1 - If years_remaining = 0: player becomes free agent
