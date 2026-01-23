/**
 * Free Agents Page
 * Sign free agents and manage player contracts
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

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

  return (
    <div className="min-h-screen bg-bg-darkest">
      <FranchiseNavigation franchiseId={id} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 slide-up">
            <h1 className="text-3xl font-bold uppercase tracking-wide" style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)'
            }}>
              Free Agents
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Sign free agents and manage player contracts
            </p>
          </div>

          {/* Coming Soon Card */}
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'var(--text-secondary)' }}>
                The free agency feature is currently under development. You'll be able to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>Browse available free agents</li>
                <li>Filter by position, rating, and salary</li>
                <li>Sign players to contracts</li>
                <li>Manage salary cap space</li>
                <li>View contract details and negotiations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
