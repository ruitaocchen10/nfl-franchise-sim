/**
 * Trades Page
 * Negotiate trades with other teams
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FranchiseNavigation from "@/components/layout/FranchiseNavigation";
import { getFranchiseById } from "@/app/actions/franchises";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

interface TradesPageProps {
  params: Promise<{ id: string }>;
}

export default async function TradesPage({ params }: TradesPageProps) {
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
              Trades
            </h1>
            <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
              Negotiate trades with other teams
            </p>
          </div>

          {/* Coming Soon Card */}
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p style={{ color: 'var(--text-secondary)' }}>
                The trades feature is currently under development. You'll be able to:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2" style={{ color: 'var(--text-secondary)' }}>
                <li>Propose trades with other teams</li>
                <li>View trade offers from AI teams</li>
                <li>Negotiate player and draft pick swaps</li>
                <li>Review trade history</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
