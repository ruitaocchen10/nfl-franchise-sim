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
    <div className="min-h-screen bg-bg-darkest py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 slide-up">
          <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', textShadow: '0 0 20px var(--glow-red)' }}>
            Create Your Franchise
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Choose your team and start building a championship dynasty
          </p>
        </div>

        <FranchiseWizard teams={teams} />
      </div>
    </div>
  );
}
