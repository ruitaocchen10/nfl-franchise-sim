/**
 * Free Agents Page
 * Sign free agents and manage player contracts
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { getFreeAgents, getCapSpace } from "@/app/actions/freeAgency";
import FreeAgentsList from "./FreeAgentsList";

interface FreeAgentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function FreeAgentsPage({ params }: FreeAgentsPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch franchise details
  const franchise = (await getFranchiseById(id)) as any;

  // Fetch free agents and cap space
  const freeAgentsResult = await getFreeAgents(id);
  const capSpaceResult = await getCapSpace(id);

  const freeAgents = freeAgentsResult.data || [];
  const capSpace = capSpaceResult.capSpace || 0;
  const salaryCap = capSpaceResult.salaryCap || 255000000;

  return (
    <div className="min-h-screen bg-bg-darkest">
      <FranchiseNavigation franchiseId={id} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 slide-up">
            <h1
              className="text-3xl font-bold uppercase tracking-wide"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              Free Agents
            </h1>
            <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
              Sign free agents and manage player contracts
            </p>
          </div>

          {/* Free Agents List */}
          <FreeAgentsList
            freeAgents={freeAgents}
            franchiseId={id}
            capSpace={capSpace}
            salaryCap={salaryCap}
          />
        </div>
      </main>
    </div>
  );
}
