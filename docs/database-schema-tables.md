# Core Tables

1. users

Purpose: Player accounts on the platform
Scope: Global (not franchise-specific)
Fields:

id - UUID primary key
username - Unique display name (3-50 characters)
email - Authentication email (managed by Supabase Auth)
created_at - Account creation timestamp
updated_at - Last modification timestamp

Relationships:

One user → Many franchises

Business Rules:

- Username must be unique across platform
- Email validated by Supabase Auth
- Deleting user cascades to all their franchises

2. franchises

Purpose: Individual save files/careers
Scope: Per-user, multiple allowed
Fields:

id - UUID primary key
user_id - Foreign key to users
franchise_name - User-defined save file name (e.g., "My Chiefs Dynasty")
team_id - Which team user controls (foreign key to teams)
difficulty - Enum: 'easy', 'medium', 'hard'
current_season_id - Foreign key to currently active season
created_at - When franchise was created
last_played_at - Last interaction timestamp (for sorting)

Relationships:

One franchise → One user (many-to-one)
One franchise → One controlled team
One franchise → Many seasons (one-to-many)
One franchise → One current season (one-to-one)

Business Rules:

- User can have unlimited franchises
- Each franchise controls exactly one team (other 31 are AI)
- Difficulty affects: AI trade intelligence, injury frequency, salary cap strictness, player development speed

Difficulty Effects:
Easy: AI Trades - Generous (70% fair value), Injuries - 50% frequency, Salary Cap - Warnings only, Development - +20% progression, Scouting Cost - 30%
Medium: AI Trades - Balanced (90% fair value), Injuries - 20% frequency, Salary Cap - Soft enforcement, Development - Standard, Scouting Cost - Standard
Hard: AI Trades - Shrewd (110% fair value), Injuries - Standard, Salary Cap - Strict hard cap, Development - -10% Progression, Scouting Cost - +20%

3. seasons

Purpose: Individual years within a franchise (or template)
Scope: Per-franchise, sequential
Fields:

id - UUID primary key
franchise_id - Foreign key to franchises (NULL for templates)
year - Integer year (2024, 2025, 2026...)
current_week - Integer 0-25 (0=preseason, 1-18=regular, 19+=playoffs)
season_phase - Enum: 'preseason', 'regular_season', 'playoffs', 'offseason', 'draft', 'free_agency'
is_template - Boolean (true for master template seasons)
created_at - Season creation timestamp

Relationships:

One season → One franchise (or NULL if template)
One season → Many games
One season → Many player_attributes
One season → Many roster_spots
One season → Many contracts

Business Rules:

