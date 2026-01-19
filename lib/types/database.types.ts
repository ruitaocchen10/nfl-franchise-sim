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
          phase: 'preseason' | 'regular' | 'playoffs' | 'offseason' | 'draft' | 'free_agency'
          is_template: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          franchise_id?: string | null
          year: number
          current_week?: number
          phase?: 'preseason' | 'regular' | 'playoffs' | 'offseason' | 'draft' | 'free_agency'
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          franchise_id?: string | null
          year?: number
          current_week?: number
          phase?: 'preseason' | 'regular' | 'playoffs' | 'offseason' | 'draft' | 'free_agency'
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
      season_phase: 'preseason' | 'regular' | 'playoffs' | 'offseason' | 'draft' | 'free_agency'
      player_status: 'active' | 'injured_reserve' | 'practice_squad' | 'inactive'
      development_trait: 'superstar' | 'star' | 'normal' | 'slow'
    }
  }
}
