/**
 * Prospects Page
 * Scout prospects and manage draft picks
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface ProspectsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProspectsPage({ params }: ProspectsPageProps) {
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
              Prospects
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Scout prospects and manage your draft picks
            </p>
          </div>

          {/* Coming Soon Card */}
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'var(--text-secondary)' }}>
                The draft and scouting feature is currently under development. You'll be able to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>Scout college prospects</li>
                <li>View draft boards and rankings</li>
                <li>Manage your draft picks</li>
                <li>Participate in the NFL Draft</li>
                <li>Trade draft picks</li>
                <li>View player projections and potential</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
