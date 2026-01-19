/**
 * Franchise Server Actions
 * Handles franchise creation, retrieval, and management
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database.types'

type Franchise = Database['public']['Tables']['franchises']['Row']
type Team = Database['public']['Tables']['teams']['Row']

interface CreateFranchiseData {
  teamId: string
  franchiseName: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export async function createFranchise(data: CreateFranchiseData) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login?error=You must be logged in to create a franchise')
  }

  // Validate inputs
  if (!data.teamId || !data.franchiseName.trim()) {
    throw new Error('Team and franchise name are required')
  }

  // Create the franchise first (without current_season_id)
  const { data: franchise, error: franchiseError } = await supabase
    .from('franchises')
    .insert({
      user_id: user.id,
      team_id: data.teamId,
      franchise_name: data.franchiseName.trim(),
      difficulty: data.difficulty,
      is_active: true,
    })
    .select()
    .single()

  if (franchiseError) {
    console.error('Franchise creation error:', franchiseError)
    throw new Error('Failed to create franchise: ' + franchiseError.message)
  }

  // Create initial season (2024, week 0, preseason)
  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .insert({
      franchise_id: franchise.id,
      year: 2024,
      current_week: 0,
      phase: 'preseason',
      is_template: false,
    })
    .select()
    .single()

  if (seasonError) {
    console.error('Season creation error:', seasonError)
    // Cleanup: delete the franchise if season creation fails
    await supabase.from('franchises').delete().eq('id', franchise.id)
    throw new Error('Failed to create season: ' + seasonError.message)
  }

  // Update franchise with current_season_id
  const { error: updateError } = await supabase
    .from('franchises')
    .update({ current_season_id: season.id })
    .eq('id', franchise.id)

  if (updateError) {
    console.error('Franchise update error:', updateError)
  }

  // Get all 32 teams to initialize standings and finances
  const { data: allTeams, error: teamsError } = await supabase
    .from('teams')
    .select('id')

  if (teamsError || !allTeams) {
    console.error('Teams fetch error:', teamsError)
    throw new Error('Failed to fetch teams')
  }

  // Initialize team_standings for all 32 teams
  const standingsData = allTeams.map(team => ({
    season_id: season.id,
    team_id: team.id,
    wins: 0,
    losses: 0,
    ties: 0,
    division_rank: 1,
    conference_rank: 1,
    points_for: 0,
    points_against: 0,
  }))

  const { error: standingsError } = await supabase
    .from('team_standings')
    .insert(standingsData)

  if (standingsError) {
    console.error('Standings creation error:', standingsError)
    // Non-critical, continue anyway
  }

  // Initialize team_finances for all 32 teams
  const financesData = allTeams.map(team => ({
    season_id: season.id,
    team_id: team.id,
    salary_cap: 255000000, // $255M
    cap_space: 255000000,  // Start with full cap available
    dead_money: 0,
    rollover_cap: 0,
  }))

  const { error: financesError } = await supabase
    .from('team_finances')
    .insert(financesData)

  if (financesError) {
    console.error('Finances creation error:', financesError)
    // Non-critical, continue anyway
  }

  // Revalidate and redirect
  revalidatePath('/dashboard')
  redirect(`/franchise/${franchise.id}`)
}

export async function getFranchises() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data: franchises, error } = await supabase
    .from('franchises')
    .select(`
      *,
      team:teams(*),
      current_season:seasons(*)
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching franchises:', error)
    return []
  }

  return franchises || []
}

export async function getFranchiseById(franchiseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: franchise, error } = await supabase
    .from('franchises')
    .select(`
      *,
      team:teams(*),
      current_season:seasons(*)
    `)
    .eq('id', franchiseId)
    .eq('user_id', user.id)
    .single()

  if (error || !franchise) {
    console.error('Error fetching franchise:', error)
    redirect('/dashboard')
  }

  return franchise
}

export async function getAllTeams(): Promise<Team[]> {
  const supabase = await createClient()

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('conference', { ascending: true })
    .order('division', { ascending: true })
    .order('city', { ascending: true })

  if (error) {
    console.error('Error fetching teams:', error)
    return []
  }

  return teams || []
}
