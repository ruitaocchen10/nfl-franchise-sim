# UI/UX Specifications

## Overview

This document provides detailed interface specifications for the NFL Franchise Simulator. All pages, components, and user interactions are documented here with visual references.

## Design System

### Colors

```
Primary: #1a56db (Blue)
Secondary: #16a34a (Green)
Accent: #dc2626 (Red)
Background: #ffffff (White)
Surface: #f9fafb (Light Gray)
Text Primary: #111827 (Dark Gray)
Text Secondary: #6b7280 (Medium Gray)
Border: #e5e7eb (Light Gray)
```

### Typography

- **Headings**: Big Shoulders, Bold, 24px-48px
- **Body**: Big Shoulders, Regular, 14px-16px
- **Captions**: Big Shoulders, Medium, 12px

### Spacing

- Use 4px grid system: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### Components

- **Border Radius**: 8px for cards, 4px for inputs
- **Shadows**: Subtle elevation for cards and modals
- **Buttons**: 40px height, 16px padding horizontal

## Page Specifications

### 1. Dashboard (Home)

**Route**: `/dashboard`
**Purpose**: Main hub after login, franchise overview

**Visual Reference**:

> Dashboard has a header with franchise name, 3-column layout with upcoming games (left), quick stats (center), and recent news (right)

**Layout Structure**:

```
┌─────────────────────────────────────────────┐
│ Header: Franchise Name + Season Info       │
├─────────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┬─────────┐ │
│ │ Record  │ Cap $   │ Next    │ Rank    │ │
│ │ 8-3     │ $25.2M  │ vs MIA  │ #3 AFC  │ │
│ └─────────┴─────────┴─────────┴─────────┘ │
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐│
│ │ Upcoming │ │  Quick   │ │    Recent    ││
│ │  Games   │ │ Actions  │ │    News      ││
│ │          │ │          │ │              ││
│ │ KC vs MIA│ │[Simulate]│ │ Player signed││
│ │ KC @ BUF │ │[Roster]  │ │ Injury report││
│ └──────────┘ └──────────┘ └──────────────┘│
└─────────────────────────────────────────────┘
```

**Components Needed**:

- `<DashboardHeader />` - Shows franchise name, season, record
- `<StatCard />` - Quick stat display (reusable)
- `<UpcomingGames />` - Next 3 games with simulate buttons
- `<QuickActions />` - Navigation shortcuts
- `<NewsFeed />` - Recent franchise updates

**Interactions**:

1. Click game → Navigate to game detail
2. Click "Simulate" → Trigger simulation, show loading, update with results
3. Click action button → Navigate to respective page

**State**:

- Loading state while fetching franchise data
- Empty state if no franchise created

---

### 2. Roster Management

**Route**: `/franchise/[id]/roster`
**Purpose**: View and manage team roster

**Layout Structure**:

```
┌─────────────────────────────────────────────┐
│ Roster (53 Players) | Cap: $225M/$255M     │
├─────────────────────────────────────────────┤
│ Filters: [Position ▼] [Search...] [Sort ▼] │
├─────────────────────────────────────────────┤
│ ┌──┬─────────┬────┬─────┬──────┬─────────┐ │
│ │#1│P.Mahomes│ QB │ 99  │ $45M │ [Cut]  │ │
│ │#2│T.Kelce  │ TE │ 95  │ $14M │ [Cut]  │ │
│ │#3│C.Jones  │ DL │ 96  │ $20M │ [Cut]  │ │
│ └──┴─────────┴────┴─────┴──────┴─────────┘ │
│              [Sign Free Agent]               │
└─────────────────────────────────────────────┘
```

**Components Needed**:

- `<RosterTable />` - Sortable, filterable table
- `<PlayerRow />` - Individual player entry
- `<FilterBar />` - Position filter, search, sort
- `<PlayerDetailModal />` - Click player to view details
- `<CutPlayerConfirmation />` - Confirmation dialog

**Interactions**:

1. Filter by position → Update table
2. Search by name → Filter results
3. Click player name → Open detail modal
4. Click "Cut" → Show confirmation, update roster on confirm
5. Sort by column → Re-order table

**Data Display**:

- Jersey number, Name, Position, Overall, Age, Contract, Actions
- Color code by position
- Highlight starters differently from backups

---

### 3. Depth Chart

**Route**: `/franchise/[id]/depth-chart`
**Purpose**: Set starting lineup and backups

**Layout Structure**:

```
┌─────────────────────────────────────────────┐
│              Depth Chart - Offense          │
├─────────────────────────────────────────────┤
│ QB               WR1             WR2        │
│ ┌─────────┐     ┌─────────┐    ┌─────────┐│
│ │Mahomes  │     │Hill     │    │Kelce    ││
│ │   99    │     │   92    │    │   95    ││
│ └─────────┘     └─────────┘    └─────────┘│
│ ┌─────────┐     ┌─────────┐    ┌─────────┐│
│ │Backup QB│     │Backup WR│    │Backup WR││
│ └─────────┘     └─────────┘    └─────────┘│
│                                             │
│ RB               OL              OL         │
│ [Similar layout for all positions]         │
└─────────────────────────────────────────────┘
```