- Template seasons have franchise_id = NULL and is_template = true
- User seasons have franchise_id set and is_template = false
- Each franchise has unique years (can't have two 2024 seasons)
- Week progression: 0 → 1-18 → 19-22 (playoffs) → offseason → draft → free_agency → (new season)

4. teams
   Purpose: All 32 NFL teams (static reference data)
   Scope: Global (shared across all franchises)
   Fields:

id - UUID primary key
name - Full team name (e.g., "Kansas City Chiefs")
abbreviation - 2-3 letter code (e.g., "KC")
city - City name (e.g., "Kansas City")
conference - Enum: 'AFC', 'NFC'
division - Enum: 'North', 'South', 'East', 'West'
logo_url - URL to team logo image
stadium - Stadium name
primary_color - Hex color code
secondary_color - Hex color code

Relationships:

One team → Many franchises (users can control it)
One team → Many roster_spots (per season)
One team → Many games (per season)

Business Rules:

- Exactly 32 teams (fixed, created during initial setup)
- Never modified by users
- Used as reference across all franchises
- Each franchise independently manages rosters for all 32 teams

AFC East: Bills, Dolphins, Patriots, Jets
AFC North: Ravens, Bengals, Browns, Steelers
AFC South: Texans, Colts, Jaguars, Titans
AFC West: Broncos, Chiefs, Raiders, Chargers

NFC East: Cowboys, Giants, Eagles, Commanders
NFC North: Bears, Lions, Packers, Vikings
NFC South: Falcons, Panthers, Saints, Buccaneers
NFC West: Cardinals, Rams, 49ers, Seahawks

5. players

Purpose: All players in the league (base identity data)
Scope: Global (shared, but attributes are franchise-specific)
Fields:

id - UUID primary key
first_name - Player first name
last_name - Player last name
position - Enum: 'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P'
age - Current age (updated each offseason)
college - College attended
draft_year - Year drafted into NFL
draft_round - Round drafted (1-7, NULL if undrafted)
draft_pick - Overall pick number (1-256, NULL if undrafted)
years_pro - Years in the league
height - Height in inches
weight - Weight in pounds
photo_url - URL to player headshot
handedness - Enum: 'right', 'left' (for QBs primarily)

Relationships:

One player → Many player_attributes (one per season)
One player → Many roster_spots (tracks team changes)
One player → Many contracts
One player → Many game_stats
One player → Many season_stats

Business Rules:

- Initial 1,696 players loaded from real 2024 NFL data
- New players added through draft each year
- Player base identity never changes (name, college, draft info)
- Age increments during offseason progression
- Position changes are rare but possible

6. player_attributes
   Purpose: Season-specific player ratings and development traits
   Scope: Per-season, per-franchise
   Fields:
   Core Attributes:

id - UUID primary key
player_id - Foreign key to players
season_id - Foreign key to seasons
overall - Composite rating 70-99 (calculated from other attributes)
potential - Development ceiling 70-99 (hidden from user)
injury_prone - Injury susceptibility 0-100 (higher = more prone)
morale - Player happiness 0-100 (affects performance)
confidence - Recent performance confidence 0-100
development_trait - Enum: 'superstar', 'star', 'normal', 'slow'

Physical Attributes:

speed - 60-99 (affects all positions)
strength - 60-99 (contact, blocking)
stamina - 60-99 (fatigue resistance)
awareness - 60-99 (football IQ, recognition)

Position-Specific Attributes (nullable based on position):
QB:

accuracy - Passing accuracy
arm_strength - Deep ball ability
throw_power - Velocity
pocket_presence - Pressure handling

RB/WR/TE:

hands - Catching ability
route_running - Route precision (WR/TE)
elusiveness - Juke/spin moves (RB)
catching - Contested catches

OL:

pass_block - Pass protection
run_block - Run blocking

DL/LB:

pass_rush - QB pressure ability
run_stop - Run defense
tackling - Tackle success rate

DB:

coverage - Man/zone coverage
jumping - Contested balls
play_recognition - Route anticipation

K/P:

kick_power - Distance
kick_accuracy - Precision

Relationships:

One player_attribute → One player in one season (unique constraint)

Business Rules:

- One record per player per season
- Copied from template when franchise created
- Evolves each offseason based on age/performance
- Overall is weighted average of relevant position attributes
- Development trait affects progression rate

QB Overall = (
accuracy _ 0.25 +
arm_strength _ 0.15 +
awareness _ 0.20 +
speed _ 0.10 +
throw_power _ 0.15 +
pocket_presence _ 0.15
)

WR Overall = (
hands _ 0.25 +
route_running _ 0.25 +
speed _ 0.30 +
catching _ 0.20
)

CB Overall = (
coverage _ 0.35 +
speed _ 0.30 +
awareness _ 0.20 +
jumping _ 0.15
)

## Progression System

| Age Range | Base Change | Superstar | Star | Normal | Slow |
| --------: | ----------: | --------: | ---: | -----: | ---: |
|      < 23 |    +3 to +5 |        +5 |   +4 |     +3 |   +2 |
|     23–26 |    +1 to +3 |        +3 |   +2 |     +1 |    0 |
|     27–29 |     0 to +1 |        +1 |    0 |      0 |   -1 |
|     30–32 |     -1 to 0 |         0 |   -1 |     -1 |   -2 |
|       33+ |    -2 to -4 |        -2 |   -3 |     -4 |   -5 |

Modifiers:

Great season stats: +1
Poor season stats: -1
Good coach: +1
High morale (80+): +1
Low morale (<40): -1

7. roster_spots

Purpose: Which players are on which teams
Scope: Per-season, per-franchise
Fields:

id - UUID primary key
team_id - Foreign key to teams
player_id - Foreign key to players
season_id - Foreign key to seasons
position_group - Position group (QB, RB, WR, etc.)
depth_position - Depth chart order (1=starter, 2=backup, etc.)
jersey_number - 0-99
status - Enum: 'active', 'injured_reserve', 'practice_squad', 'suspended', 'inactive'
signed_week - Week player joined team
released_week - Week player was cut (NULL if still on team)

Relationships:

One roster_spot → One player on one team in one season

Business Rules:

- Active roster limit: 53 players
- Practice squad limit: 16 players
- Injured reserve: Unlimited (must miss minimum 4 weeks)
- When player is cut: set status = 'inactive' and released_week

8. depth_charts
   Purpose: Starting lineup and backup ordering
   Scope: Per-season, per-team
   Fields:

id - UUID primary key
team_id - Foreign key to teams
season_id - Foreign key to seasons
position_label - String (e.g., "QB1", "WR1", "WR2", "LT", "CB1")
player_id - Foreign key to players
depth_order - Integer (1=starter, 2=first backup, etc.)

Relationships:

One depth_chart → One player in one position

Business Rules:

- User can manually adjust their team's depth chart
- AI auto-generates based on overall ratings
- Used by simulation to determine who plays
- Injuries automatically bump up depth chart

Offense:

- QB1, QB2, QB3
- RB1, RB2, RB3
- WR1, WR2, WR3, WR4
- TE1, TE2
- LT, LG, C, RG, RT (offensive line)

Defense:

- DE1, DE2, DT1, DT2 (defensive line)
- MLB, OLB1, OLB2 (linebackers)
- CB1, CB2, CB3, CB4 (corners)
- SS, FS (safeties)

Special Teams:

- K (kicker)
- P (punter)
- KR (kick returner)
- PR (punt returner)

9. contracts
   Purpose: Player salary agreements
   Scope: Per-player, can span multiple seasons
   Fields:

id - UUID primary key
player_id - Foreign key to players
team_id - Foreign key to teams
season_id - Foreign key to seasons (when signed)
years_total - Total contract length
years_remaining - Years left (decrements each offseason)
salary_per_year - Annual salary in dollars
signing_bonus - Upfront bonus (prorated over contract)
guaranteed_money - Guaranteed portion
incentives - Performance bonus potential
contract_type - Enum: 'rookie', 'veteran', 'franchise_tag', 'extension', 'minimum'
no_trade_clause - Boolean
team_option_year - Which year has team option (NULL if none)

Relationships:

One contract → One player with one team

Business Rules:

- Rookie contracts: 4 years, slotted by draft position
- Veteran contracts: 1-7 years typical
- Franchise tag: 1 year, ~120% of top 5 position average
- Salary cap hit = (salary_per_year + signing_bonus/years_total)
- Guaranteed money creates dead money if player cut
- Years_remaining decrements by 1 each offseason
- When years_remaining reaches 0, player becomes free agent
- No_trade_clause prevents trading without player consent

10. injuries
    Purpose: Current and historical player injuries
    Scope: Per-season
    Fields:

id - UUID primary key
player_id - Foreign key to players
season_id - Foreign key to seasons
injury_type - Text (e.g., "Hamstring", "ACL Tear", "Concussion")
severity - Enum: 'questionable', 'doubtful', 'out', 'injured_reserve', 'season_ending'
weeks_out - Number of weeks until return
week_occurred - Week injury happened
game_id - Foreign key to games (NULL if practice injury)
healed - Boolean

Relationships:

One injury → One player in one season
Multiple injuries possible per player per season

Business Rules:

- Occurs randomly during game simulation based on player.injury_prone
- Base injury chance: 2% per game
- Modified by injury_prone rating
- Severity determines recovery time
- Questionable: 25% chance to play, 0-1 weeks
- Doubtful: 10% chance to play, 1-2 weeks
- Out: 0% chance, 1-3 weeks
- Injured Reserve: 0% chance, 4-8 weeks
- Season-ending: Out for remainder of season
- Weeks_out decrements by 1 each week
- When weeks_out = 0, set healed = true

11. team_standings
    Purpose: Win-loss records and playoff seeding
    Scope: Per-season
    Fields:

id - UUID primary key
team_id - Foreign key to teams
season_id - Foreign key to seasons
wins - Total wins
losses - Total losses
ties - Total ties
points_for - Total points scored
points_against - Total points allowed
division_wins - Wins within division
division_losses - Losses within division
conference_wins - Wins within conference
conference_losses - Losses within conference
streak - Current streak (e.g., "W3", "L2")
clinched_playoffs - Boolean
clinched_division - Boolean
eliminated - Boolean
division_rank - 1-4 within division
conference_rank - 1-16 within conference

Relationships:

One standing → One team per season

Business Rules:

- All teams start 0-0
- Updated after each game simulation
- Used for playoff seeding
- Tiebreaker order: head-to-head → division record → conference record → point differential
- Division winners get playoff spots 1-4
- Wild cards get spots 5-7 (best records among non-division winners)

Playoff Qualification:

- 7 teams per conference (14 total)
- 4 division winners (seeded 1-4)
- 3 wild cards (seeded 5-7)
- #1 seed gets bye week

12. team_finances
    Purpose: Salary cap tracking
    Scope: Per-season
    Fields:

id - UUID primary key
team_id - Foreign key to teams
season_id - Foreign key to seasons
salary_cap - League-wide cap (e.g., $255M in 2024)
cap_space_used - Total active contracts
cap_space_available - Remaining space
dead_money - Cap hits from released players
rollover_space - Unused cap from previous year

Relationships:

One finance record → One team per season

Business Rules:

- Salary cap is league-wide constant (~$255M in 2024)
- Cap_space_used = SUM(all active contracts.cap_hit)
- Cap_space_available = salary_cap - cap_space_used
- Dead_money from cutting players with guaranteed money
- Rollover_space = previous season's unused cap (max ~$20M)
- Hard cap in hard mode (cannot exceed under any circumstance)
- Soft cap in easy/medium (warnings but allowed)

Salary Cap Rules:

- Updated when: signing players, cutting players, restructuring contracts
- Contract restructures can create cap space (convert salary to bonus)
- Rookie pool: ~$10M reserved per team for draft picks
- Minimum team salary: 89% of cap floor (~$226M)

13. team_needs
    Purpose: Position priority for AI decision-making
    Scope: Per-season
    Fields:

id - UUID primary key
team_id - Foreign key to teams
season_id - Foreign key to seasons
position - Position group (QB, RB, WR, etc.)
priority - 0-100 (higher = more urgent need)
updated_at - Last recalculation timestamp

Relationships:

One team → Multiple needs per season

Business Rules:

Calculated based on:

- Roster gaps (missing starters)
- Starter age (aging players need replacement)
- Starter rating (low-rated starters)
- Injury history (injury-prone positions)

Recalculated after: trades, cuts, signings, injuries
Used by AI for: draft strategy, free agency targets, trade offers
User's team shows needs as suggestions (not binding)

14. team_chemistry
    Purpose: Team morale and cohesion
    Scope: Per-season
    Fields:

id - UUID primary key
team_id - Foreign key to teams
season_id - Foreign key to seasons
overall_chemistry - 0-100 composite score
offense_chemistry - 0-100
defense_chemistry - 0-100
locker_room_morale - 0-100
win_streak_bonus - 0-20 bonus from recent wins
recent_form - String (e.g., "W-W-L-W-W" last 5 games)

Relationships:

One chemistry record → One team per season

Business Rules:

- Starts at 70 each season
- Increases from: winning, good coaching, veteran leadership, fair contracts
- Decreases from: losing streaks, coaching changes, contract disputes, injuries
- Effects: +10 chemistry = +1-2 overall team performance in games
- Updated weekly after games

# Game & Performance Tables

15. games
    Purpose: Schedule and game results
    Scope: Per-season
    Fields:

id - UUID primary key
season_id - Foreign key to seasons
week - 1-22 (1-18 regular, 19-22 playoffs)
home_team_id - Foreign key to teams
away_team_id - Foreign key to teams
home_score - Final score (NULL if not played)
away_score - Final score (NULL if not played)
game_type - Enum: 'preseason', 'regular', 'wildcard', 'divisional', 'conference', 'superbowl'
simulated - Boolean
simulated_at - Timestamp of simulation
overtime - Boolean
weather - Enum: 'clear', 'rain', 'snow', 'wind', 'dome'

Relationships:

One game → Two teams
One game → Many game_stats (all players who played)
One game → Many game_events

Business Rules:

- 17-game regular season (256 total games across league)
- Each team plays: 6 division games, 4 conference games, 4 other conference, 3 out-of-conference
- Schedule generated at season start
- User can simulate: single game, full week, or rest of season
- Playoff games created dynamically based on standings
- Weather affects passing (-10% in rain, -20% in snow) and kicking (-15% wind)

Regular Season (17 games per team):

- 6 games vs division rivals (home and away)
- 4 games vs one division in same conference (rotating)
- 4 games vs one division in other conference (rotating)
- 2 games vs same-place finishers in other divisions
- 1 extra game

Playoffs:
Week 19: Wild Card (3 games per conference, #2-7 seeds)
Week 20: Divisional (2 games per conference, #1 seed enters)
Week 21: Conference Championships (1 game per conference)
Week 22: Super Bowl

16. game_stats
    Purpose: Individual player performance per game
    Scope: Per-game
    Fields:

id - UUID primary key
game_id - Foreign key to games
player_id - Foreign key to players
team_id - Foreign key to teams

Passing:

pass_attempts - Integer
pass_completions - Integer
pass_yards - Integer
pass_tds - Integer
interceptions - Integer
sacks_taken - Integer
qb_rating - Float (calculated)

Rushing:

rush_attempts - Integer
rush_yards - Integer
rush_tds - Integer
fumbles - Integer
fumbles_lost - Integer

Receiving:

targets - Integer
receptions - Integer
receiving_yards - Integer
receiving_tds - Integer
drops - Integer

Defense:

tackles - Integer
assists - Integer
sacks - Float (0.5 for assisted)
tackles_for_loss - Integer
forced_fumbles - Integer
fumble_recoveries - Integer
interceptions_defense - Integer
pass_deflections - Integer
defensive_tds - Integer

Kicking:

field_goals_made - Integer
field_goals_attempted - Integer
longest_field_goal - Integer
extra_points_made - Integer
extra_points_attempted - Integer

Punting:

punts - Integer
punt_yards - Integer
inside_20 - Integer
touchbacks - Integer

Returns:

kick_returns - Integer
kick_return_yards - Integer
punt_returns - Integer
punt_return_yards - Integer
return_tds - Integer

Relationships:

One stat line → One player in one game

Business Rules:

- Only created for players who participated
- Generated during game simulation
- Used to calculate season_stats totals
- Affects player morale and confidence
- Exceptional performances (+2 morale): 300+ pass yards, 150+ rush yards, 150+ receiving yards, 10+ tackles, 2+ sacks
- Poor performances (-1 morale): 3+ INT, 3+ fumbles lost, 0 catches on 5+ targets

17. game_events

Purpose: Key moments and highlights
Scope: Per-game (optional but recommended)
Fields:

id - UUID primary key
game_id - Foreign key to games
quarter - 1-5 (5 = overtime)
time_remaining - Text format "MM:SS"
event_type - Enum: 'touchdown', 'field_goal', 'turnover', 'injury', 'big_play', 'safety', 'two_point'
description - Text narrative
player_id - Foreign key to players (primary actor)
player2_id - Foreign key to players (secondary, e.g., passer on TD reception)
yards - Integer
scoring_play - Boolean
points_scored - Integer

Relationships:

One event → One game
One event → One or two players

Business Rules:

Generated during simulation for notable plays
Shown in game recap UI
Adds narrative flavor to simulation
Events created for:

- All touchdowns
- Field goals 50+ yards
- Turnovers (INT, fumble)
- Big plays (30+ yard gains)
- Injuries
- Safeties
- 2-point conversions
- Game-winning plays

18. season_stats
    Purpose: Aggregated player statistics per season
    Scope: Per-season
    Fields:

id - UUID primary key
player_id - Foreign key to players
season_id - Foreign key to seasons
games_played - Integer
games_started - Integer

(Same stat categories as game_stats, but totaled)

pass_attempts, pass_completions, pass_yards, pass_tds, interceptions
rush_attempts, rush_yards, rush_tds, fumbles
targets, receptions, receiving_yards, receiving_tds
tackles, sacks, interceptions_defense, forced_fumbles
field_goals_made, field_goals_attempted, extra_points_made
etc.

Calculated Fields:

yards_per_carry - Float (rush_yards / rush_attempts)
yards_per_reception - Float (receiving_yards / receptions)
completion_percentage - Float (pass_completions / pass_attempts)
yards_per_attempt - Float (pass_yards / pass_attempts)
td_int_ratio - Float (pass_tds / interceptions)

Relationships:

One stat record → One player per season

Business Rules:

Updated after each game (incremented)
Used for:

Awards (MVP, OPOY, DPOY, ROTY)
Pro Bowl selections
All-Pro teams
Player value in trades/contracts
End-of-season progression calculation

Thresholds for awards:

MVP: Top QB or position player with elite stats + winning record
OPOY: League leader in key offensive stat
DPOY: League leader in sacks, INT, or tackles + impact plays

# Draft System Tables

19. draft_picks
    Purpose: Ownership and tracking of draft selections
    Scope: Per-season
    Fields:

id - UUID primary key
season_id - Foreign key to seasons
round - 1-7
pick_number - Overall pick 1-256 (in order)
pick_in_round - 1-32 (pick within round)
original_team_id - Foreign key to teams (who originally owned it)
current_owner_id - Foreign key to teams (who owns it now)
player_id - Foreign key to players (NULL until drafted)
traded - Boolean
compensatory - Boolean (comp picks in rounds 3-7)

Relationships:

One pick → One season
One pick → Original team and current owner
One pick → One player (after draft)

Business Rules:

- Generated at end of regular season based on standings
- Draft order: inverse of regular season record
- Worst team (worst record) = #1 pick
- Playoff teams pick based on playoff performance
- Can be traded before or during draft
- Compensatory picks: awarded for lost free agents (formula-based)
- 7 rounds × 32 teams = 224 picks + ~32 compensatory picks = ~256 total

20. draft_prospects

Purpose: Incoming rookie class each year
Scope: Per-season (draft class)
Fields:

id - UUID primary key
season_id - Foreign key to seasons
first_name - Text
last_name - Text
position - Position enum
college - Text
age - Integer (typically 21-23)
height - Inches
weight - Pounds

Hidden Attributes (true talent):

true_overall - 65-95 (actual talent, hidden from user)
true_potential - 70-99 (development ceiling)
true_speed, true_strength, etc. (all attributes)

Visible Attributes:

draft_grade - Text (e.g., "1st Round Talent", "2-3 Round", "Late Round Sleeper")
projected_round_min - 1-7
projected_round_max - 1-7
combine_40_time - Float (4.3 - 5.2 seconds)
combine_bench - Integer (reps at 225 lbs)
combine_vertical - Integer (inches)
combine_broad_jump - Integer (inches)
three_cone - Float (seconds)
hype - 0-100 (media attention, affects projection accuracy)

Relationships:

One prospect → One season
Becomes player once drafted

Business Rules:

- ~350 prospects generated per draft
- Generated at start of offseason phase
- True ratings hidden until drafted
- Projections can be inaccurate (busts and steals)
- Scouting narrows the gap between projected and true
- Combine stats provide hints but aren't guarantees
- High hype can inflate projections (more busts)
- Deleted after draft if not selected

21. scouting_reports

Purpose: Team-specific evaluations of draft prospects
Scope: Per-team, per-prospect, per-season
Fields:

id - UUID primary key
team_id - Foreign key to teams
prospect_id - Foreign key to draft_prospects
season_id - Foreign key to seasons
scouting_level - 0-100 (% of budget allocated)
estimated_overall_min - Integer (lower bound estimate)
estimated_overall_max - Integer (upper bound estimate)
position_grade - Text (A+, A, B+, B, C+, C, D, F)
strengths - Text (e.g., "Elite speed, good hands")
weaknesses - Text (e.g., "Route running needs work")
comparison - Text (e.g., "Plays like Tyreek Hill")
fit_score - 0-100 (how well player fits team scheme)
scouted_at - Timestamp

Relationships:

One report → One team's view of one prospect

Business Rules:

- Scouting costs: limited budget per team (~$5M equivalent)
- Each prospect can be scouted 0-100%
- More scouting = tighter min/max range on true_overall
- At 0%: Range is ±15 from projected
- At 50%: Range is ±7
- At 100%: Range is ±2 (nearly reveals true overall)
- AI teams scout based on team_needs and projected round
- User allocates scouting budget manually
- Top prospects get more attention (AI and user)

# Staff & Coaching Tables

22. coaches
    Purpose: Coaching staff for each team
    Scope: Per-season
    Fields:

id - UUID primary key
team_id - Foreign key to teams
season_id - Foreign key to seasons
first_name - Text
last_name - Text
role - Enum: 'head_coach', 'offensive_coordinator', 'defensive_coordinator', 'special_teams_coordinator', 'QB_coach', 'RB_coach', 'WR_coach', 'OL_coach', 'DL_coach', 'LB_coach', 'DB_coach'
overall - 60-95 (coaching ability)
specialty - Text (e.g., "Offensive Genius", "QB Whisperer", "Defensive Mastermind")
scheme_fit - Text (e.g., "West Coast Offense", "4-3 Defense", "Cover 2")
contract_years_remaining - Integer
salary - Integer (annual)
hired_season - Integer (which season hired)
fired_season - Integer (NULL if employed)

Relationships:

One coach → One team per season
One team → Multiple coaches (HC, coordinators, position coaches)

Business Rules:

- Head coach overall: 70-95 (affects overall team +/- 2-3 in games)
- Coordinators: 65-90 (affect offensive/defensive efficiency)
- Position coaches: 60-85 (affect player development in position group)
- Better coaches = faster player progression (+1-2 overall per year)
- Coaches can be fired during offseason if poor performance
- Head coach salary: $3M - $15M per year
- Coordinators: $1M - $4M per year
- Position coaches: $500K - $1.5M per year
- Coach salaries count against salary cap in hard mode

23. staff

Purpose: Front office, scouts, trainers
Scope: Per-season
Fields:

id - UUID primary key
team_id - Foreign key to teams
season_id - Foreign key to seasons
name - Text
role - Enum: 'general_manager', 'college_scout', 'pro_scout', 'trainer', 'personnel_director'
overall - 60-95
specialty - Text (e.g., "College Scouting", "Injury Prevention", "Contract Negotiation")
salary - Integer

Relationships:

One staff → One team per season

Business Rules:

- General Manager: Affects AI trade offers and negotiation success
- College Scouts: Better scouts = more accurate draft evaluations (+5% scouting accuracy)
- Pro Scouts: Better scouts = better free agent evaluations
- Trainers: Better trainers = fewer injuries (-10% injury rate), faster recovery (-1 week)
- Personnel Director: Helps with draft board and depth chart recommendations
- Staff salaries: $500K - $3M per year
- Affects difficulty: Better staff makes GM role easier

24. trades

Purpose: Trade proposals and completed deals
Scope: Per-season
Fields:

id - UUID primary key
season_id - Foreign key to seasons
week - Integer (when proposed)
team1_id - Foreign key to teams
team2_id - Foreign key to teams
proposed_by_team - Foreign key to teams (initiator)
status - Enum: 'pending', 'accepted', 'rejected', 'countered', 'expired'
created_at - Timestamp
completed_at - Timestamp (NULL if not completed)
trade_deadline_eligible - Boolean

Relationships:

One trade → Two teams
One trade → Many trade_assets

Business Rules:

- Trade deadline: Week 9 of regular season
- Before deadline: players + picks can be traded
- After deadline: only draft picks can be traded

AI evaluates trades based on:

Value chart (must be within 15% fair value)
Team needs (does it fill a hole?)
Salary cap fit (can we afford it?)
Random acceptance modifier (±10%)

User can propose to AI or receive AI proposals
Trades can include multiple assets on each side
No-trade clauses must be honored (player consent required)

25. trade_assets
    Purpose: Items included in each trade
    Scope: Per-trade
    Fields:

id - UUID primary key
trade_id - Foreign key to trades
from_team_id - Foreign key to teams
to_team_id - Foreign key to teams
asset_type - Enum: 'player', 'draft_pick', 'cash'
player_id - Foreign key to players (NULL if not player)
draft_pick_id - Foreign key to draft_picks (NULL if not pick)
cash_amount - Integer (NULL if not cash)

Relationships:

One asset → One trade
Multiple assets per trade

Business Rules:

Each side of trade can include multiple assets
Common trade patterns:

Player for player
Player for pick(s)
Player + pick for better player
Multiple picks for high pick (trade up in draft)

Cash trades limited to $10M per transaction
Assets must be owned by from_team_id
When trade accepted:

Players: update roster_spots.team_id
Draft picks: update draft_picks.current_owner_id
Contracts move with players

26. free_agent_signings
    Purpose: Contract offers and negotiations
    Scope: Per-season
    Fields:

id - UUID primary key
player_id - Foreign key to players
team_id - Foreign key to teams
season_id - Foreign key to seasons
week - Integer (when offer made)
offer_years - Integer
offer_total - Integer (total contract value)
offer_per_year - Integer (annual salary)
offer_guaranteed - Integer (guaranteed money)
offer_bonus - Integer (signing bonus)
status - Enum: 'pending', 'accepted', 'rejected', 'countered', 'expired'
player_interest - 0-100 (how interested player is)
created_at - Timestamp
decided_at - Timestamp

Relationships:

One offer → One player from one team

Business Rules:

Free agency opens: Week 1 of offseason phase
Players with expired contracts (years_remaining = 0) become free agents
Teams can make multiple offers to same player
Players evaluate offers based on:

Money (70% weight): Total value, guaranteed money
Team quality (15% weight): Recent record, playoff contender
Role (10% weight): Starter vs backup opportunity
Location (5% weight): Random preference

Players can counter-offer (request more money/years)
Best offer usually wins unless strong team preference
Offers expire after 1 week if not accepted
