/**
 * Franchise Creation Wizard
 * 3-step wizard: Team Selection → Naming → Difficulty
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTeams } from "@/app/actions/franchises";
import FranchiseWizard from "./FranchiseWizard";

export default async function CreateFranchisePage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch all teams
  const teams = await getAllTeams();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your Franchise
          </h1>
          <p className="mt-2 text-gray-600">
            Choose your team and start building a championship dynasty
          </p>
        </div>

        <FranchiseWizard teams={teams} />
      </div>
    </div>
  );
}