**Components Needed**:

- `<DepthChartEditor />` - Main container
- `<PositionStack />` - Vertical stack of players for one position
- `<PlayerCard />` - Draggable player card
- `<EmptySlot />` - Drop zone for player

**Interactions**:

1. Drag player card → Move to new position
2. Click player → Show detail modal
3. Click "Auto-fill" → AI suggests optimal lineup
4. Click "Save" → Persist changes

**UX Considerations**:

- Drag-and-drop interface
- Visual feedback during drag
- Prevent invalid assignments (e.g., QB at WR)
- Show overall team rating changing in real-time

---

### 4. Game Simulation

**Route**: `/franchise/[id]/schedule`
**Purpose**: View schedule and simulate games

**Layout Structure**:

```
┌─────────────────────────────────────────────┐
│ Week 12 Schedule              [Sim Week]    │
├─────────────────────────────────────────────┤
│ ┌───────────────────────────────────────┐  │
│ │ KC Chiefs (8-3) vs MIA Dolphins (6-5) │  │
│ │ Sunday 1:00 PM                         │  │
│ │                [Simulate Game]         │  │
│ └───────────────────────────────────────┘  │
│ ┌───────────────────────────────────────┐  │
│ │ KC Chiefs @ BUF Bills (9-2)           │  │
│ │ Thursday 8:20 PM                       │  │
│ │                [Simulate Game]         │  │
│ └───────────────────────────────────────┘  │
│                                             │
│            [Simulate to Playoffs]           │
└─────────────────────────────────────────────┘
```

**Game Result Display**:

```
┌─────────────────────────────────────────────┐
│ FINAL                                       │
│ KC Chiefs      28   [View Box Score]        │
│ MIA Dolphins   24                           │
│                                             │
│ Top Performers:                             │
│ P. Mahomes: 315 YDS, 3 TD                   │
│ T. Hill: 125 YDS, 1 TD                      │
└─────────────────────────────────────────────┘
```

**Components Needed**:

- `<ScheduleView />` - List of games
- `<GameCard />` - Individual game display
- `<SimulationProgress />` - Loading state during sim
- `<GameResult />` - Score and highlights
- `<BoxScore />` - Detailed stats modal

**Interactions**:

1. Click "Simulate Game" → Show progress, display result
2. Click "Simulate Week" → Batch simulate, show results
3. Click "View Box Score" → Open detailed stats modal
4. Results persist immediately

---

### 5. Draft Board

**Route**: `/franchise/[id]/draft`
**Purpose**: Participate in NFL Draft

**Layout Structure**:

```
┌─────────────────────────────────────────────┐
│ 2025 NFL Draft - Round 1, Pick 15 (Your Pick)│
├─────────────────────────────────────────────┤
│ ┌────────────┬──────────────────────────┐  │
│ │ Prospects  │   Draft Board            │  │
│ │            │                          │  │
│ │[Filter ▼]  │ Pick 1: J. Smith (QB)    │  │
│ │            │         Selected by CIN  │  │
│ │ 1. T.Brown │ Pick 2: M. Williams (OL) │  │
│ │    QB-85   │         Selected by HOU  │  │
│ │    ⭐⭐⭐  │ ...                      │  │
│ │            │ Pick 15: [YOUR PICK]     │  │
│ │ 2. J.Adams │         [Make Pick]      │  │
│ │    WR-83   │                          │  │
│ │    ⭐⭐⭐  │                          │  │
│ └────────────┴──────────────────────────┘  │
│                                             │
│ Team Needs: QB, WR, DL                      │
└─────────────────────────────────────────────┘
```

**Components Needed**:

- `<DraftBoard />` - Main interface
- `<ProspectList />` - Available players
- `<ProspectCard />` - Player with scouting info
- `<DraftLog />` - Picks made so far
- `<TeamNeedsPanel />` - Position priorities
- `<ScoutingReport />` - Detailed player evaluation

**Interactions**:

1. Select prospect from list
2. Click "Make Pick" → Confirm selection, advance draft
3. Filter prospects by position
4. Sort by overall, position, need fit
5. AI teams auto-pick when their turn
6. Trade pick option (opens trade interface)

**Special States**:

- Your pick (active, can select)
- Other team's pick (inactive, auto-advances)
- Between rounds (break screen)

---

### 6. Trade Interface

**Route**: `/franchise/[id]/trades`
**Purpose**: Propose and evaluate trades

**Visual Reference**:

> [Figma screenshot placeholder]

**Layout Structure**:

```
┌─────────────────────────────────────────────┐
│ Trade with Buffalo Bills                    │
├─────────────────────────────────────────────┤
│ ┌─────────────┬─────────────┐              │
│ │ Chiefs Give │ Bills Give  │              │
│ ├─────────────┼─────────────┤              │
│ │ T. Kelce TE │ 1st Rd Pick │              │
│ │    $14M     │             │              │
│ │ [Remove]    │ [Remove]    │              │
│ │             │             │              │
│ │ [Add Player]│ [Add Player]│              │
│ │ [Add Pick]  │ [Add Pick]  │              │
│ └─────────────┴─────────────┘              │
│                                             │
│ Trade Value: Chiefs +15 | Bills -15 ❌     │
│ AI Opinion: Bills unlikely to accept       │
│                                             │
│           [Propose Trade]                   │
└─────────────────────────────────────────────┘
```

