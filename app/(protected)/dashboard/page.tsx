/**
 * Dashboard Page
 * Main hub for authenticated users
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navigation from "@/components/layout/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import Link from "next/link";
import { getFranchises } from "@/app/actions/franchises";
import FranchiseCard from "./FranchiseCard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's franchises
  const franchises = await getFranchises();

  return (
    <div className="min-h-screen bg-bg-darkest">
      <Navigation userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-6 slide-up">
            <h1 className="text-3xl font-bold text-text-primary uppercase tracking-wide" style={{ fontFamily: "var(--font-display)" }}>Dashboard</h1>
            <p className="mt-2 text-text-secondary">
              Welcome back! Manage your franchises and build your dynasty.
            </p>
          </div>

          {/* Main Content */}
          {franchises.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary mb-6">
                  You don't have any franchises yet. Create your first franchise
                  to start your GM career!
                </p>

                <div className="bg-bg-light border border-accent-cyan rounded-md p-4 mb-6" style={{ boxShadow: "0 0 15px rgba(0, 217, 255, 0.2)" }}>
                  <h3 className="text-lg font-semibold text-text-primary mb-2 uppercase tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                    What You Can Do:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-text-secondary">
                    <li>Choose from all 32 NFL teams</li>
                    <li>Manage your 53-man roster</li>
                    <li>Draft future stars</li>
                    <li>Make trades with other teams</li>
                    <li>Simulate games and seasons</li>
                    <li>Build a championship dynasty</li>
                  </ul>
                </div>

                <Link
                  href="/franchises/create"
                  className="btn-primary-glow inline-flex items-center px-6 py-3 border border-transparent text-base font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:-translate-y-0.5"
                  style={{
                    fontFamily: "var(--font-display)",
                    background: "linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)",
                  }}
                >
                  Create Your First Franchise
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary uppercase tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
                  Your Franchises
                </h2>
                <Link
                  href="/franchises/create"
                  className="btn-primary-glow inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold uppercase tracking-wider rounded-lg text-white transition-all hover:-translate-y-0.5"
                  style={{
                    fontFamily: "var(--font-display)",
                    background: "linear-gradient(135deg, #ff2943 0%, #ff3d5c 100%)",
                  }}
                >
                  Create New Franchise
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {franchises.map((franchise: any) => (
                  <FranchiseCard key={franchise.id} franchise={franchise} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
