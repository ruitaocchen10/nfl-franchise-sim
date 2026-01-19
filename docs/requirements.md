# Product Vision

## What We're Building

An NFL franchise management simulation game where players take on the role of a General Manager/Owner, making strategic decisions to build a championship team over multiple seasons. Unlike traditional football games that focus on gameplay, this simulator is entirely management-focused: drafting players, making trades, managing the salary cap, and building a dynasty through smart decision-making.

## Core Philosophy

No Gameplay Required: 100% simulation-based, no manual play-calling
Realistic: Based on real NFL rules, rosters, and mechanics
Strategic Depth: Meaningful decisions with long-term consequences
Approachable: Easy to learn, difficult to master
Single-Player Focus: Solo experience (multiplayer is future consideration)

# Core Features

1. Franchise Management
   Description: Create and manage multiple save files (franchises), each representing a different career/playthrough.

Key Capabilities:

- Create unlimited franchises
- Choose from all 32 NFL teams
- Select difficulty level (easy, medium, hard)
- Name your franchise
- Track multiple careers simultaneously
- Delete/archive old franchises

2. Roster Management

Description: Build and manage your team's 53-man roster plus practice squad.
Key Capabilities:

- View complete team roster with player ratings
- Organize depth chart (starters, backups)
- Cut players (with salary cap implications)
- Sign free agents
- Manage injured reserve
- Practice squad management
- Jersey number assignment
- Position changes

3. Game Simulation

Description: Simulate NFL games with realistic outcomes based on team/player attributes.

Key Capabilities:

- Simulate single game
- Simulate full week (all games)
- Simulate to playoffs
- Simulate rest of season
- View box scores (passing, rushing, receiving, defense stats)
- See key plays and highlights
- Injury reports
- Real-time score updates
- Playoff bracket simulation

Simulation Fidelity:

- Outcome based on player overall ratings, depth chart, injuries, chemistry
- Statistical realism (QB averages ~250 yards, RB ~80 yards, etc.)
- Home field advantage (+2-3 points)
- Weather effects (rain, snow impact passing/kicking)
- Upset potential (weaker teams can win ~25% of time)

4. Season Progression

Description: Advance through multiple NFL seasons with your franchise.

Key Capabilities:

- Progress from preseason → regular season → playoffs → offseason → draft → free agency
- Player age advancement
- Player skill progression/regression
- Contract year decrements
- Retirements (age-based)
- Coaching changes
- League-wide simulation (all 32 teams evolve)

Season Phases:

- Preseason (Week 0): Roster cuts, depth chart adjustments, final signings
- Regular Season (Weeks 1-18): Game simulation, in-season roster moves, injury management
- Playoffs (Weeks 19-22): Wild Card → Divisional → Conference → Super Bowl
- Offseason: Player progression, retirements, contract expirations
- Draft: 7-round rookie draft
- Free Agency: Sign unrestricted free agents

5. NFL Draft

Description: Annual 7-round draft with scouting and talent evaluation.

Key Capabilities:

- 7 rounds, ~250+ draft picks total
- Make selections for your team
- AI selects for other 31 teams
- Trade draft picks (before or during draft)
- Scout prospects (allocate scouting budget)
- View prospect combine stats (40-time, bench, vertical)
- See projected draft ranges
- Hidden "true" ratings (scouting reveals them)
- Rookie contract auto-generation (4 years, slotted)

Scouting System:

- Limited scouting budget per season
- Allocate budget across ~350 prospects
- More scouting = more accurate ratings
- 0% scouting: Wide range (±15 overall)
- 100% scouting: Narrow range (±2 overall)
- Combine stats provide hints but not guarantees
- Potential for busts (high projection, low actual) and steals (low projection, high actual)

6. Trading

Description: Trade players and draft picks with AI-controlled teams.
Key Capabilities:

- Propose trades to any team
- Receive trade offers from AI
- Multi-asset trades (3-for-1, 2-for-2, etc.)
- Trade players, draft picks, or both
- AI evaluates fairness (value chart)
- Trade deadline (Week 9)
- Post-deadline: draft picks only
- View trade history
- Salary cap validation