**Components Needed**:

- `<TradeBuilder />` - Main interface
- `<TradeAssetList />` - Players/picks being traded
- `<AssetSelector />` - Modal to choose assets
- `<TradeEvaluation />` - Fairness indicator
- `<AIFeedback />` - Likelihood of acceptance

**Interactions**:

1. Select team to trade with
2. Add players/picks to each side
3. Real-time evaluation updates
4. Submit proposal → AI evaluates → Response
5. View trade history

---

### 7. Free Agency

**Route**: `/franchise/[id]/free-agency`
**Purpose**: Sign available players

**Visual Reference**:

> [Figma screenshot placeholder]

**Layout Structure**:

```
┌─────────────────────────────────────────────┐
│ Free Agents - 2025 Offseason                │
├─────────────────────────────────────────────┤
│ Filters: [Position ▼] [Overall ▼]          │
├─────────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐   │
│ │ T. Brady, QB - 85 OVR                │   │
│ │ Market Value: $15M/year              │   │
│ │ Interest Level: ⭐⭐⭐⭐             │   │
│ │                     [Make Offer]     │   │
│ └──────────────────────────────────────┘   │
│ ┌──────────────────────────────────────┐   │
│ │ D. Hopkins, WR - 88 OVR              │   │
│ │ Market Value: $18M/year              │   │
│ │ Interest Level: ⭐⭐⭐               │   │
│ │                     [Make Offer]     │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Offer Modal**:

```
┌─────────────────────────────────────────────┐
│ Contract Offer to T. Brady                  │
├─────────────────────────────────────────────┤
│ Years:      [1 ▼] [2] [3] [4]               │
│ Total:      $________                       │
│ Per Year:   $________                       │
│ Guaranteed: $________                       │
│ Bonus:      $________                       │
│                                             │
│ Salary Cap Impact: $15M                     │
│ Cap Space After: $10.2M                     │
│                                             │
│ Player Interest: 65% likely to accept       │
│                                             │
│         [Submit Offer] [Cancel]             │
└─────────────────────────────────────────────┘
```

**Components Needed**:

- `<FreeAgentList />` - Available players
- `<FreeAgentCard />` - Player summary
- `<OfferModal />` - Contract proposal form
- `<InterestMeter />` - Likelihood of acceptance
- `<ActiveOffers />` - Pending negotiations

**Interactions**:

1. Browse free agents
2. Filter by position/rating
3. Click "Make Offer" → Open modal
4. Fill contract details → Submit
5. Receive acceptance/rejection/counter
6. View active negotiations

---

## User Flows

### Critical User Flow: Creating First Franchise

```
1. [Login Page] → User enters credentials
   ↓
2. [Dashboard - Empty State] → "Create Your First Franchise"
   ↓
3. [Franchise Creation Wizard]
   - Step 1: Choose Team (grid of 32 teams)
   - Step 2: Name Franchise
   - Step 3: Select Difficulty
   ↓
4. [Loading] → "Building your franchise..." (copy template season)
   ↓
5. [Dashboard - Active Franchise] → Show franchise overview
```

### Critical User Flow: Simulating First Game

```
1. [Dashboard] → Click "Upcoming Games"
   ↓
2. [Schedule View] → See next game
   ↓
3. [Game Card] → Click "Simulate Game"
   ↓
4. [Simulation Progress] → Loading spinner (1-2 seconds)
   ↓
5. [Game Result] → Show final score + key stats
   ↓
6. [Updated Schedule] → Game marked complete, next game available
```

### Critical User Flow: Making First Draft Pick

```
1. [Dashboard] → Season advances to Draft
   ↓
2. [Draft Notification] → "Draft starts in 2 days"
   ↓
3. [Draft Day] → Navigate to Draft Board
   ↓
4. [Draft Board] → View available prospects
   ↓
5. [Your Pick] → Select player, click "Make Pick"
   ↓
6. [Confirmation] → Player added to roster
   ↓
7. [Draft Continues] → AI teams make picks, advance to next round
```

---

## Responsive Design

### Breakpoints

- **Mobile**: < 640px (single column)
- **Tablet**: 640px - 1024px (two column)
- **Desktop**: > 1024px (three column)

### Mobile Considerations

- Stack cards vertically
- Hamburger menu for navigation
- Simplified tables (hide less important columns)
- Touch-friendly buttons (44px minimum)

---

## Accessibility

- All interactive elements keyboard accessible
- ARIA labels on all icons and buttons
- Color contrast ratio ≥ 4.5:1
- Focus indicators visible
- Screen reader friendly tables
- Form validation messages

---

## Animation & Transitions

- Page transitions: 200ms ease
- Button hover: 150ms
- Modal open/close: 300ms ease-out
- Drag and drop: Immediate feedback
- Simulation progress: Smooth loading states

---
