import { createClient } from "@supabase/supabase-js";

async function checkDuplicates() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get template season
  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_template", true)
    .single();

  const seasonId = season!.id;

  // Load all roster spots in batches
  const batchSize = 1000;
  let offset = 0;
  let allRosterSpots: any[] = [];

  while (true) {
    const { data } = await supabase
      .from("roster_spots")
      .select(
        "player_id, team_id, teams(abbreviation), players(first_name, last_name)",
      )
      .eq("season_id", seasonId)
      .eq("status", "active")
      .range(offset, offset + batchSize - 1);

    if (!data || data.length === 0) break;
    allRosterSpots = allRosterSpots.concat(data);
    offset += batchSize;
    if (data.length < batchSize) break;
  }

  // Find duplicates
  const playerMap: Record<
    string,
    Array<{ team: string; name: string }>
  > = {};

  allRosterSpots.forEach((spot) => {
    const playerId = spot.player_id;
    const team = spot.teams?.abbreviation || "UNKNOWN";
    const name = `${spot.players?.first_name} ${spot.players?.last_name}`;

    if (!playerMap[playerId]) {
      playerMap[playerId] = [];
    }
    playerMap[playerId].push({ team, name });
  });

  // Find players on multiple teams
  const duplicates = Object.entries(playerMap).filter(
    ([_, teams]) => teams.length > 1,
  );

  console.log("Total roster_spots:", allRosterSpots.length);
  console.log("Unique players:", Object.keys(playerMap).length);
  console.log("Players on multiple teams:", duplicates.length);
  console.log("\nFirst 20 duplicates:");

  duplicates.slice(0, 20).forEach(([playerId, teams], idx) => {
    const teamList = teams.map((t) => t.team).join(", ");
    console.log(`${idx + 1}. ${teams[0].name} - Teams: ${teamList}`);
  });
}

checkDuplicates();
