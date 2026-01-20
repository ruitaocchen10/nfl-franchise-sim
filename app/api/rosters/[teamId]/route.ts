/**
 * API Route: Get Team Roster
 * Fetches roster for a specific team
 */

import { NextRequest, NextResponse } from "next/server";
import { getLeagueRosters } from "@/app/actions/roster";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const franchiseId = searchParams.get("franchiseId");

    if (!franchiseId) {
      return NextResponse.json(
        { error: "franchiseId is required" },
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Fetch roster for specific team
    const roster = await getLeagueRosters(franchiseId, teamId);

    return NextResponse.json({ roster });
  } catch (error) {
    console.error("Error in roster API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch roster" },
      { status: 500 }
    );
  }
}