Trade AI Logic:

- Value calculation based on: player rating, age, position, contract
- Draft pick values (standard NFL draft value chart)
- Trades must be within ~15% fair value
- AI considers team needs (more likely to accept if fills hole)
- AI considers salary cap (rejects if can't afford)
- Difficulty affects AI generosity (easy = AI undervalues their assets)
- Random acceptance modifier (±10%) for unpredictability

7. Free Agency
   Description: Sign players whose contracts have expired.
   Key Capabilities:

- View available free agents (sorted by position, rating)
- Make contract offers (years, total value, guaranteed money)
- Receive counter-offers
- Compete with AI teams for signatures
- Sign undrafted free agents after draft
- Minimum salary signings

Free Agency AI:

Players evaluate offers based on:

- Money (70% weight)
- Team quality (15% weight - playoff contenders favored)
- Role (10% weight - starter opportunity favored)
- Location preference (5% weight - random)
- Players can counter-offer
- Best offer usually wins (unless strong team preference)
- Market rates based on position and rating

8. Salary Cap Management

Description: Manage team finances within NFL salary cap rules.
Key Capabilities:

- View current cap space
- Track all player contracts
- See contract details (years, salary, guaranteed money, bonuses)
- Calculate cap hits
- Dead money tracking (from cut players)
- Rollover cap space from previous season
- Warnings when approaching cap limit
- Salary cap enforcement (difficulty-dependent)

Salary Cap Rules:

- League-wide cap (~$255M in 2024)
- Cap hit = (annual salary + prorated signing bonus)
- Cutting players creates dead money (remaining guaranteed money)
- Rookie pool reserved (~$10M for draft picks)
- Hard cap in hard mode (cannot exceed)
- Soft cap in easy/medium mode (warnings but allowed)

9. Player Development

Description: Players improve or decline based on age, performance, and coaching.
Key Capabilities:

- Age-based progression (young players improve)
- Age-based regression (old players decline)
- Development traits (Superstar, Star, Normal, Slow)
- Coach impact on development
- Performance-based boosts (great season = extra progression)
- Morale impact on development
- View player potential (development ceiling)

10. Injuries
    Description: Realistic injury system affecting player availability.
    Key Capabilities:

- Random injuries during games
- Injury types (Hamstring, ACL, Concussion, etc.)
- Severity levels (Questionable, Doubtful, Out, IR, Season-Ending)
- Recovery timelines (1 week to season-ending)
- Injured Reserve (4-week minimum)
- Injury-prone player trait (higher injury risk)
- View injury report
- Adjust depth chart for injured players

Injury Mechanics:

- Base injury rate: ~2% per game
- Modified by player injury_prone rating
- Higher difficulty = more frequent injuries
- Injuries can occur to any player during simulation
- Recovery time based on severity
- Player returns automatically when healed

11. Team Chemistry & Morale

Description: Team cohesion affects on-field performance.
Key Capabilities:

- Track overall team chemistry (0-100)
- View offensive chemistry
- View defensive chemistry
- Locker room morale
- Chemistry affects game outcomes (+10 chemistry = +1-2 team performance)

12. Coaching & Staff
    Description: Hire and manage coaching staff and front office personnel.
    Key Capabilities:

- Hire/fire head coach
- Hire coordinators (OC, DC, ST)
- Hire position coaches
- Hire scouts, trainers, GM
- Coach ratings affect player development
- Coach salaries count against cap (difficulty-dependent)

Coach Impact:

- Head Coach (70-95 overall): ±2-3 points in games
- Coordinators (65-90): Affect offensive/defensive efficiency
- Position Coaches (60-85): Affect position-specific player development
- Scouts: Better scouts = more accurate draft evaluations
- Trainers: Better trainers = fewer injuries, faster recovery

13. Statistics & Records

Description: Track comprehensive player and team statistics.
Key Capabilities:

- Season stats for all players
- Career stats across multiple seasons
- League leaders (passing yards, rushing yards, sacks, etc.)
- Team records (wins, losses, points scored)
- Historical season records
- Awards tracking (MVP, OPOY, DPOY, Rookie of the Year)
