/**
 * Database Type Definitions
 * These types represent the core database schema for the NFL Franchise Simulator
 * Generated based on /docs/database-schema.md
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Core user and franchise tables
      franchises: {
        Row: {
          id: string
          user_id: string
          team_id: string
          franchise_name: string
          current_season_id: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          franchise_name: string
          current_season_id?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          franchise_name?: string
          current_season_id?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          abbreviation: string
          city: string
          name: string
          conference: 'AFC' | 'NFC'
          division: 'East' | 'West' | 'North' | 'South'
          primary_color: string
          secondary_color: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          abbreviation: string
          city: string
          name: string
          conference: 'AFC' | 'NFC'
          division: 'East' | 'West' | 'North' | 'South'
          primary_color: string
          secondary_color: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          abbreviation?: string
          city?: string
          name?: string
          conference?: 'AFC' | 'NFC'
          division?: 'East' | 'West' | 'North' | 'South'
          primary_color?: string
          secondary_color?: string
          logo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          id: string
          franchise_id: string | null
          year: number
          current_week: number
          simulation_date: string | null
          season_start_date: string | null
          trade_deadline_passed: boolean
          phase: 'offseason' | 'free_agency' | 'draft' | 'training_camp' | 'preseason' | 'regular_season' | 'postseason'
          is_template: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          franchise_id?: string | null
          year: number
          current_week?: number
          simulation_date?: string | null
          season_start_date?: string | null
          trade_deadline_passed?: boolean
          phase?: 'offseason' | 'free_agency' | 'draft' | 'training_camp' | 'preseason' | 'regular_season' | 'postseason'
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          franchise_id?: string | null
          year?: number
          current_week?: number
          simulation_date?: string | null
          season_start_date?: string | null
          trade_deadline_passed?: boolean
          phase?: 'offseason' | 'free_agency' | 'draft' | 'training_camp' | 'preseason' | 'regular_season' | 'postseason'
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          first_name: string
          last_name: string
          position: string
          college: string | null
          draft_year: number | null
          draft_round: number | null
          draft_pick: number | null
          height_inches: number | null
          weight_lbs: number | null
          created_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          position: string
          college?: string | null
          draft_year?: number | null
          draft_round?: number | null
          draft_pick?: number | null
          height_inches?: number | null
          weight_lbs?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          position?: string
          college?: string | null
          draft_year?: number | null
          draft_round?: number | null
          draft_pick?: number | null
          height_inches?: number | null
          weight_lbs?: number | null
          created_at?: string
        }
        Relationships: []
      }
      player_attributes: {
        Row: {
          id: string
          player_id: string
          season_id: string
          age: number
          overall_rating: number
          speed: number
          strength: number
          agility: number
          awareness: number
          injury_prone: number
          development_trait: 'superstar' | 'star' | 'normal' | 'slow'
          morale: number
          years_pro: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          season_id: string
          age: number
          overall_rating: number
          speed: number
          strength: number
          agility: number
          awareness: number
          injury_prone?: number
          development_trait?: 'superstar' | 'star' | 'normal' | 'slow'
          morale?: number
          years_pro?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          season_id?: string
          age?: number
          overall_rating?: number
          speed?: number
          strength?: number
          agility?: number
          awareness?: number
          injury_prone?: number
          development_trait?: 'superstar' | 'star' | 'normal' | 'slow'
          morale?: number
          years_pro?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      roster_spots: {
        Row: {
          id: string
          season_id: string
          team_id: string
          player_id: string
          jersey_number: number | null
          status: 'active' | 'injured_reserve' | 'practice_squad' | 'inactive'
          depth_position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          season_id: string
          team_id: string
          player_id: string
          jersey_number?: number | null
          status?: 'active' | 'injured_reserve' | 'practice_squad' | 'inactive'
          depth_position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          team_id?: string
          player_id?: string
          jersey_number?: number | null
          status?: 'active' | 'injured_reserve' | 'practice_squad' | 'inactive'
          depth_position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          player_id: string
          team_id: string
          season_id: string
          total_value: number
          years_remaining: number
          annual_salary: number
          guaranteed_money: number
          signing_bonus: number
          cap_hit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          team_id: string
          season_id: string
          total_value: number
          years_remaining: number
          annual_salary: number
          guaranteed_money: number
          signing_bonus?: number
          cap_hit: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          team_id?: string
          season_id?: string
          total_value?: number
          years_remaining?: number
          annual_salary?: number
          guaranteed_money?: number
          signing_bonus?: number
          cap_hit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_standings: {
        Row: {
          id: string
          season_id: string
          team_id: string
          wins: number
          losses: number
          ties: number
          division_rank: number
          conference_rank: number
          points_for: number
          points_against: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          season_id: string
          team_id: string
          wins?: number
          losses?: number
          ties?: number
          division_rank?: number
          conference_rank?: number
          points_for?: number
          points_against?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          team_id?: string
          wins?: number
          losses?: number
          ties?: number
          division_rank?: number
          conference_rank?: number
          points_for?: number
          points_against?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_finances: {
        Row: {
          id: string
          season_id: string
          team_id: string
          salary_cap: number
          cap_space: number
          dead_money: number
          rollover_cap: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          season_id: string
          team_id: string
          salary_cap?: number
          cap_space: number
          dead_money?: number
          rollover_cap?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          team_id?: string
          salary_cap?: number
          cap_space?: number
          dead_money?: number
          rollover_cap?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          season_id: string
          week: number
          game_date: string | null
          game_time_slot: 'early_window' | 'late_window' | 'snf' | 'mnf' | 'tnf' | 'saturday' | 'thanksgiving' | null
          game_type: 'preseason' | 'regular' | 'wildcard' | 'divisional' | 'conference' | 'superbowl'
          home_team_id: string
          away_team_id: string
          home_score: number | null
          away_score: number | null
          simulated: boolean
          simulated_at: string | null
          overtime: boolean
          weather: 'clear' | 'rain' | 'snow' | 'wind' | 'dome'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          season_id: string
          week: number
          game_date?: string | null
          game_time_slot?: 'early_window' | 'late_window' | 'snf' | 'mnf' | 'tnf' | 'saturday' | 'thanksgiving' | null
          game_type?: 'preseason' | 'regular' | 'wildcard' | 'divisional' | 'conference' | 'superbowl'
          home_team_id: string
          away_team_id: string
          home_score?: number | null
          away_score?: number | null
          simulated?: boolean
          simulated_at?: string | null
          overtime?: boolean
          weather?: 'clear' | 'rain' | 'snow' | 'wind' | 'dome'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          week?: number
          game_date?: string | null
          game_time_slot?: 'early_window' | 'late_window' | 'snf' | 'mnf' | 'tnf' | 'saturday' | 'thanksgiving' | null
          game_type?: 'preseason' | 'regular' | 'wildcard' | 'divisional' | 'conference' | 'superbowl'
          home_team_id?: string
          away_team_id?: string
          home_score?: number | null
          away_score?: number | null
          simulated?: boolean
          simulated_at?: string | null
          overtime?: boolean
          weather?: 'clear' | 'rain' | 'snow' | 'wind' | 'dome'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_stats: {
        Row: {
          id: string
          game_id: string
          player_id: string
          team_id: string
          pass_attempts: number
          pass_completions: number
          pass_yards: number
          pass_tds: number
          interceptions: number
          sacks_taken: number
          rush_attempts: number
          rush_yards: number
          rush_tds: number
          fumbles: number
          fumbles_lost: number
          targets: number
          receptions: number
          receiving_yards: number
          receiving_tds: number
          drops: number
          tackles: number
          assists: number
          sacks: number
          tackles_for_loss: number
          forced_fumbles: number
          fumble_recoveries: number
          interceptions_defense: number
          pass_deflections: number
          defensive_tds: number
          field_goals_made: number
          field_goals_attempted: number
          longest_field_goal: number
          extra_points_made: number
          extra_points_attempted: number
          punts: number
          punt_yards: number
          inside_20: number
          touchbacks: number
          kick_returns: number
          kick_return_yards: number
          punt_returns: number
          punt_return_yards: number
          return_tds: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          team_id: string
          pass_attempts?: number
          pass_completions?: number
          pass_yards?: number
          pass_tds?: number
          interceptions?: number
          sacks_taken?: number
          rush_attempts?: number
          rush_yards?: number
          rush_tds?: number
          fumbles?: number
          fumbles_lost?: number
          targets?: number
          receptions?: number
          receiving_yards?: number
          receiving_tds?: number
          drops?: number
          tackles?: number
          assists?: number
          sacks?: number
          tackles_for_loss?: number
          forced_fumbles?: number
          fumble_recoveries?: number
          interceptions_defense?: number
          pass_deflections?: number
          defensive_tds?: number
          field_goals_made?: number
          field_goals_attempted?: number
          longest_field_goal?: number
          extra_points_made?: number
          extra_points_attempted?: number
          punts?: number
          punt_yards?: number
          inside_20?: number
          touchbacks?: number
          kick_returns?: number
          kick_return_yards?: number
          punt_returns?: number
          punt_return_yards?: number
          return_tds?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          team_id?: string
          pass_attempts?: number
          pass_completions?: number
          pass_yards?: number
          pass_tds?: number
          interceptions?: number
          sacks_taken?: number
          rush_attempts?: number
          rush_yards?: number
          rush_tds?: number
          fumbles?: number
          fumbles_lost?: number
          targets?: number
          receptions?: number
          receiving_yards?: number
          receiving_tds?: number
          drops?: number
          tackles?: number
          assists?: number
          sacks?: number
          tackles_for_loss?: number
          forced_fumbles?: number
          fumble_recoveries?: number
          interceptions_defense?: number
          pass_deflections?: number
          defensive_tds?: number
          field_goals_made?: number
          field_goals_attempted?: number
          longest_field_goal?: number
          extra_points_made?: number
          extra_points_attempted?: number
          punts?: number
          punt_yards?: number
          inside_20?: number
          touchbacks?: number
          kick_returns?: number
          kick_return_yards?: number
          punt_returns?: number
          punt_return_yards?: number
          return_tds?: number
          created_at?: string
        }
        Relationships: []
      }
      game_events: {
        Row: {
          id: string
          game_id: string
          quarter: number
          time_remaining: string
          event_type: 'touchdown' | 'field_goal' | 'turnover' | 'injury' | 'big_play' | 'safety' | 'two_point' | 'game_winning'
          description: string
          player_id: string | null
          player2_id: string | null
          yards: number
          scoring_play: boolean
          points_scored: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          quarter: number
          time_remaining: string
          event_type: 'touchdown' | 'field_goal' | 'turnover' | 'injury' | 'big_play' | 'safety' | 'two_point' | 'game_winning'
          description: string
          player_id?: string | null
          player2_id?: string | null
          yards?: number
          scoring_play?: boolean
          points_scored?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          quarter?: number
          time_remaining?: string
          event_type?: 'touchdown' | 'field_goal' | 'turnover' | 'injury' | 'big_play' | 'safety' | 'two_point' | 'game_winning'
          description?: string
          player_id?: string | null
          player2_id?: string | null
          yards?: number
          scoring_play?: boolean
          points_scored?: number
          created_at?: string
        }
        Relationships: []
      }
      season_stats: {
        Row: {
          id: string
          player_id: string
          season_id: string
          team_id: string
          games_played: number
          games_started: number
          pass_attempts: number
          pass_completions: number
          pass_yards: number
          pass_tds: number
          interceptions: number
          sacks_taken: number
          rush_attempts: number
          rush_yards: number
          rush_tds: number
          fumbles: number
          fumbles_lost: number
          targets: number
          receptions: number
          receiving_yards: number
          receiving_tds: number
          drops: number
          tackles: number
          assists: number
          sacks: number
          tackles_for_loss: number
          forced_fumbles: number
          fumble_recoveries: number
          interceptions_defense: number
          pass_deflections: number
          defensive_tds: number
          field_goals_made: number
          field_goals_attempted: number
          longest_field_goal: number
          extra_points_made: number
          extra_points_attempted: number
          punts: number
          punt_yards: number
          inside_20: number
          touchbacks: number
          kick_returns: number
          kick_return_yards: number
          punt_returns: number
          punt_return_yards: number
          return_tds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player_id: string
          season_id: string
          team_id: string
          games_played?: number
          games_started?: number
          pass_attempts?: number
          pass_completions?: number
          pass_yards?: number
          pass_tds?: number
          interceptions?: number
          sacks_taken?: number
          rush_attempts?: number
          rush_yards?: number
          rush_tds?: number
          fumbles?: number
          fumbles_lost?: number
          targets?: number
          receptions?: number
          receiving_yards?: number
          receiving_tds?: number
          drops?: number
          tackles?: number
          assists?: number
          sacks?: number
          tackles_for_loss?: number
          forced_fumbles?: number
          fumble_recoveries?: number
          interceptions_defense?: number
          pass_deflections?: number
          defensive_tds?: number
          field_goals_made?: number
          field_goals_attempted?: number
          longest_field_goal?: number
          extra_points_made?: number
          extra_points_attempted?: number
          punts?: number
          punt_yards?: number
          inside_20?: number
          touchbacks?: number
          kick_returns?: number
          kick_return_yards?: number
          punt_returns?: number
          punt_return_yards?: number
          return_tds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          season_id?: string
          team_id?: string
          games_played?: number
          games_started?: number
          pass_attempts?: number
          pass_completions?: number
          pass_yards?: number
          pass_tds?: number
          interceptions?: number
          sacks_taken?: number
          rush_attempts?: number
          rush_yards?: number
          rush_tds?: number
          fumbles?: number
          fumbles_lost?: number
          targets?: number
          receptions?: number
          receiving_yards?: number
          receiving_tds?: number
          drops?: number
          tackles?: number
          assists?: number
          sacks?: number
          tackles_for_loss?: number
          forced_fumbles?: number
          fumble_recoveries?: number
          interceptions_defense?: number
          pass_deflections?: number
          defensive_tds?: number
          field_goals_made?: number
          field_goals_attempted?: number
          longest_field_goal?: number
          extra_points_made?: number
          extra_points_attempted?: number
          punts?: number
          punt_yards?: number
          inside_20?: number
          touchbacks?: number
          kick_returns?: number
          kick_return_yards?: number
          punt_returns?: number
          punt_return_yards?: number
          return_tds?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_bye_weeks: {
        Row: {
          id: string
          season_id: string
          team_id: string
          bye_week_number: number
          bye_week_date: string
          created_at: string
        }
        Insert: {
          id?: string
          season_id: string
          team_id: string
          bye_week_number: number
          bye_week_date: string
          created_at?: string
        }
        Update: {
          id?: string
          season_id?: string
          team_id?: string
          bye_week_number?: number
          bye_week_date?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_level: 'easy' | 'medium' | 'hard'
      conference: 'AFC' | 'NFC'
      division: 'East' | 'West' | 'North' | 'South'
      season_phase: 'offseason' | 'free_agency' | 'draft' | 'training_camp' | 'preseason' | 'regular_season' | 'postseason'
      player_status: 'active' | 'injured_reserve' | 'practice_squad' | 'inactive'
      development_trait: 'superstar' | 'star' | 'normal' | 'slow'
      game_type: 'preseason' | 'regular' | 'wildcard' | 'divisional' | 'conference' | 'superbowl'
      game_time_slot: 'early_window' | 'late_window' | 'snf' | 'mnf' | 'tnf' | 'saturday' | 'thanksgiving'
      weather_type: 'clear' | 'rain' | 'snow' | 'wind' | 'dome'
      event_type: 'touchdown' | 'field_goal' | 'turnover' | 'injury' | 'big_play' | 'safety' | 'two_point' | 'game_winning'
    }
  }
}
